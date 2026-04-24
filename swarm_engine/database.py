"""
Async SQLAlchemy database connection for LC-EWS
"""
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load from project root .env (one level up from swarm_engine/)
_root_env = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_root_env, override=False)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://lcews:password@localhost:5432/lcews"
)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
