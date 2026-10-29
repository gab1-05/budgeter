# Expense Tracker - Vibrant Docker Edition

A production-quality expense tracker with recurring payments, AI insights, budgets, safe-to-spend calculator, and a vibrant editorial design. Built with React, Node.js, MongoDB, and Docker.

## Features

- **Complete Transaction Management**: Income, expenses, transfers with categories, merchants, payment methods
- **Recurring Payments**: Daily, weekly, monthly, quarterly, yearly schedules with variable amounts
- **AI-Powered Insights**: Spending comparisons, anomaly detection, personalized recommendations
- **Safe-to-Spend Calculator**: Transparent calculation with scenario planning
- **Budgets**: Category budgets with visual progress tracking
- **Calendar View**: Monthly calendar with upcoming payments
- **Accounts**: Multiple account types (cash, bank, credit, wallet) with balance tracking
- **CSV Import/Export**: Full data portability with duplicate detection
- **Vibrant Design**: Editorial design system with electric purple, cobalt blue, coral, lime, amber
- **Light/Dark Themes**: System-aware theme switching
- **Docker Ready**: Multi-service Docker Compose with health checks

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Auth**: JWT with bcrypt
- **Charts**: Recharts
- **Dates**: date-fns
- **Containerization**: Docker + Docker Compose

---

## 🐳 Quick Start with Docker (Recommended)

### Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine + Docker Compose v2** (Linux)
- At least 2GB free RAM

### 1. Start Docker Desktop

**Windows/Mac**: Open Docker Desktop from Start Menu/Applications. Wait for the whale icon to become steady (not animating).

**Linux**: 
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Build and Start All Services

No configuration is required — every environment variable has a working default in `docker-compose.yml`. Just run:

```bash
cd CA2
docker compose up --build -d
```

This starts 4 services:
| Service | Port | Description |
|---------|------|-------------|
| **MongoDB** | 27017 | Database |
| **Backend API** | 3001 | Express REST API |
| **Worker** | - | Recurring payment processor |
| **Frontend** | 5173 | React SPA (nginx) |

### 3. Seed Database (First Run Only)

```bash
docker compose exec backend npm run seed
```

This creates:
- Demo user: `demo@example.com` / `demo123`
- 19 default categories (expense + income)
- 4 default accounts (Checking, Savings, Cash, Credit Card)

> The seeder is idempotent — running it again will not create duplicates.

### 4. Access the App

Open **http://localhost:5173** in your browser.

**Demo Login:**
- Email: `demo@example.com`
- Password: `demo123`

> **Fresh database?** The seed step above is what creates the demo login. Without it, the app starts empty — just register a new account from the UI instead.

### Running on Another Device

The project is fully self-contained — copy the `CA2` folder (or clone the repo) and run the same steps. On a new machine the database starts **empty**, so either:

- **Register** a fresh account through the UI, **or**
- **Seed the demo data** with `docker compose exec backend npm run seed`, then log in as `demo@example.com` / `demo123`.

Only prerequisites: Docker Desktop (or Docker Engine + Compose) and free ports `27017`, `3001`, and `5173`.

---

## 📋 Docker Commands Reference

```bash
# Start all services (build if needed)
docker compose up --build -d

# Start without rebuilding
docker compose up -d

# View service status
docker compose ps

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f worker
docker compose logs -f mongodb

# Stop services (keeps data)
docker compose down

# Stop and REMOVE all data (⚠️ DELETES DATABASE)
docker compose down -v

# Rebuild a specific service
docker compose build backend
docker compose up -d backend

# Run backend commands inside container
docker compose exec backend npm run seed
docker compose exec backend node worker.js

# Restart a service
docker compose restart backend

# View resource usage
docker compose stats
```

---

## 🔧 Troubleshooting

### "Cannot GET /" or Blank Page

1. **Check Docker Desktop is running** - whale icon should be steady
2. **Check containers are running**: `docker compose ps`
3. **Frontend not loading**: Wait 30s after `docker compose up -d` for nginx to start
4. **Clear browser cache** or try incognito mode

### Port Already in Use (3001/5173/27017)

```bash
# Find and kill process on Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# On Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check MongoDB logs
docker compose logs mongodb

# Verify MongoDB is healthy
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Re-seed database
docker compose exec backend npm run seed
```

### JWT Token / Login Issues

1. **Clear browser localStorage**: DevTools → Application → Local Storage → Clear
2. **Check backend logs**: `docker compose logs backend`
3. **Verify the backend is healthy**: `docker compose ps` (backend should show `healthy`)

### "Failed to save category" or Similar Save Errors

Rebuild the frontend after code changes — the SPA is served as a **static build** by nginx, so edits to `client/src` require a rebuild to take effect:

```bash
docker compose build frontend
docker compose up -d frontend
```

Then hard-refresh the browser (`Ctrl+Shift+R`) to clear the cached bundle.

### "Transaction numbers are only allowed on a replica set member"

This is a MongoDB standalone limitation. The code has been updated to work without MongoDB transactions (uses individual operations instead of transactions).

---

## 🏗️ Project Structure

```
CA2/
├── docker-compose.yml          # Docker orchestration (4 services)
├── server/                     # Backend (Express + Mongoose)
│   ├── Dockerfile              # Multi-stage build
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js               # Express app entry
│   ├── worker.js               # Recurring payment processor
│   ├── seed.js                 # Database seeder
│   ├── models/                 # Mongoose models (6 models)
│   ├── routes/                 # API routes (10 route files)
│   └── middleware/             # Auth middleware
└── client/                     # Frontend (React + Vite)
    ├── Dockerfile              # Multi-stage build with nginx
    ├── .dockerignore
    ├── nginx.conf              # Nginx config for SPA + API proxy
    ├── package.json
    ├── tailwind.config.js      # Vibrant design system
    ├── postcss.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css           # Tailwind + custom styles
        ├── services/api.js     # Axios API client
        ├── components/
        │   ├── Navbar.jsx
        │   └── Icons.jsx
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── AddTransaction.jsx
            ├── Categories.jsx
            ├── Accounts.jsx
            ├── Recurring.jsx
            ├── Budgets.jsx
            ├── Insights.jsx
            ├── SafeToSpend.jsx
            ├── Calendar.jsx
            └── Settings.jsx
```

---

## ⚙️ Environment Variables

All variables have working defaults baked into `docker-compose.yml`, so **no `.env` file is required** to run the app. They're only needed if you want to override the defaults (e.g., for production):

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://mongodb:27017/expenseTracker` |
| `JWT_SECRET` | JWT signing secret | `super_secret_jwt_key_change_in_production` |
| `NODE_ENV` | Environment | `production` (backend) |
| `PORT` | Backend port | `3001` |
| `VITE_API_URL` | Frontend API URL | `` (empty = relative URLs via nginx) |

**Production overrides (optional):** create a `.env` next to `docker-compose.yml`:

```env
JWT_SECRET=your-super-secure-random-string-here
NODE_ENV=production
```

> If you change `JWT_SECRET`, any previously issued login tokens are invalidated — users must log in again.

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires token)

### Transactions
- `GET /api/transactions` - List with filters & pagination
- `GET /api/transactions/summary` - Period summary
- `POST /api/transactions` - Create
- `PUT /api/transactions/:id` - Update
- `DELETE /api/transactions/:id` - Delete

### Categories
- `GET /api/categories` - List
- `POST /api/categories` - Create
- `PUT /api/categories/:id` - Update
- `DELETE /api/categories/:id` - Delete

### Accounts
- `GET /api/accounts` - List
- `GET /api/accounts/default` - Get default
- `POST /api/accounts` - Create
- `PUT /api/accounts/:id` - Update
- `DELETE /api/accounts/:id` - Delete

### Recurring Payments
- `GET /api/recurring` - List schedules
- `GET /api/recurring/upcoming` - Next 30 days
- `POST /api/recurring` - Create
- `PUT /api/recurring/:id` - Update
- `PATCH /api/recurring/:id/toggle` - Pause/resume
- `DELETE /api/recurring/:id` - Delete

### Budgets
- `GET /api/budgets` - List with progress
- `GET /api/budgets/summary` - Budget vs spending
- `POST /api/budgets` - Create
- `PUT /api/budgets/:id` - Update
- `DELETE /api/budgets/:id` - Delete

### Insights
- `GET /api/insights/spending-comparison` - Period comparison
- `GET /api/insights/monthly-trend` - 12-month trend
- `GET /api/insights/category-breakdown` - Category pie
- `GET /api/insights/anomalies` - Unusual transactions
- `GET /api/insights/recurring-impact` - Recurring vs income
- `GET /api/insights/recommendations` - Saving recommendations

### Safe to Spend
- `POST /api/safe-to-spend/calculate` - Full calculation
- `GET /api/safe-to-spend/quick` - Quick estimate

### Import/Export
- `GET /api/import-export/export` - CSV export
- `POST /api/import-export/import` - CSV import
- `POST /api/import-export/import/preview` - Preview import

---

## 💻 Local Development (Without Docker)

### Backend Only
```bash
cd server
npm install
# server.js defaults to mongodb://localhost:27017/expenseTracker
# Set MONGO_URI env var if your MongoDB is elsewhere:
#   MONGO_URI=mongodb://localhost:27017/expenseTracker npm run dev
npm run dev
```

### Frontend Only
```bash
cd client
npm install
npm run dev
```

### Run Worker Separately
```bash
cd server
npm run worker
```

---

## 🚀 Production Deployment

1. **Set strong `JWT_SECRET`** in `.env` (32+ random chars)
2. **Use MongoDB Atlas** or managed MongoDB
3. **Set `NODE_ENV=production`** in `.env`
4. **Configure reverse proxy** (nginx/Traefik) for SSL termination
5. **Set up MongoDB backups** (Atlas auto-backup or mongodump cron)
6. **Configure log aggregation** (Loki, ELK, etc.)
7. **Set up monitoring** (Prometheus + Grafana)
8. **Configure CI/CD** (GitHub Actions, GitLab CI)

---

## 🎨 Design System

### Colors
- **Primary**: Electric Purple (`#7c4dff`)
- **Cobalt**: Vivid Blue (`#3b82f6`)
- **Coral**: Warm Orange (`#ea580c`)
- **Lime**: Bright Green (`#84cc16`)
- **Amber**: Warm Yellow (`#fbbf24`)

### Typography
- **Display**: Space Grotesk
- **Body**: DM Sans

### Components
All components use Tailwind with custom design tokens for consistent, vibrant UI.

---

## 📄 License

MIT