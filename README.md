# UPI Transaction Analytics Dashboard

A data analytics dashboard for exploring and analyzing UPI (Unified Payments Interface) transaction patterns. Built on the **PaySim dataset** (6.3 million synthetic financial transactions), it provides interactive visualizations, trend analysis, and fraud pattern insights — all through **pure statistical analysis**, no machine learning models.

## Features

- **Interactive Overview** — KPI cards, daily trend charts, and transaction type distribution
- **Transaction Explorer** — Filterable, sortable, paginated table with type/fraud/amount filters
- **Advanced Analytics** — Activity heatmap, hourly patterns, amount distribution, city breakdown, radar charts, and top account leaderboards
- **Fraud Pattern Analysis** — Statistical fraud patterns: type/hour fraud rates, amount comparisons, account drain detection, balance mismatch analysis
- **Real PaySim Data** — Analyzed from 6.3M synthetic financial transactions mirroring real mobile money patterns
- **Dark Premium UI** — Glassmorphism cards, gradient accents, micro-animations, and a fully responsive dark theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, SQLite, Pandas, NumPy |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Recharts, Vite |
| **Dataset** | PaySim (493 MB CSV — 6.3M transactions) |

## Project Structure

```
├── serving/
│   └── main.py                 # FastAPI backend — analytics API, data seeding
├── dashboard/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx       # Authentication page
│   │   │   ├── Dashboard.tsx   # Overview with KPIs & charts
│   │   │   ├── Transactions.tsx# Transaction explorer with filters
│   │   │   ├── Analytics.tsx   # Advanced analytics & visualizations
│   │   │   └── FraudPatterns.tsx# Statistical fraud pattern analysis
│   │   ├── App.tsx             # Router & sidebar layout
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Dark theme design system
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── paysim.csv              # PaySim dataset (493 MB, 6.3M rows)
├── fraud_data.db               # SQLite database (auto-created on startup)
├── requirements.txt            # Python dependencies
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
1. Loads the PaySim CSV dataset
2. Creates `fraud_data.db` with the analytics schema
3. Seeds 2,000 real PaySim transactions (200 fraud + 1,800 legit)

### 4. Start the Frontend

```bash
cd dashboard
npm run dev
```

The dashboard opens at **http://localhost:5173**

**Login:** `admin@upifraud.com` / `admin123`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/overview` | Dashboard KPIs — totals, fraud rate, type breakdown, daily trend |
| `GET` | `/transactions` | Filterable transaction list (type, fraud, amount, sort, pagination) |
| `GET` | `/analytics/hourly` | Hourly transaction distribution |
| `GET` | `/analytics/type-distribution` | Type breakdown with fraud rates |
| `GET` | `/analytics/amount-distribution` | Amount range histogram |
| `GET` | `/analytics/city-distribution` | Geographic transaction distribution |
| `GET` | `/analytics/top-accounts` | Top senders & receivers by volume |
| `GET` | `/analytics/fraud-patterns` | Statistical fraud analysis |
| `GET` | `/analytics/daily-trend` | Daily time-series data |
| `GET` | `/analytics/heatmap` | Hour × Day-of-week activity heatmap |

## Dashboard Pages

### 1. Overview
KPI cards (total transactions, volume, fraud count, unique accounts), daily trend area chart, transaction type pie chart, volume bar chart, and fraud distribution.

### 2. Transaction Explorer
Full table with type/fraud filters, column sorting, pagination, city info, and status badges.

### 3. Advanced Analytics
GitHub-style activity heatmap, hourly pattern area chart, amount distribution histogram, city horizontal bar chart, radar chart for type comparison, and top account leaderboards.

### 4. Fraud Patterns
Fraud rate by type, fraud rate by hour, fraud vs legit amount comparison, fraud distribution pie, account drain statistics, balance mismatch detection, risk level badges, and key findings summary.

## Dataset

This project uses the **PaySim** dataset — a synthetic dataset generated from real mobile money transaction logs.

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
