import asyncio
import json
import logging
from tenacity import retry, stop_after_attempt, wait_fixed
import aio_pika
from datetime import datetime
from core.config import settings
from core.rabbitmq import get_rabbitmq_connection, setup_rabbitmq
from core.redis_client import redis_client
from core.db import SessionLocal
from core.mongo import signals_collection
from models.sql import WorkItem
from services.patterns import SeverityEvaluator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

severity_evaluator = SeverityEvaluator()

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
async def process_signal_db_operations(payload: dict) -> str:
    """
    Handles Redis, PostgreSQL and MongoDB operations. Retries up to 3 times on failure.
    Returns the associated work_item_id.
    """
    component_id = payload.get("component_id")
    error_type = payload.get("error_type")
    metadata = payload.get("metadata", {})
    
    redis_key = f"active_window:{component_id}"
    
    # 1. Check Redis for active window
    work_item_id = await redis_client.get(redis_key)
    
    # 2. Debouncing Logic
    if not work_item_id:
        # Determine Severity using Strategy
        severity = severity_evaluator.get_severity(error_type, metadata)
        
        # Create new Work Item in PostgreSQL
        db = SessionLocal()
        try:
            new_work_item = WorkItem(
                component_id=component_id,
                severity=severity
            )
            db.add(new_work_item)
            db.commit()
            db.refresh(new_work_item)
            work_item_id = new_work_item.id
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
            
        # Store in Redis with TTL 10s
        await redis_client.setex(redis_key, 10, work_item_id)
        logger.info(f"Created new WorkItem: {work_item_id} for component: {component_id}")
    else:
        logger.info(f"Debounced signal for component: {component_id}. Linking to existing WorkItem: {work_item_id}")

    # 3. Store raw signal in MongoDB and link
    signal_doc = payload.copy()
    signal_doc["work_item_id"] = work_item_id
    signal_doc["ingested_at"] = datetime.utcnow()
    
    await signals_collection.insert_one(signal_doc)
    
    return work_item_id


async def process_message(message: aio_pika.IncomingMessage):
    async with message.process(ignore_processed=True):
        try:
            payload = json.loads(message.body.decode())
            logger.info(f"Processing signal for {payload.get('component_id')}")
            
            await process_signal_db_operations(payload)
            
            await message.ack()
        except Exception as e:
            logger.error(f"Failed to process message after retries: {e}")
            # Reject message without requeueing -> Goes to DLQ
            await message.reject(requeue=False)

async def main():
    logger.info("Starting Worker Service...")
    await setup_rabbitmq()
    connection = await get_rabbitmq_connection()
    
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=50)
    
    queue = await channel.get_queue("signals_queue")
    
    logger.info("Waiting for messages...")
    await queue.consume(process_message)
    
    try:
        await asyncio.Future()
    finally:
        await connection.close()

if __name__ == "__main__":
    asyncio.run(main())
