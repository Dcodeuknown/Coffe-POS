from decimal import Decimal

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Modifier(Base):
    __tablename__ = "modifiers"
    __table_args__ = (Index("fk_modifiers_modifier_groups1_idx", "modifier_group_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    modifier_group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "modifier_groups.id",
            name="fk_modifiers_modifier_groups1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(155), nullable=False)
    price_adjustment: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_active: Mapped[int] = mapped_column(TINYINT(display_width=4), nullable=False)