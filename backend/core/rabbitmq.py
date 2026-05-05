import aio_pika
from core.config import settings

async def get_rabbitmq_connection():
    return await aio_pika.connect_robust(settings.RABBITMQ_URL)

async def setup_rabbitmq():
    connection = await get_rabbitmq_connection()
    async with connection:
        channel = await connection.channel()
        
        # Dead Letter Exchange and Queue
        dlx = await channel.declare_exchange("dlx", aio_pika.ExchangeType.DIRECT, durable=True)
        dlq = await channel.declare_queue("signals_dlq", durable=True)
        await dlq.bind(dlx, routing_key="dlq_routing_key")

        # Main Queue with DLX configured
        main_queue = await channel.declare_queue(
            "signals_queue", 
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dlx",
                "x-dead-letter-routing-key": "dlq_routing_key"
            }
        )
