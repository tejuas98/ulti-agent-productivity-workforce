import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# TRACK 3: AlloyDB for PostgreSQL Integration (AI-Ready Database)
# This configuration supports AlloyDB with AlloyDB AI natural language features enabled.
# In production, use AlloyDB for high-performance Vector Search and NL-to-SQL capabilities.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback for local development
    DATABASE_URL = "sqlite:///./app_data.db"
    connect_args = {"check_same_thread": False}
else:
    # Production: AlloyDB / Cloud SQL logic
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    connect_args = {}

# NOTE: For Track 3, ensure 'google_ml_integration' extension is enabled in AlloyDB
# for Natural Language Querying support.
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
