from datetime import datetime
from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.roles import Role
from app.models.user import User


def main() -> None:
    username = input("Admin username: ").strip()
    full_name = input("Admin full name: ").strip()
    password = getpass("Admin password: ")
    password_confirmation = getpass("Confirm password: ")

    if not username or not full_name:
        raise SystemExit("Username and full name are required.")

    if not password:
        raise SystemExit("Password cannot be empty.")

    if password != password_confirmation:
        raise SystemExit("Passwords do not match.")

    now = datetime.now()

    with SessionLocal() as db:
        existing_user = db.scalar(
            select(User).where(User.username == username)
        )
        if existing_user is not None:
            raise SystemExit("That username already exists.")

        try:
            admin_role = db.scalar(
                select(Role).where(Role.name == "Admin")
            )

            if admin_role is None:
                admin_role = Role(
                    name="Admin",
                    description="Administrator role",
                    created_at=now,
                )
                db.add(admin_role)
                db.flush()  # Save the role first so it has an ID for the user.

            admin_user = User(
                role_id=admin_role.id,
                full_name=full_name,
                username=username,
                password_hash=hash_password(password),
                is_active=1,
                created_at=now,
                updated_at=now,
            )
            db.add(admin_user)
            db.commit()

        except Exception:
            db.rollback()
            raise

    print(f"Created the Admin account for username: {username}")


if __name__ == "__main__":
    main()