# UPI Fraud Detection Using Machine Learning

A real-time fraud detection system for UPI (Unified Payments Interface) transactions. It uses an ensemble of 4 trained ML models running on the **PaySim dataset** (6.3 million transactions, 8,213 fraud cases) with a FastAPI backend and a React + Tailwind dashboard.

## Features

- **ML Ensemble Detection** — XGBoost, Random Forest, LightGBM, and Isolation Forest working together with weighted scoring
- **Real PaySim Dataset** — Trained and evaluated on 6.3M synthetic financial transactions mirroring real-world mobile money patterns
- **Risk Scoring** — Every transaction gets a 0–1 risk score with individual model breakdowns
- **Decision Engine** — Automatic ALLOW / CHALLENGE / BLOCK decisions based on ensemble thresholds
- **Risk Explainability** — Human-readable reasons for each flag (account drained, high-value, late-night, balance mismatch, etc.)
- **Interactive Dashboard** — Login, transaction list, analytics charts, and model performance metrics
- **REST API** — Predict fraud on new transactions, query history, view stats

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **ML Models** | XGBoost, scikit-learn (Random Forest, Isolation Forest), LightGBM |
| **Backend** | Python, FastAPI, SQLite, Pandas, NumPy, Joblib |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Recharts, Vite |
| **Auth** | Supabase Auth (local zero-setup) |
| **Dataset** | PaySim (493 MB CSV — 6.3M transactions) |

## Project Structure

```
├── serving/
│   └── main.py                 # FastAPI backend — API routes, ML prediction, DB seeding
├── dashboard/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx       # Authentication page
│   │   │   ├── Dashboard.tsx   # Overview with stats & charts
│   │   │   ├── Transactions.tsx# Transaction list with risk scores
│   │   │   ├── Analytics.tsx   # Fraud analytics & trends
│   │   │   └── Models.tsx      # Model performance metrics
│   │   ├── App.tsx             # Router & layout
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Tailwind styles
│   ├── package.json
│   └── vite.config.ts
├── models/
│   ├── xgboost_model.pkl       # Trained XGBoost classifier
│   ├── random_forest_model.pkl # Trained Random Forest classifier
│   ├── lightgbm_model.pkl      # Trained LightGBM classifier
│   ├── isolation_forest_model.pkl # Trained Isolation Forest (anomaly)
│   └── scaler.pkl              # StandardScaler for feature normalization
├── data/
│   └── paysim.csv              # PaySim dataset (493 MB, 6.3M rows)
├── fraud_data.db               # SQLite database (auto-created on startup)
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
└── LICENSE
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd dashboard
npm install
```

### 3. Start the Backend

```bash
cd serving
python main.py
```

The backend starts at **http://localhost:8000**. On first run, it:
1. Loads all 4 ML models from `models/`
2. Creates `fraud_data.db` with the correct schema
3. Seeds 500 real PaySim transactions (100 fraud + 400 legit) through the ML ensemble

### 4. Start the Frontend

```bash
cd dashboard
npm run dev
```

The dashboard opens at **http://localhost:5173**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check — lists loaded models |
| `GET` | `/transactions` | Get transactions (supports `?limit=`, `?decision=`, `?fraud_only=`) |
| `POST` | `/predict` | Predict fraud for a new UPI transaction |
| `GET` | `/stats` | Fraud detection statistics & model performance |
| `DELETE` | `/transactions/reset` | Reset DB and re-seed from PaySim |

### Example — Predict Fraud

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "sender_upi": "rahul.sharma@ybl",
    "receiver_upi": "unknown.user@paytm",
    "amount": 500000,
    "txn_type": "TRANSFER"
  }'
```

**Response:**
```json
{
  "txn_id": "UPI3A8F2B1C9D0E",
  "risk_score": 0.8234,
  "decision": "BLOCK",
  "confidence": 0.82,
  "individual_scores": {
    "xgboost": 0.91,
    "random_forest": 0.78,
    "lightgbm": 0.85,
    "isolation_forest": 0.72
  },
  "risk_reasons": [
    "High-value transaction",
    "Risky type: TRANSFER"
  ]
}
```

## How It Works

1. **Feature Extraction** — Each transaction is converted into 20 engineered features: amount, log-amount, type encoding, balance diffs, drain detection, time-of-day, balance error signals, etc.
2. **Ensemble Prediction** — All 4 models score the transaction independently. Scores are combined using weighted averaging (XGBoost 35%, RF 25%, LightGBM 25%, IF 15%).
3. **Decision** — `risk_score > 0.7` → BLOCK, `> 0.35` → CHALLENGE, otherwise → ALLOW.
4. **Explainability** — Rule-based reasons are generated alongside the ML score for transparency.

## Dataset

This project uses the **PaySim** dataset — a synthetic dataset generated using real mobile money transaction logs from a month of financial activity in an African country.

- **6,362,620** total transactions
- **8,213** fraud cases (0.13% fraud rate)
- **5 transaction types**: PAYMENT, TRANSFER, CASH_OUT, CASH_IN, DEBIT
- PaySim IDs are converted to realistic Indian UPI IDs (e.g., `rahul.sharma@ybl`)

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Author

© 2025 S K Ismail

---

⭐ Star this repo if you found it useful!
