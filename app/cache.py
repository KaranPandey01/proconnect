import redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

try:
    r = redis.Redis.from_url(
        REDIS_URL,
        decode_responses=True
    )
    r.ping()
    print("Redis connected")

except Exception as e:
    print("Redis not connected:", e)
    r = None