# Instant Wellness Kits — Admin Panel

> **Hackathon project by team 67Enjoyers**  
> Full-stack admin panel for managing drone-delivered wellness kit orders across New York State with real-time composite sales tax calculation.

---

## 🏗 Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · TypeScript · Vite · TailwindCSS · TanStack Query · React Hook Form · i18next (EN/UK) |
| **Backend** | Node.js · Express · TypeScript · Zod validation |
| **Database** | PostgreSQL 16 · Prisma ORM |
| **Geocoding** | OpenStreetMap Nominatim (rate-limited, DB-cached) |

## 🧮 Tax Engine

Deterministic NY State composite sales tax calculator:

1. **Reverse geocode** GPS coordinates → county / city via Nominatim API  
2. **Look up** county tax rate from a local dataset of all **62 NY counties**  
3. **Add** city-specific rates (Yonkers, NYC boroughs, etc.)  
4. **Add** MCTD surcharge (0.375%) for metro-area counties  
5. **Compute** `composite_rate = state_rate + county_rate + city_rate + special_rates`  
6. **Return** `tax_amount = subtotal × composite_rate`, rounded to 2 decimals

NYC borough mapping: Manhattan → New York County, Brooklyn → Kings, Queens → Queens, Bronx → Bronx, Staten Island → Richmond.

## 📊 Features

- **Dashboard** — aggregate stats, top jurisdictions chart, subtotal distribution
- **Orders table** — paginated, sortable, filterable, expandable rows with tax breakdown
- **Create order** — manual entry with instant tax calculation
- **CSV import** — bulk import 11K+ orders with batch processing
- **Drone map** — interactive Leaflet map with animated drone delivery simulation (speed controls 1×/2×/5×/10×, bezier flight paths, return-to-HQ animation)
- **i18n** — English 🇺🇸 and Ukrainian 🇺🇦
- **Geocode caching** — avoids duplicate API calls for same coordinates
- **Local geocoder** — centroid-based reverse geocoding for instant bulk tax calculation (no API dependency)

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- PostgreSQL 16 running locally

### 1. Clone & install

```bash
git clone <repo-url> && cd 67Enjoyers
cd server && npm install
cd ../client && npm install
```

### 2. Database setup

```bash
cd server

# Create the database
createdb instant_wellness_kits

# Copy .env and adjust DATABASE_URL if needed
# Default: postgresql://$(whoami)@localhost:5432/instant_wellness_kits
cat .env

# Run migrations
npx prisma migrate dev

# (Optional) Seed with orders.csv — place orders.csv in project root
npm run db:seed
```

### 3. Run

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Import orders

Either:
- Use the **Import CSV** page in the UI to upload `orders.csv`
- Or run `cd server && npm run db:seed` to seed from CLI

## 📁 CSV Format

```
id,longitude,latitude,timestamp,subtotal
1,-78.867,42.012,2025-11-04 10:17:04.915257248,120.0
```

| Column | Description |
|--------|-----------|
| `id` | Original order ID (integer) |
| `longitude` | GPS longitude (note: before latitude!) |
| `latitude` | GPS latitude |
| `timestamp` | Order timestamp |
| `subtotal` | Order subtotal in USD |

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/orders` | List orders (paginated, filterable) |
| `GET` | `/orders/stats` | Aggregate statistics |
| `GET` | `/orders/:id` | Get single order |
| `POST` | `/orders` | Create order with tax calculation |
| `POST` | `/orders/import` | Bulk import from CSV |
| `DELETE` | `/orders/:id` | Delete single order |
| `DELETE` | `/orders` | Delete all orders |
| `GET` | `/health` | Health check |

## 📝 Query Parameters for GET /orders

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `sortBy` | string | timestamp | Sort field |
| `sortOrder` | asc/desc | desc | Sort direction |
| `search` | string | — | Search by original ID |
| `subtotalMin` | number | — | Min subtotal filter |
| `subtotalMax` | number | — | Max subtotal filter |
| `taxRateMin` | number | — | Min tax rate filter |
| `taxRateMax` | number | — | Max tax rate filter |

## 🗂 Project Structure

```
67Enjoyers/
├── orders.csv              # Real dataset (11,222 orders)
├── README.md
├── server/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── index.ts              # Express entry point
│   │   ├── seed.ts               # CLI seeder
│   │   ├── data/nyTaxRates.ts    # All 62 NY county rates
│   │   ├── services/
│   │   │   ├── geocoding.ts      # Nominatim + cache    │   │   │   ├── localGeocoding.ts  # Centroid-based local geocoder│   │   │   └── taxEngine.ts      # Composite tax calculator
│   │   ├── controllers/orders.ts
│   │   ├── routes/orders.ts
│   │   └── utils/
│   │       ├── csvParser.ts
│   │       └── validation.ts
│   └── package.json
└── client/
    ├── src/
    │   ├── App.tsx
    │   ├── pages/
    │   │   ├── DashboardPage.tsx
    │   │   ├── OrdersPage.tsx
    │   │   ├── CreateOrderPage.tsx
    │   │   ├── ImportPage.tsx
    │   │   └── MapPage.tsx
    │   ├── components/
    │   ├── hooks/useOrders.ts
    │   ├── api/
    │   ├── i18n/ (en + uk)
    │   └── utils/format.ts
    └── package.json
```

## 👥 Team

**67Enjoyers**
