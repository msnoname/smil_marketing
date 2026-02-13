from __future__ import annotations
from uuid import UUID
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Country(Base):
    __tablename__ = "country"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, index=True)
    country_cn: Mapped[str] = mapped_column(String(100), nullable=False)
    country_en: Mapped[str] = mapped_column(String(100), nullable=False)
