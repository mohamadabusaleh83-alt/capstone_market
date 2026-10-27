"""
In-memory sliding-window rate limiting (single API instance).

Limits are read from environment variables so they can be tuned per
deployment; the defaults are safe for production.
"""
import os
import threading
import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import Request


def _env_int(name: str, default: int) -> int:
    try:
        return max(1, int(os.getenv(name, default)))
    except ValueError:
        return default


class SlidingWindowLimiter:
    """Allows at most `limit` events per `window` seconds for each key."""

    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self._events = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque:
        events = self._events[key]
        while events and events[0] <= now - self.window:
            events.popleft()
        return events

    def retry_after(self, key: str) -> Optional[int]:
        """Seconds until the key may act again, or None when it is not limited."""
        now = time.monotonic()
        with self._lock:
            events = self._prune(key, now)
            if len(events) < self.limit:
                return None
            return max(1, int(events[0] + self.window - now) + 1)

    def hit(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            self._prune(key, now).append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._events.pop(key, None)


# login: every attempt per client IP, and failed attempts per account
LOGIN_IP_LIMITER = SlidingWindowLimiter(_env_int("LOGIN_IP_RATE_LIMIT", 30), _env_int("LOGIN_IP_RATE_WINDOW", 300))
LOGIN_ACCOUNT_LIMITER = SlidingWindowLimiter(_env_int("LOGIN_ACCOUNT_FAILURE_LIMIT", 5), _env_int("LOGIN_ACCOUNT_FAILURE_WINDOW", 900))
# registration: per client IP
REGISTER_IP_LIMITER = SlidingWindowLimiter(_env_int("REGISTER_RATE_LIMIT", 10), _env_int("REGISTER_RATE_WINDOW", 3600))


def client_ip(request: Request) -> str:
    """Client address. Behind Render's proxy the real client is the right-most
    X-Forwarded-For entry (the one the proxy itself appended)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.client.host if request.client else "unknown"
