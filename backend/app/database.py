"""
SQLite 数据库配置（SQLAlchemy 2.0，同步驱动，无需 aiosqlite）
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# 项目根目录下的 db 目录存放 SQLite 文件
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db")
os.makedirs(DB_DIR, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'smil_marketing.db')}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db():
    """创建表（如有 Base 子类）"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """依赖：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
