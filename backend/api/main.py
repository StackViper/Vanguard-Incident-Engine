from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from typing import List
import json
import asyncio
from datetime import datetime
import traceback
import sys

from core.config import settings
from core.security import get_api_key
from core.redis_client import redis_client
from core.rabbitmq import get_rabbitmq_connection
from core.db import get_db, SessionLocal, engine, Base
from core.mongo import signals_collection
from models.schemas import SignalPayload, RCACreate, StateTransition, IncidentResponse
from models.sql import WorkItem, RCA, IncidentState, Severity
from services.patterns import IncidentStateContext
import aio_pika

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vanguard Ingestion Nexus", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSockets for Live Updates ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/incidents")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def notify_clients(update_type: str, data: dict):
    payload = json.dumps({"type": update_type, "data": data}, default=str)
    await manager.broadcast(payload)


# --- Observability ---
metrics = {"signals_received": 0}

async def log_throughput():
    while True:
        await asyncio.sleep(5)
        throughput = metrics["signals_received"] / 5
        print(f"[METRICS] Vanguard Throughput: {throughput:.2f} pulses/sec")
        await notify_clients("system_metrics", {"throughput": throughput})
        metrics["signals_received"] = 0

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(log_throughput())
    # Pre-connect RabbitMQ to ensure it's available
    app.state.rmq_conn = await get_rabbitmq_connection()

@app.on_event("shutdown")
async def shutdown_event():
    await app.state.rmq_conn.close()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "vanguard-nexus"}


# --- Ingestion API ---
RATE_LIMIT = 1000  # max signals per second per IP

@app.post("/signals", dependencies=[Depends(get_api_key)], status_code=202)
async def ingest_signal(payload: SignalPayload, request: Request, background_tasks: BackgroundTasks):
    client_ip = request.client.host
    current_sec = int(datetime.utcnow().timestamp())
    redis_key = f"rate_limit:{client_ip}:{current_sec}"
    
    # Rate Limiting
    pipe = redis_client.pipeline()
    pipe.incr(redis_key)
    pipe.expire(redis_key, 2)
    result = await pipe.execute()
    
    if result[0] > RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    metrics["signals_received"] += 1

    # Publish to RabbitMQ
    try:
        async with app.state.rmq_conn.channel() as channel:
            exchange = channel.default_exchange
            message_body = json.dumps(payload.dict(), default=str).encode()
            
            await exchange.publish(
                aio_pika.Message(body=message_body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
                routing_key="signals_queue"
            )
    except Exception as e:
        print(f"Error publishing to RabbitMQ: {e}")
        traceback.print_exc()
        sys.stdout.flush()
        raise HTTPException(status_code=500, detail="Failed to enqueue signal (Backpressure/Broker error)")

    return {"status": "accepted"}
    
@app.post("/simulate")
async def run_simulation(background_tasks: BackgroundTasks):
    scenarios = [
        {"component_id": "db_primary", "error_type": "Connection Failure", "count": 20, "delay": 0.5, "meta": {"component_type": "db"}},
        {"component_id": "api_gateway", "error_type": "Timeout Spike", "count": 15, "delay": 1.0, "meta": {"component_type": "api"}},
        {"component_id": "redis_cluster", "error_type": "Latency Spike", "count": 10, "delay": 2.0, "meta": {"component_type": "cache"}}
    ]
    
    async def task():
        try:
            async with app.state.rmq_conn.channel() as channel:
                exchange = channel.default_exchange
                for scenario in scenarios:
                    for i in range(scenario["count"]):
                        payload = {
                            "component_id": scenario["component_id"],
                            "error_type": scenario["error_type"],
                            "metadata": {**scenario["meta"], "sim_id": i}
                        }
                        try:
                            message_body = json.dumps(payload, default=str).encode()
                            await exchange.publish(
                                aio_pika.Message(body=message_body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
                                routing_key="signals_queue"
                            )
                            metrics["signals_received"] += 1
                        except Exception as e:
                            print(f"Simulation enqueue failed: {e}")
                        
                        await asyncio.sleep(scenario["delay"])
        except Exception as e:
            print(f"Simulation channel error: {e}")

    background_tasks.add_task(task)
    return {"status": "simulation_started"}


# --- Dashboard APIs ---

@app.get("/incidents", response_model=List[IncidentResponse])
async def get_incidents(db=Depends(get_db)):
    incidents = db.query(WorkItem).order_by(WorkItem.created_at.desc()).all()
    # Need to convert SQLAlchemy models to Pydantic responses
    response = []
    for item in incidents:
        rca_data = item.rca
        response.append(IncidentResponse(
            id=item.id,
            component_id=item.component_id,
            severity=item.severity,
            status=item.status,
            created_at=item.created_at,
            updated_at=item.updated_at,
            rca=rca_data
        ))
    return response

@app.get("/incident/{id}", response_model=IncidentResponse)
async def get_incident(id: str, db=Depends(get_db)):
    incident = db.query(WorkItem).filter(WorkItem.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Get signals from MongoDB
    signals_cursor = signals_collection.find({"work_item_id": id})
    signals = await signals_cursor.to_list(length=100)
    
    # Format MongoDB _id
    for sig in signals:
        sig["_id"] = str(sig["_id"])

    response = IncidentResponse(
        id=incident.id,
        component_id=incident.component_id,
        severity=incident.severity,
        status=incident.status,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        rca=incident.rca,
        signals=signals
    )
    return response

@app.post("/incident/{id}/transition")
async def transition_incident(id: str, transition: StateTransition, db=Depends(get_db)):
    incident = db.query(WorkItem).filter(WorkItem.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    context = IncidentStateContext(incident.status, incident.rca)
    try:
        context.transition_to(transition.new_state)
        incident.status = context.state
        db.commit()
        await notify_clients("incident_updated", {"id": incident.id, "status": incident.status.value})
        return {"status": "success", "new_state": incident.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/incident/{id}/rca")
async def submit_rca(id: str, rca: RCACreate, db=Depends(get_db)):
    incident = db.query(WorkItem).filter(WorkItem.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if incident.rca:
        raise HTTPException(status_code=400, detail="RCA already exists")
        
    new_rca = RCA(
        work_item_id=id,
        root_cause_category=rca.root_cause_category,
        fix_applied=rca.fix_applied,
        prevention_steps=rca.prevention_steps,
        start_time=rca.start_time,
        end_time=rca.end_time
    )
    db.add(new_rca)
    db.commit()
    
    # Compute MTTR (in minutes for example)
    mttr = (rca.end_time - rca.start_time).total_seconds() / 60
    await notify_clients("incident_updated", {"id": incident.id, "rca_submitted": True, "mttr_minutes": mttr})
    
    return {"status": "success", "mttr_minutes": mttr}
