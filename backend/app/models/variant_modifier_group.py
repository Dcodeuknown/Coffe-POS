from sqlalchemy import ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class VariantModifierGroup(Base):
    __tablename__ = "variant_modifier_groups"
    __table_args__ = (
        UniqueConstraint(
            "menu_variant_id",
            "modifier_group_id",
            name="uq_variant_modifier_group",
        ),
        Index("fk_variant_modifier_groups_menu_variants1_idx", "menu_variant_id"),
        Index("fk_variant_modifier_groups_modifier_groups1_idx", "modifier_group_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    menu_variant_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "menu_variants.id",
            name="fk_variant_modifier_groups_menu_variants1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    modifier_group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "modifier_groups.id",
            name="fk_variant_modifier_groups_modifier_groups1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    is_required: Mapped[int] = mapped_column(TINYINT(display_width=4), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)