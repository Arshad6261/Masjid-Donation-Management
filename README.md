# Hazrat Sultan Sha Peer — Masjid & Dargah Donation Management System

A mobile-first web application for managing donations and expenditures for Hazrat Sultan Sha Peer Masjid & Dargah. Replaces the paper register system used by committee members.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS v3, React Router v6, TanStack React Query, Recharts, React Hook Form + Zod, React Hot Toast |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs |
| Database | MongoDB |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Clone & Install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Setup

Copy the example env file and edit as needed:

```bash
cp .env.example server/.env
```

Default values in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/masjid-db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed the Database

```bash
cd server && node seed.js
```

This creates:
- **Admin user**: `admin@masjid.com` / `Admin@123`
- 10 sample donors across 3 areas
- 3 months of sample donations
- 5 sample expenditures

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and login with the admin credentials.

## Project Structure

```
/
├── client/               # Vite + React frontend
│   └── src/
│       ├── api/          # Axios client
│       ├── components/   # Layout, shared UI
│       ├── context/      # Auth context
│       └── pages/        # All page components
├── server/               # Express backend
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   ├── utils/            # DB connection
│   └── seed.js           # Database seeder
└── .env.example
```

## Features

- **Dashboard** — Fund summaries, donation trends chart, quick actions
- **Donor Management** — CRUD with search, area/fund filtering, donation history
- **Donation Tracking** — Monthly view, receipt generation, WhatsApp sharing
- **Expense Management** — Categorized spending with fund-level tracking
- **House Visit Routes** — Plan collection routes by area, checklist-style collection
- **Reports** — P&L per fund, defaulter lists, printable exports
- **Mobile-first** — Bottom navigation on mobile, sidebar on desktop
