from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SaleItemModifier(Base):
    __tablename__ = "sale_item_modifiers"
    __table_args__ = (
        Index("fk_sale_item_modifiers_sale_items1_idx", "sale_item_id"),
        Index("fk_sale_item_modifiers_modifiers1_idx", "modifier_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sale_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "sale_items.id",
            name="fk_sale_item_modifiers_sale_items1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    modifier_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "modifiers.id",
            name="fk_sale_item_modifiers_modifiers1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=True,
    )
    modifier_name_snapshot: Mapped[str] = mapped_column(String(155), nullable=False)
    price_adjustment_snapshot: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    customization_type: Mapped[str] = mapped_column(String(45), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)