from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        Index("fk_stock_movements_ingredients1_idx", "ingredient_id"),
        Index("fk_stock_movements_stock_receipt_items1_idx", "stock_receipt_item_id"),
        Index(
            "fk_stock_movements_sale_ingredient_consumptions1_idx",
            "sale_ingredient_consumption_id",
        ),
        Index("fk_stock_movements_users1_idx", "recorded_by"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ingredient_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ingredients.id",
            name="fk_stock_movements_ingredients1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    movement_type: Mapped[str] = mapped_column(String(45), nullable=False)
    quantity_change: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    stock_receipt_item_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "stock_receipt_items.id",
            name="fk_stock_movements_stock_receipt_items1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=True,
    )
    sale_ingredient_consumption_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "sale_ingredient_consumptions.id",
            name="fk_stock_movements_sale_ingredient_consumptions1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=True,
    )
    recorded_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "users.id",
            name="fk_stock_movements_users1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    reason: Mapped[str | None] = mapped_column(MEDIUMTEXT, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
