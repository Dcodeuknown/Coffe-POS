from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SaleItem(Base):
    __tablename__ = "sale_items"
    __table_args__ = (
        Index("fk_sale_items_sales1_idx", "sale_id"),
        Index("fk_sale_items_menu_variants1_idx", "menu_variant_id"),
        Index("fk_sale_items_recipe_versions1_idx", "recipe_version_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sale_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "sales.id",
            name="fk_sale_items_sales1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    menu_variant_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "menu_variants.id",
            name="fk_sale_items_menu_variants1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    recipe_version_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "recipe_versions.id",
            name="fk_sale_items_recipe_versions1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    item_name_snapshot: Mapped[str] = mapped_column(String(155), nullable=False)
    variant_name_snapshot: Mapped[str] = mapped_column(String(155), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)