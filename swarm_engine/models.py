"""
SQLAlchemy ORM models for LC-EWS
Matches the UML class diagram: User, Report, SwarmEvent
"""
from sqlalchemy import (
    Column, Integer, String, DateTime, Float, Text,
    ForeignKey, Boolean
)
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """
    Actors: Admin, Analyst, Field Officer
    Roles: admin | analyst | field_officer
    """
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(255), nullable=False)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role          = Column(String(50), nullable=False, default="analyst")
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    """
    Field observation submitted by a Field Officer.
    PostGIS-ready: lat/lon stored as floats (upgrade to GEOMETRY later).
    """
    __tablename__ = "reports"

    id            = Column(Integer, primary_key=True, index=True)
    report_id     = Column(String(20), unique=True, index=True)   # RPT-XXXX
    user_id       = Column(Integer, ForeignKey("users.id"))
    observer_name = Column(String(255))
    zone          = Column(String(255))
    risk_level    = Column(String(50))   # Critical | High | Medium | Low
    description   = Column(Text)
    lat           = Column(Float, nullable=True)
    lon           = Column(Float, nullable=True)
    status        = Column(String(50), default="Pending")  # Pending | Verified | Rejected
    created_at    = Column(DateTime, default=datetime.utcnow)


class SwarmEvent(Base):
    """
    Snapshot of a simulated swarm at a point in time.
    Written by the swarm engine; read by dashboard/analytics.
    """
    __tablename__ = "swarm_events"

    id          = Column(Integer, primary_key=True, index=True)
    swarm_id    = Column(String(50), index=True)
    lat         = Column(Float)
    lon         = Column(Float)
    area_km2    = Column(Float)
    size        = Column(Float)
    risk_level  = Column(String(50))
    recorded_at = Column(DateTime, default=datetime.utcnow)
