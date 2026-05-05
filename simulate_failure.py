import asyncio
import aiohttp
import json
import time
import random

API_URL = "http://localhost:8000/signals"
HEADERS = {
    "X-API-Key": "secret_key_123",
    "Content-Type": "application/json"
}

# Simulate a cascading failure scenario
# Phase 1: Redis cache goes down (High volume)
# Phase 2: Postgres gets overwhelmed by cache misses (Medium volume)
# Phase 3: API Gateway starts dropping requests (Low volume, high severity)

SCENARIOS = [
    {
        "phase": "1. Cache Failure",
        "component_id": "redis-cluster-01",
        "error_type": "ConnectionRefusedError",
        "metadata": {"port": 6379, "region": "us-east-1", "impact": "cache_miss"},
        "count": 200,
        "delay_ms": 5
    },
    {
        "phase": "2. Database Overload (Cascading)",
        "component_id": "postgres-primary",
        "error_type": "MaxConnectionsReached",
        "metadata": {"active_connections": 500, "query_latency": "5000ms"},
        "count": 50,
        "delay_ms": 20
    },
    {
        "phase": "3. API Gateway Failure (Critical)",
        "component_id": "api-gateway-edge",
        "error_type": "HTTP_503_ServiceUnavailable",
        "metadata": {"endpoint": "/checkout", "dropped_requests": 1500},
        "count": 10,
        "delay_ms": 100
    }
]

async def send_signal(session, payload):
    try:
        async with session.post(API_URL, headers=HEADERS, json=payload) as response:
            return response.status
    except Exception as e:
        return str(e)

async def simulate_phase(session, scenario):
    print("\n[PHASE] Initiating Phase: " + scenario['phase'])
    print(f"Targeting component: {scenario['component_id']} with {scenario['count']} signals...")
    
    tasks = []
    for _ in range(scenario['count']):
        # Add slight jitter to metadata to simulate real signals
        payload = {
            "component_id": scenario["component_id"],
            "error_type": scenario["error_type"],
            "metadata": {**scenario["metadata"], "trace_id": f"trc_{random.randint(1000, 9999)}"}
        }
        tasks.append(send_signal(session, payload))
        await asyncio.sleep(scenario["delay_ms"] / 1000.0)
        
    results = await asyncio.gather(*tasks)
    success = len([r for r in results if r == 202])
    rate_limited = len([r for r in results if r == 429])
    failed = len([r for r in results if r not in (202, 429)])
    
    print(f"--- Phase Complete! ---")
    print(f"Metrics: {success} Accepted (202), {rate_limited} Rate Limited (429), {failed} Failed")
    
async def main():
    print("==================================================")
    print("Vanguard Chaos Monkey: Cascading Failure Simulation")
    print("==================================================")
    print("This script will blast the ingestion API with signals")
    print("to demonstrate debouncing and backpressure handling.")
    print("Open the React Dashboard to watch the real-time updates!\n")
    
    time.sleep(2)
    
    async with aiohttp.ClientSession() as session:
        for scenario in SCENARIOS:
            await simulate_phase(session, scenario)
            print("Waiting 3 seconds before next phase escalates...")
            time.sleep(3)
            
    print("\nSimulation Finished! Check the Dashboard for the resulting incidents.")

if __name__ == "__main__":
    asyncio.run(main())
