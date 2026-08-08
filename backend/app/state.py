"""
Global application state — avoids circular imports between main.py and routers.
"""

db_ready: bool = False
