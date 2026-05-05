# Vanguard Incident Engine

A production-grade, event-driven Incident Management System designed to handle high-throughput telemetry, execute stateful workflow operations, and present real-time dashboards for Site Reliability Engineers.

Built with a stunning **Forest Glass** aesthetic and a robust backend stack: **FastAPI, RabbitMQ, Redis, MongoDB, PostgreSQL, and React (Tailwind v4)**.

---


---

### The Pulse Flow
1. **Pulse Emission**: High-throughput telemetry signals (pulses) arrive at the Ingestion Nexus. 
2. **Buffering**: The Nexus immediately acknowledges receipt (HTTP 202) and enqueues the payload into the Synapse Broker (RabbitMQ).
3. **Processing**: The Vanguard Worker pulls messages asynchronously.
4. **Noise Suppression**: To prevent alert fatigue, the Worker checks the Synapse Cache (Redis). If a pulse for a specific component was received within the 10-second sliding window, it is suppressed and linked to the active Pulse Event.
5. **Dual-Write Storage**: 
   - **Pulse Archive (MongoDB)**: Every raw pulse is stored as an immutable audit log for forensics.
   - **Core Ledger (PostgreSQL)**: Only curated Pulse Events (Incidents) and Structural Audits (RCA) are stored here for relational integrity.
6. **Real-time Synchronization**: The backend pushes updates via WebSockets to the Pulse Center UI, providing instant visibility.

---

## 🌊 Stability & Resilience

Vanguard is built to survive massive telemetry storms through three core mechanisms:

1. **Admission Guard (Token Bucket)**: Redis-backed rate limiting drops excessive traffic at the edge (default 1000/sec).
2. **Backpressure Buffering**: RabbitMQ absorbs ingestion spikes, allowing the API to remain responsive while the Worker catches up.
3. **Prefetch Regulation**: Workers are constrained to a prefetch count of 50, ensuring they never exceed their allocated memory even during catastrophic system collapses.
4. **Self-Healing Pipeline**: Integrated retry logic with exponential backoff and Dead Letter Queues ensures that transient failures don't lead to data loss.

---

## 🚦 Structural Audit Workflow

The lifecycle of a Pulse Event is governed by a strict state machine:
`OPEN` → `INVESTIGATING` → `RESOLVED` → `CLOSED`

**Audit Enforcement:** 
Vanguard strictly rejects any attempt to close a Pulse Event unless a **Structural Audit (RCA)** has been performed and logged in the Core Ledger.

---

## 🚀 Deployment

Vanguard is fully containerized for instant deployment.

### Prerequisites
- Docker & Docker Compose

### Initialize the Engine
```bash
# Build and launch the Vanguard infrastructure
docker-compose up -d --build
```

### Command Centers
- **Pulse Center (UI):** `http://localhost:5173`
- **Ingestion Nexus Docs:** `http://localhost:8000/docs`
- **Synapse Broker Admin:** `http://localhost:15672` (guest / guest)

---

## 🎭 Chaos Simulation

Test the resilience of the engine using the included Chaos Monkey script. It mimics a cascading system failure (Cache → DB → Gateway) to demonstrate Vanguard's advanced debouncing.

**Execute Simulation:**
```bash
# Install dependencies
pip install aiohttp

# Run the simulation
python simulate_failure.py
```
Watch the Pulse Center instantly consolidate hundreds of raw signals into distinct, actionable Pulse Events.
