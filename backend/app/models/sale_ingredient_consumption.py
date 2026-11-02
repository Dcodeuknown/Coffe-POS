from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SaleIngredientConsumption(Base):
    __tablename__ = "sale_ingredient_consumptions"
    __table_args__ = (
        Index("fk_sale_ingredient_consumptions_sale_items1_idx", "sale_item_id"),
        Index("fk_sale_ingredient_consumptions_ingredients1_idx", "ingredient_id"),
        Index(
            "fk_sale_ingredient_consumptions_recipe_versions1_idx",
            "recipe_version_id",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sale_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "sale_items.id",
            name="fk_sale_ingredient_consumptions_sale_items1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    ingredient_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ingredients.id",
            name="fk_sale_ingredient_consumptions_ingredients1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    recipe_version_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "recipe_versions.id",
            name="fk_sale_ingredient_consumptions_recipe_versions1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    quantity_consumed: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    unit: Mapped[str] = mapped_column(String(45), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
