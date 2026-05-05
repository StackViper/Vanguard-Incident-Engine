from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
import datetime
from core.db import Base
import uuid

class Severity(str, enum.Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"

class IncidentState(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

def generate_uuid():
    return str(uuid.uuid4())

class WorkItem(Base):
    __tablename__ = "work_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    component_id = Column(String, index=True, nullable=False)
    severity = Column(Enum(Severity), nullable=False)
    status = Column(Enum(IncidentState), default=IncidentState.OPEN, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    rca = relationship("RCA", back_populates="work_item", uselist=False)

class RCA(Base):
    __tablename__ = "rca"

    id = Column(String, primary_key=True, default=generate_uuid)
    work_item_id = Column(String, ForeignKey("work_items.id"), unique=True)
    root_cause_category = Column(String, nullable=False)
    fix_applied = Column(String, nullable=False)
    prevention_steps = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    work_item = relationship("WorkItem", back_populates="rca")
