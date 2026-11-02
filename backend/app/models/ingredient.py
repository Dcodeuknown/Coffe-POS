from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Ingredient(Base):
    __tablename__ = "ingredients"
    __table_args__ = (UniqueConstraint("name", name="name_UNIQUE"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(155), nullable=False)
    base_unit: Mapped[str] = mapped_column(String(155), nullable=False)
    current_quantity: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    low_stock_threshold: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    is_active: Mapped[int] = mapped_column(TINYINT(display_width=4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
