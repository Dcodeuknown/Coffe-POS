from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.dialects.mysql import MEDIUMTEXT, TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(155), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(155), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(45), nullable=True)
    email: Mapped[str | None] = mapped_column(String(155), nullable=True)
    address: Mapped[str | None] = mapped_column(MEDIUMTEXT, nullable=True)
    is_active: Mapped[int] = mapped_column(TINYINT(display_width=4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)