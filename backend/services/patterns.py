from abc import ABC, abstractmethod
from models.sql import Severity, IncidentState, RCA

# --- Strategy Pattern for Severity ---

class SeverityStrategy(ABC):
    @abstractmethod
    def evaluate(self, error_type: str, metadata: dict) -> Severity:
        pass

class RDBMSSeverityStrategy(SeverityStrategy):
    def evaluate(self, error_type: str, metadata: dict) -> Severity:
        if "timeout" in error_type.lower() or "connection" in error_type.lower():
            return Severity.P0
        return Severity.P1

class CacheSeverityStrategy(SeverityStrategy):
    def evaluate(self, error_type: str, metadata: dict) -> Severity:
        return Severity.P2

class DefaultSeverityStrategy(SeverityStrategy):
    def evaluate(self, error_type: str, metadata: dict) -> Severity:
        return Severity.P3

class SeverityEvaluator:
    def __init__(self):
        self.strategies = {
            "db": RDBMSSeverityStrategy(),
            "rdbms": RDBMSSeverityStrategy(),
            "cache": CacheSeverityStrategy(),
            "redis": CacheSeverityStrategy()
        }
        self.default_strategy = DefaultSeverityStrategy()

    def get_severity(self, error_type: str, metadata: dict) -> Severity:
        # Determine strategy based on error_type or metadata 'component_type'
        component_type = metadata.get("component_type", "").lower()
        if component_type in self.strategies:
            return self.strategies[component_type].evaluate(error_type, metadata)
        
        # Fallback to matching error_type
        for key, strategy in self.strategies.items():
            if key in error_type.lower():
                return strategy.evaluate(error_type, metadata)
                
        return self.default_strategy.evaluate(error_type, metadata)


# --- State Pattern for Incident Lifecycle ---

class IncidentStateContext:
    def __init__(self, current_state: IncidentState, rca: RCA = None):
        self.state = current_state
        self.rca = rca

    def transition_to(self, new_state: IncidentState) -> bool:
        if self.state == IncidentState.OPEN:
            if new_state == IncidentState.INVESTIGATING:
                self.state = IncidentState.INVESTIGATING
                return True
        elif self.state == IncidentState.INVESTIGATING:
            if new_state == IncidentState.RESOLVED:
                self.state = IncidentState.RESOLVED
                return True
        elif self.state == IncidentState.RESOLVED:
            if new_state == IncidentState.CLOSED:
                if self.rca is not None:
                    self.state = IncidentState.CLOSED
                    return True
                else:
                    raise ValueError("Cannot transition to CLOSED without an RCA.")
            elif new_state == IncidentState.INVESTIGATING:
                self.state = IncidentState.INVESTIGATING
                return True
                
        raise ValueError(f"Invalid transition from {self.state} to {new_state}")
