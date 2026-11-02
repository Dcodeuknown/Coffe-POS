from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    __table_args__ = (
        Index("fk_recipe_ingredients_recipe_versions1_idx", "recipe_version_id"),
        Index("fk_recipe_ingredients_ingredients1_idx", "ingredient_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recipe_version_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "recipe_versions.id",
            name="fk_recipe_ingredients_recipe_versions1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    ingredient_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ingredients.id",
            name="fk_recipe_ingredients_ingredients1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    quantity_required: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    unit: Mapped[str] = mapped_column(String(45), nullable=False)
