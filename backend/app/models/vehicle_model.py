from __future__ import annotations
from uuid import UUID
from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class VehicleModel(Base):
    """车型：按国家维度，brand 为品牌，model 为车型名称（可含品牌前缀）"""
    __tablename__ = "model"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, index=True)
    country_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("country.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    model_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    original_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cn_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    en_url: Mapped[str | None] = mapped_column(String(500), nullable=True)


# class ModelFile(Base):
#     """车型上传文件：按 sort_order 顺序合成 PDF 等后续处理"""
#     __tablename__ = "model_file"

#     id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, index=True)
#     model_id: Mapped[UUID] = mapped_column(
#         PG_UUID(as_uuid=True),
#         ForeignKey("model.id", ondelete="CASCADE"),
#         nullable=False,
#         index=True,
#     )
#     sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
#     file_path: Mapped[str] = mapped_column(String(500), nullable=False)
#     original_name: Mapped[str] = mapped_column(String(255), nullable=False)
#     content_type: Mapped[str] = mapped_column(String(100), nullable=False)
