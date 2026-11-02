from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ModifierGroup(Base):
    __tablename__ = "modifier_groups"
    __table_args__ = (UniqueConstraint("name", name="name_UNIQUE"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(45), nullable=False)
    selection_type: Mapped[str] = mapped_column(String(45), nullable=False)
    min_selections: Mapped[int] = mapped_column(Integer, nullable=False)
    max_selections: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[int] = mapped_column(TINYINT(display_width=4), nullable=False)