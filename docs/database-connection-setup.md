# FastAPI to MariaDB Connection Setup

This document explains the current database configuration in the Coffee Shop POS project and the role of each part. It is intended as project documentation to keep and expand as development continues.

## Current status

- The existing React + Vite frontend remains at the repository root.
- The FastAPI backend is under `backend/` and uses its own Python virtual environment at `backend/.venv/`.
- MariaDB is hosted locally through XAMPP. The existing `CoffePOS_DB` schema is the source of truth.
- FastAPI, Uvicorn, SQLAlchemy, PyMySQL, and `python-dotenv` are installed in the backend virtual environment.
- Local database settings are stored in `backend/.env`; Git ignores that file. `backend/.env.example` is the shareable template.
- `backend/app/core/config.py` reads the environment settings.
- `backend/app/database.py` builds a SQLAlchemy engine and session factory.
- `get_db()` provides a request-scoped SQLAlchemy session and closes it in a `finally` block.
- **The FastAPI-to-MariaDB connection was tested successfully** with a read-only `SELECT 1`, which returned `1`. No tables or data were changed. Creating the engine alone does not prove a connection; the query exercised the actual connection.
- The `GET /health/database` route was tested through FastAPI and returned `{"status":"ok","database_check":1}`.

## Connection flow

```text
backend/.env
    ↓
backend/app/core/config.py
    ↓
SQLAlchemy URL.create(...)
    ↓
SQLAlchemy Engine and connection pool
    ↓ when a connection is requested
PyMySQL driver
    ↓
Local MariaDB server (XAMPP)
    ↓
CoffePOS_DB

SessionLocal is a factory that creates short-lived ORM sessions using the Engine.
```

## 1. Environment settings

The `.env` file stores machine-specific connection settings. It must not be committed or copied into source code because it can contain a database password. The `.env.example` file documents the required setting names with placeholder values and can be shared.

The current settings are:

| Setting | Purpose |
| --- | --- |
| `DB_HOST` | Address of the local MariaDB server |
| `DB_PORT` | MariaDB port |
| `DB_NAME` | Existing database name, `CoffePOS_DB` |
| `DB_USER` | MariaDB account used by the application |
| `DB_PASSWORD` | Password for that local database account; may be empty if configured that way locally |

Do not paste the contents of `.env` into chat or commit it to Git. The repository ignore rule is `backend/.env`.

## 2. Settings loader

`backend/app/core/config.py` currently contains:

```python
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

DB_HOST = os.environ["DB_HOST"]
DB_PORT = int(os.environ["DB_PORT"])
DB_NAME = os.environ["DB_NAME"]
DB_USER = os.environ["DB_USER"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
```

`Path(__file__).resolve()` identifies this Python file's actual location. From `app/core/config.py`, going up two parent folders reaches `backend/`, so the loader can find `backend/.env` regardless of which directory starts the server. `load_dotenv(...)` loads those key/value pairs into the process environment. `os.environ[...]` reads required values and raises a clear `KeyError` if a required key is missing; the port is converted to an integer.

The `python-dotenv` project documents loading a specified `.env` path and reading the values through Python's environment variables: [python-dotenv README](https://github.com/theskumar/python-dotenv/blob/main/README.md).

## 3. SQLAlchemy URL and engine

`backend/app/database.py` currently contains:

```python
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import (
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USER,
)

DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    query={"charset": "utf8mb4"},
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)
```

### `URL.create(...)`

This builds the connection URL from separate values rather than assembling a credential-bearing string by hand.

- `mysql+pymysql` selects SQLAlchemy's MySQL/MariaDB dialect and the PyMySQL driver.
- The user, password, host, port, and database name come from the settings loader.
- `utf8mb4` requests the Unicode character set for the client connection.

SQLAlchemy supports MariaDB through its MySQL dialect and documents the `mysql+pymysql` URL form. `URL.create()` accepts the password as a separate argument, so special password characters do not need to be manually URL-encoded: [SQLAlchemy MySQL and MariaDB dialect](https://docs.sqlalchemy.org/en/20/dialects/mysql.html), [SQLAlchemy engine URL configuration](https://docs.sqlalchemy.org/en/20/core/engines.html).

### `engine`

The Engine is SQLAlchemy's central database connectivity object. It knows how to create driver connections and manages a pool so connections can be reused. `create_engine(...)` configures that object, but it does not establish a network connection immediately. A connection is opened when code first requests one, for example with `engine.connect()` or by running a query through a session.

### `SessionLocal`

`sessionmaker(...)` is a factory configured to create SQLAlchemy ORM `Session` objects bound to this Engine. A session represents one unit of work with the database; it is not itself the Engine or a permanent connection. Later, a FastAPI dependency should create one session for a request and close it when that request is finished.

`autoflush=False` disables automatic flushing of pending ORM changes before queries. `autocommit=False` keeps transaction commits explicit. The application code will decide when to commit or roll back a transaction.

SQLAlchemy recommends keeping session and transaction lifetimes scoped to the work using them and closing sessions when finished: [SQLAlchemy Session Basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html).

## 4. Why this setup does not alter the existing schema

This configuration creates connectivity objects only. It contains no table models, migrations, schema creation, or schema deletion. Do **not** call `Base.metadata.create_all()` for this project: the existing MariaDB database is the schema source of truth. ORM models will be mapped to the existing tables and checked against the actual database structure in a later step.

## 5. Connection test result and next step

The connection was verified two ways: a direct read-only `SELECT 1` from the backend virtual environment, and the FastAPI `GET /health/database` route using the `get_db()` dependency. Both returned `1` successfully. No schema or data was modified.

Phase 3 connection setup is complete. The next milestone is to inspect the existing MariaDB schema and begin careful SQLAlchemy ORM mapping. Do not print or log the connection URL or password.

The next development milestone is to perform that connection check. A successful engine import is not the same as a successful MariaDB connection.
