from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ModifierIngredientEffect(Base):
    __tablename__ = "modifier_ingredient_effects"
    __table_args__ = (
        Index("fk_modifier_ingredient_effects_modifiers1_idx", "modifier_id"),
        Index("fk_modifier_ingredient_effects_ingredients1_idx", "ingredient_id"),
        Index(
            "fk_modifier_ingredient_effects_ingredients2_idx",
            "replaces_ingredient_id",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    modifier_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "modifiers.id",
            name="fk_modifier_ingredient_effects_modifiers1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    effect_type: Mapped[str] = mapped_column(String(45), nullable=False)
    ingredient_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "ingredients.id",
            name="fk_modifier_ingredient_effects_ingredients1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    replaces_ingredient_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "ingredients.id",
            name="fk_modifier_ingredient_effects_ingredients2",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=True,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    quantity_mode: Mapped[str] = mapped_column(String(45), nullable=False)
