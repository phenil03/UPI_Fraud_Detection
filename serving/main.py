"""
UPI Transaction Analytics — FastAPI Backend
Pure data analytics on the PaySim dataset (6.3M transactions).
No ML models — focuses on statistical analysis, trends, and patterns.
"""

import os
import json
import random
import sqlite3
import hashlib
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
#  Paths
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, "..")
DATA_PATH = os.path.join(PROJECT_DIR, "data", "paysim.csv")
DB_PATH = os.path.join(PROJECT_DIR, "fraud_data.db")

# ---------------------------------------------------------------------------
#  UPI-style name mapping (convert PaySim names to Indian UPI IDs)
# ---------------------------------------------------------------------------

BANKS = ["ybl", "oksbi", "paytm", "ibl", "axl", "icici", "sbi", "hdfc", "kotak", "boi"]
FIRST_NAMES = [
    "rahul", "priya", "amit", "sneha", "vijay", "deepak", "anita", "suresh",
    "meena", "rajesh", "pooja", "kiran", "manoj", "neha", "arjun", "sanjay",
    "kavita", "ravi", "sunita", "anil", "geeta", "mohan", "rekha", "prakash",
    "swati", "ashok", "nisha", "ramesh", "divya", "vikram", "arun", "seema",
    "rohit", "tanvi", "nikhil", "shruti", "gaurav", "mansi", "sachin", "ritu",
]
LAST_NAMES = [
    "sharma", "patel", "kumar", "verma", "singh", "gupta", "joshi", "reddy",
    "das", "nair", "mehta", "rao", "tiwari", "agarwal", "mishra", "yadav",
    "chauhan", "soni", "iyer", "bhat", "pandey", "saxena", "dubey", "malik",
    "thakur", "chowdhury", "pillai", "menon", "kaur", "chatterjee",
]

CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Bhopal",
    "Indore", "Nagpur", "Kochi", "Coimbatore", "Vadodara", "Patna",
]

# Map PaySim transaction types to UPI descriptions
TYPE_MAP = {
    "PAYMENT": "UPI Payment",
    "TRANSFER": "UPI Transfer",
    "CASH_OUT": "UPI Withdrawal",
    "CASH_IN": "UPI Deposit",
    "DEBIT": "UPI Debit",
}

_name_cache = {}

def paysim_name_to_upi(name: str) -> str:
    """Convert PaySim name (C12345/M12345) to realistic Indian UPI ID"""
    if name in _name_cache:
        return _name_cache[name]
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    first = FIRST_NAMES[h % len(FIRST_NAMES)]
    last = LAST_NAMES[(h >> 8) % len(LAST_NAMES)]
    bank = BANKS[(h >> 16) % len(BANKS)]
    upi_id = f"{first}.{last}@{bank}"
    _name_cache[name] = upi_id
    return upi_id


def name_to_city(name: str) -> str:
    """Deterministically assign a city to a PaySim name"""
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    return CITIES[h % len(CITIES)]


# ---------------------------------------------------------------------------
#  Database
# ---------------------------------------------------------------------------

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DROP TABLE IF EXISTS transactions")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txn_id TEXT UNIQUE,
            sender_upi TEXT,
            receiver_upi TEXT,
            sender_city TEXT,
            receiver_city TEXT,
            txn_type TEXT,
            txn_type_raw TEXT,
            amount REAL,
            old_balance_sender REAL,
            new_balance_sender REAL,
            old_balance_receiver REAL,
            new_balance_receiver REAL,
            is_fraud INTEGER,
            hour_of_day INTEGER,
            day_of_week INTEGER,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    seed_from_paysim(conn)
    conn.close()


def seed_from_paysim(conn):
    """Load PaySim data, convert to UPI format for analytics"""
    print("[INFO] Loading PaySim dataset for analytics...")

    if not os.path.exists(DATA_PATH):
        print(f"[ERROR] Dataset not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    print(f"[INFO] Dataset loaded: {len(df)} total transactions, {df['isFraud'].sum()} fraud cases")

    # Take a rich sample: all fraud + random legit for a 2000-transaction analytics set
    fraud_df = df[df["isFraud"] == 1].head(200)
    legit_df = df[df["isFraud"] == 0].sample(n=1800, random_state=42)
    sample_df = pd.concat([fraud_df, legit_df]).sample(frac=1, random_state=42)

    print(f"[INFO] Processing {len(sample_df)} transactions for analytics...")

    # Spread transactions across 30 days for time-series analysis
    base_time = datetime.utcnow() - timedelta(days=30)
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for idx, (_, row) in enumerate(sample_df.iterrows()):
        step = int(row["step"])
        # Map step to realistic timestamp across 30 days
        timestamp = base_time + timedelta(hours=step % 720)
        hour = timestamp.hour
        day_of_week = timestamp.weekday()

        sender_upi = paysim_name_to_upi(str(row["nameOrig"]))
        receiver_upi = paysim_name_to_upi(str(row["nameDest"]))
        sender_city = name_to_city(str(row["nameOrig"]))
        receiver_city = name_to_city(str(row["nameDest"]))

        raw_key = f'{row["nameOrig"]}{row["nameDest"]}{row["amount"]}{idx}'
        txn_id = f"UPI{hashlib.md5(raw_key.encode()).hexdigest()[:12].upper()}"

        amount_inr = round(float(row["amount"]) * 0.83, 2)
        txn_type_raw = str(row["type"])

        try:
            conn.execute(
                """INSERT OR IGNORE INTO transactions
                   (txn_id, sender_upi, receiver_upi, sender_city, receiver_city,
                    txn_type, txn_type_raw, amount,
                    old_balance_sender, new_balance_sender,
                    old_balance_receiver, new_balance_receiver,
                    is_fraud, hour_of_day, day_of_week, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    txn_id, sender_upi, receiver_upi, sender_city, receiver_city,
                    TYPE_MAP.get(txn_type_raw, "UPI Payment"), txn_type_raw,
                    amount_inr,
                    round(float(row["oldbalanceOrg"]) * 0.83, 2),
                    round(float(row["newbalanceOrig"]) * 0.83, 2),
                    round(float(row["oldbalanceDest"]) * 0.83, 2),
                    round(float(row["newbalanceDest"]) * 0.83, 2),
                    int(row["isFraud"]),
                    hour, day_of_week,
                    timestamp.isoformat(),
                ),
            )
        except Exception as e:
            print(f"[WARN] Skipping row {idx}: {e}")

    conn.commit()
    final_count = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    fraud_count = conn.execute("SELECT COUNT(*) FROM transactions WHERE is_fraud=1").fetchone()[0]
    print(f"[INFO] Seeded {final_count} transactions ({fraud_count} fraud cases) for analytics")


# ---------------------------------------------------------------------------
#  FastAPI app
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INFO] Initializing UPI Transaction Analytics...")
    init_db()
    print("[INFO] Analytics backend ready!")
    yield

app = FastAPI(
    title="UPI Transaction Analytics API",
    description="Data analytics on PaySim UPI transaction dataset — trends, patterns, distributions",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
#  Helpers
# ---------------------------------------------------------------------------

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------------------------------------------------
#  Routes
# ---------------------------------------------------------------------------

@app.get("/")
def health():
    return {
        "status": "healthy",
        "project": "UPI Transaction Analytics",
        "dataset": "PaySim (6.3M transactions)",
        "version": "3.0.0",
    }


@app.get("/overview")
def get_overview():
    """Dashboard overview — key KPIs"""
    conn = get_conn()

    total = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    fraud_count = conn.execute("SELECT COUNT(*) FROM transactions WHERE is_fraud=1").fetchone()[0]
    total_volume = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions").fetchone()[0]
    avg_amount = conn.execute("SELECT COALESCE(AVG(amount), 0) FROM transactions").fetchone()[0]
    max_amount = conn.execute("SELECT COALESCE(MAX(amount), 0) FROM transactions").fetchone()[0]
    min_amount = conn.execute("SELECT COALESCE(MIN(amount), 0) FROM transactions").fetchone()[0]
    fraud_volume = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE is_fraud=1").fetchone()[0]
    unique_senders = conn.execute("SELECT COUNT(DISTINCT sender_upi) FROM transactions").fetchone()[0]
    unique_receivers = conn.execute("SELECT COUNT(DISTINCT receiver_upi) FROM transactions").fetchone()[0]

    # Type breakdown
    type_breakdown = conn.execute("""
        SELECT txn_type, COUNT(*) as count, SUM(amount) as volume,
               SUM(is_fraud) as fraud_count
        FROM transactions GROUP BY txn_type ORDER BY count DESC
    """).fetchall()

    # Daily trend (last 30 days)
    daily_trend = conn.execute("""
        SELECT DATE(created_at) as date, COUNT(*) as count,
               SUM(amount) as volume, SUM(is_fraud) as fraud_count
        FROM transactions
        GROUP BY DATE(created_at) ORDER BY date
    """).fetchall()

    conn.close()

    return {
        "total_transactions": total,
        "fraud_count": fraud_count,
        "fraud_rate": round(fraud_count / total * 100, 2) if total > 0 else 0,
        "total_volume": round(total_volume, 2),
        "avg_amount": round(avg_amount, 2),
        "max_amount": round(max_amount, 2),
        "min_amount": round(min_amount, 2),
        "fraud_volume": round(fraud_volume, 2),
        "unique_senders": unique_senders,
        "unique_receivers": unique_receivers,
        "type_breakdown": [
            {"type": t["txn_type"], "count": t["count"],
             "volume": round(t["volume"], 2), "fraud_count": t["fraud_count"]}
            for t in type_breakdown
        ],
        "daily_trend": [
            {"date": d["date"], "count": d["count"],
             "volume": round(d["volume"], 2), "fraud_count": d["fraud_count"]}
            for d in daily_trend
        ],
    }


@app.get("/transactions")
def get_transactions(
    limit: int = 100,
    offset: int = 0,
    txn_type: Optional[str] = None,
    fraud_only: bool = False,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    """Filterable transaction explorer"""
    conn = get_conn()
    conditions = []
    params = []

    if txn_type:
        conditions.append("txn_type_raw = ?")
        params.append(txn_type)
    if fraud_only:
        conditions.append("is_fraud = 1")
    if min_amount is not None:
        conditions.append("amount >= ?")
        params.append(min_amount)
    if max_amount is not None:
        conditions.append("amount <= ?")
        params.append(max_amount)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""

    allowed_sort = {"created_at", "amount", "txn_type", "is_fraud"}
    sort_col = sort_by if sort_by in allowed_sort else "created_at"
    order = "ASC" if sort_order.lower() == "asc" else "DESC"

    # Total count for pagination
    count_row = conn.execute(f"SELECT COUNT(*) FROM transactions{where}", params).fetchone()
    total_count = count_row[0]

    rows = conn.execute(
        f"SELECT * FROM transactions{where} ORDER BY {sort_col} {order} LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    conn.close()

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "data": [
            {
                "id": r["id"],
                "txn_id": r["txn_id"],
                "sender_upi": r["sender_upi"],
                "receiver_upi": r["receiver_upi"],
                "sender_city": r["sender_city"],
                "receiver_city": r["receiver_city"],
                "txn_type": r["txn_type"],
                "txn_type_raw": r["txn_type_raw"],
                "amount": r["amount"],
                "is_fraud": r["is_fraud"],
                "hour_of_day": r["hour_of_day"],
                "day_of_week": r["day_of_week"],
                "created_at": r["created_at"],
            }
            for r in rows
        ],
    }


@app.get("/analytics/hourly")
def analytics_hourly():
    """Hourly transaction distribution"""
    conn = get_conn()
    rows = conn.execute("""
        SELECT hour_of_day as hour,
               COUNT(*) as total,
               SUM(is_fraud) as fraud,
               ROUND(AVG(amount), 2) as avg_amount,
               ROUND(SUM(amount), 2) as volume
        FROM transactions GROUP BY hour_of_day ORDER BY hour
    """).fetchall()
    conn.close()
    return [
        {"hour": r["hour"], "total": r["total"], "fraud": r["fraud"],
         "avg_amount": r["avg_amount"], "volume": r["volume"]}
        for r in rows
    ]


@app.get("/analytics/type-distribution")
def analytics_type_distribution():
    """Transaction type distribution with fraud breakdown"""
    conn = get_conn()
    rows = conn.execute("""
        SELECT txn_type_raw as type, txn_type as label,
               COUNT(*) as total,
               SUM(is_fraud) as fraud,
               ROUND(SUM(amount), 2) as volume,
               ROUND(AVG(amount), 2) as avg_amount,
               ROUND(MIN(amount), 2) as min_amount,
               ROUND(MAX(amount), 2) as max_amount
        FROM transactions GROUP BY txn_type_raw ORDER BY total DESC
    """).fetchall()
    conn.close()
    return [
        {"type": r["type"], "label": r["label"], "total": r["total"],
         "fraud": r["fraud"], "volume": r["volume"],
         "avg_amount": r["avg_amount"], "min_amount": r["min_amount"],
         "max_amount": r["max_amount"],
         "fraud_rate": round(r["fraud"] / r["total"] * 100, 2) if r["total"] > 0 else 0}
        for r in rows
    ]


@app.get("/analytics/amount-distribution")
def analytics_amount_distribution():
    """Amount distribution in buckets"""
    conn = get_conn()
    buckets = [
        ("₹0 - ₹1K", 0, 1000),
        ("₹1K - ₹5K", 1000, 5000),
        ("₹5K - ₹10K", 5000, 10000),
        ("₹10K - ₹50K", 10000, 50000),
        ("₹50K - ₹1L", 50000, 100000),
        ("₹1L - ₹5L", 100000, 500000),
        ("₹5L+", 500000, 999999999),
    ]

    result = []
    for label, low, high in buckets:
        row = conn.execute("""
            SELECT COUNT(*) as count, SUM(is_fraud) as fraud,
                   ROUND(SUM(amount), 2) as volume
            FROM transactions WHERE amount >= ? AND amount < ?
        """, (low, high)).fetchone()
        result.append({
            "bucket": label,
            "count": row["count"],
            "fraud": row["fraud"] or 0,
            "volume": row["volume"] or 0,
        })

    conn.close()
    return result


@app.get("/analytics/city-distribution")
def analytics_city_distribution():
    """Transaction distribution by sender city"""
    conn = get_conn()
    rows = conn.execute("""
        SELECT sender_city as city,
               COUNT(*) as total,
               SUM(is_fraud) as fraud,
               ROUND(SUM(amount), 2) as volume
        FROM transactions GROUP BY sender_city ORDER BY total DESC LIMIT 15
    """).fetchall()
    conn.close()
    return [
        {"city": r["city"], "total": r["total"],
         "fraud": r["fraud"], "volume": r["volume"]}
        for r in rows
    ]


@app.get("/analytics/top-accounts")
def analytics_top_accounts():
    """Top sender and receiver accounts by volume"""
    conn = get_conn()

    top_senders = conn.execute("""
        SELECT sender_upi as account, sender_city as city,
               COUNT(*) as txn_count,
               ROUND(SUM(amount), 2) as total_volume,
               SUM(is_fraud) as fraud_count
        FROM transactions GROUP BY sender_upi
        ORDER BY total_volume DESC LIMIT 10
    """).fetchall()

    top_receivers = conn.execute("""
        SELECT receiver_upi as account, receiver_city as city,
               COUNT(*) as txn_count,
               ROUND(SUM(amount), 2) as total_volume,
               SUM(is_fraud) as fraud_count
        FROM transactions GROUP BY receiver_upi
        ORDER BY total_volume DESC LIMIT 10
    """).fetchall()

    conn.close()
    return {
        "top_senders": [
            {"account": r["account"], "city": r["city"],
             "txn_count": r["txn_count"], "total_volume": r["total_volume"],
             "fraud_count": r["fraud_count"]}
            for r in top_senders
        ],
        "top_receivers": [
            {"account": r["account"], "city": r["city"],
             "txn_count": r["txn_count"], "total_volume": r["total_volume"],
             "fraud_count": r["fraud_count"]}
            for r in top_receivers
        ],
    }


@app.get("/analytics/fraud-patterns")
def analytics_fraud_patterns():
    """Statistical fraud pattern analysis"""
    conn = get_conn()

    # Fraud by type
    fraud_by_type = conn.execute("""
        SELECT txn_type_raw as type, txn_type as label,
               COUNT(*) as total, SUM(is_fraud) as fraud
        FROM transactions GROUP BY txn_type_raw ORDER BY fraud DESC
    """).fetchall()

    # Fraud by hour
    fraud_by_hour = conn.execute("""
        SELECT hour_of_day as hour,
               COUNT(*) as total, SUM(is_fraud) as fraud
        FROM transactions GROUP BY hour_of_day ORDER BY hour
    """).fetchall()

    # Fraud amount stats
    fraud_amount = conn.execute("""
        SELECT ROUND(AVG(amount), 2) as avg_fraud_amount,
               ROUND(MAX(amount), 2) as max_fraud_amount,
               ROUND(MIN(amount), 2) as min_fraud_amount,
               ROUND(SUM(amount), 2) as total_fraud_volume
        FROM transactions WHERE is_fraud = 1
    """).fetchone()

    legit_amount = conn.execute("""
        SELECT ROUND(AVG(amount), 2) as avg_legit_amount,
               ROUND(MAX(amount), 2) as max_legit_amount,
               ROUND(MIN(amount), 2) as min_legit_amount
        FROM transactions WHERE is_fraud = 0
    """).fetchone()

    # Account drain analysis
    drained = conn.execute("""
        SELECT COUNT(*) as count FROM transactions
        WHERE new_balance_sender = 0 AND old_balance_sender > 0
    """).fetchone()

    drained_fraud = conn.execute("""
        SELECT COUNT(*) as count FROM transactions
        WHERE new_balance_sender = 0 AND old_balance_sender > 0 AND is_fraud = 1
    """).fetchone()

    # Balance mismatch
    mismatch = conn.execute("""
        SELECT COUNT(*) as count FROM transactions
        WHERE ABS(old_balance_sender - amount - new_balance_sender) > 1
    """).fetchone()

    conn.close()

    return {
        "fraud_by_type": [
            {"type": r["type"], "label": r["label"],
             "total": r["total"], "fraud": r["fraud"],
             "fraud_rate": round(r["fraud"] / r["total"] * 100, 2) if r["total"] > 0 else 0}
            for r in fraud_by_type
        ],
        "fraud_by_hour": [
            {"hour": r["hour"], "total": r["total"], "fraud": r["fraud"],
             "fraud_rate": round(r["fraud"] / r["total"] * 100, 2) if r["total"] > 0 else 0}
            for r in fraud_by_hour
        ],
        "fraud_amount_stats": {
            "avg": fraud_amount["avg_fraud_amount"],
            "max": fraud_amount["max_fraud_amount"],
            "min": fraud_amount["min_fraud_amount"],
            "total_volume": fraud_amount["total_fraud_volume"],
        },
        "legit_amount_stats": {
            "avg": legit_amount["avg_legit_amount"],
            "max": legit_amount["max_legit_amount"],
            "min": legit_amount["min_legit_amount"],
        },
        "account_drain": {
            "total_drained": drained["count"],
            "drained_fraud": drained_fraud["count"],
            "drain_fraud_rate": round(drained_fraud["count"] / drained["count"] * 100, 2) if drained["count"] > 0 else 0,
        },
        "balance_mismatch_count": mismatch["count"],
    }


@app.get("/analytics/daily-trend")
def analytics_daily_trend():
    """Daily transaction trend over time"""
    conn = get_conn()
    rows = conn.execute("""
        SELECT DATE(created_at) as date,
               COUNT(*) as total,
               SUM(is_fraud) as fraud,
               ROUND(SUM(amount), 2) as volume,
               ROUND(AVG(amount), 2) as avg_amount
        FROM transactions
        GROUP BY DATE(created_at) ORDER BY date
    """).fetchall()
    conn.close()
    return [
        {"date": r["date"], "total": r["total"], "fraud": r["fraud"],
         "volume": r["volume"], "avg_amount": r["avg_amount"]}
        for r in rows
    ]


@app.get("/analytics/heatmap")
def analytics_heatmap():
    """Hour x Day-of-week heatmap data"""
    conn = get_conn()
    rows = conn.execute("""
        SELECT hour_of_day as hour, day_of_week as day,
               COUNT(*) as count
        FROM transactions GROUP BY hour_of_day, day_of_week
    """).fetchall()
    conn.close()
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return [
        {"hour": r["hour"], "day": days[r["day"]], "day_index": r["day"], "count": r["count"]}
        for r in rows
    ]


# ---------------------------------------------------------------------------
#  Run directly: python main.py
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
