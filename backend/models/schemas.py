from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from models.sql import Severity, IncidentState

class SignalPayload(BaseModel):
    component_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    error_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RCACreate(BaseModel):
    root_cause_category: str
    fix_applied: str
    prevention_steps: str
    start_time: datetime
    end_time: datetime

class RCAResponse(BaseModel):
    id: str
    root_cause_category: str
    fix_applied: str
    prevention_steps: str
    start_time: datetime
    end_time: datetime

    class Config:
        from_attributes = True

class StateTransition(BaseModel):
    new_state: IncidentState

class IncidentResponse(BaseModel):
    id: str
    component_id: str
    severity: Severity
    status: IncidentState
    created_at: datetime
    updated_at: datetime
    rca: Optional[RCAResponse] = None
    signals: Optional[list] = None

    class Config:
        from_attributes = True
