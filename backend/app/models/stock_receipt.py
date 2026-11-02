from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StockReceipt(Base):
    __tablename__ = "stock_receipts"
    __table_args__ = (
        UniqueConstraint("receipt_number", name="receipt_number_UNIQUE"),
        Index("fk_stock_receipts_suppliers1_idx", "supplier_id"),
        Index("fk_stock_receipts_users1_idx", "recorded_by"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "suppliers.id",
            name="fk_stock_receipts_suppliers1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    receipt_number: Mapped[str] = mapped_column(String(155), nullable=False)
    supplier_invoice_number: Mapped[str | None] = mapped_column(
        String(155), nullable=True
    )
    received_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(45), nullable=False)
    recorded_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "users.id",
            name="fk_stock_receipts_users1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(LONGTEXT, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)