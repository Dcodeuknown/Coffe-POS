from pwdlib import PasswordHash

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)

def create_access_token(user_id: int) -> str:
    """Create a signed token containing the user's ID and expiration time."""
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user_id), "exp": expires_at}

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Verify a token's signature and expiration, then return its claims."""
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

# Argon2 is used to hash new passwords before storing them in users.password_hash.
password_hasher = PasswordHash.recommended()


def hash_password(plain_password: str) -> str:
    """Hash a password when creating or resetting a user account."""
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Check a login password against the hash stored in the database."""
    return password_hasher.verify(plain_password, stored_hash)