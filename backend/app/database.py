"""
Supabase Postgres 数据库配置（SQLAlchemy 2.0，同步驱动）
"""
import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# 加载环境变量（从 .env 文件）
load_dotenv()

# 从环境变量读取 Supabase Postgres 连接串
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")

if not SUPABASE_DB_URL:
    raise RuntimeError(
        "SUPABASE_DB_URL 未配置。请在 .env 文件中设置，格式：\n"
        "SUPABASE_DB_URL=postgresql+psycopg://postgres.xxxxx:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
    )

# 创建 Postgres 引擎
engine = create_engine(
    SUPABASE_DB_URL,
    echo=False,  # 设为 True 可查看 SQL 日志
    pool_pre_ping=True,  # 连接前检查连接是否有效
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db():
    """创建表（如有 Base 子类）"""
    # 注意：生产环境建议使用 Alembic 迁移工具，而不是 create_all
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
