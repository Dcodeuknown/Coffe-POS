from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.mysql import LONGTEXT, TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MenuItem(Base):
    __tablename__ = "menu_items"
    __table_args__ = (Index("fk_menu_items_menu_categories1_idx", "category_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "menu_categories.id",
            name="fk_menu_items_menu_categories1",
            ondelete="NO ACTION",
            onupdate="NO ACTION",
        ),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(450), nullable=False)
    description: Mapped[str | None] = mapped_column(LONGTEXT, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[int] = mapped_column(
        TINYINT(display_width=4),
        nullable=False,
        server_default=text("1"),
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)