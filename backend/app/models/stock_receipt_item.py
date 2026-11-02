from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StockReceiptItem(Base):
    __tablename__ = "stock_receipt_items"
    __table_args__ = (
        Index("fk_stock_receipt_items_stock_receipts1_idx", "stock_receipt_id"),
        Index("fk_stock_receipt_items_ingredients1_idx", "ingredient_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    stock_receipt_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "stock_receipts.id",
            name="fk_stock_receipt_items_stock_receipts1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    ingredient_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ingredients.id",
            name="fk_stock_receipt_items_ingredients1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    quantity_received: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    received_unit: Mapped[str] = mapped_column(String(45), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
