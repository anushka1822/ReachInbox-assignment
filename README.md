# ReachInbox Full-Stack Email Scheduler

A production-grade email scheduling system built as an assignment for **ReachInbox**.
This solution supports reliable, scalable email scheduling using **BullMQ, Redis, and PostgreSQL**, ensuring persistence across restarts and handling concurrency/rate-limiting constraints.

## 🚀 Features

### Backend
-   **No Cron Jobs:** Uses **BullMQ** delayed jobs for precise scheduling.
-   **Persistence:** Jobs and email states are stored in **Redis** and **PostgreSQL**, surviving server restarts.
-   **Concurrency:** Configurable worker concurrency to handle multiple jobs in parallel.
-   **Rate Limiting:** Implemented to adhere to provider limits (e.g., max emails per hour).
-   **Ethereal Email:** Integration with Ethereal for fake SMTP sending.

### Frontend
-   **Glassmorphism UI:** Premium, modern interface with dark mode aesthetics.
-   **Google OAuth:** Secure login via NextAuth.js.
-   **Dashboard:** Real-time view of Scheduled vs. Sent emails.
-   **Smart Inputs:** Datetime picker for precise scheduling.

---

## 🛠️ Architecture Overview

1.  **Scheduling (No Cron):**
    -   When a user schedules an email, the API calculates the delay (`scheduledTime - now`) and adds a job to the **BullMQ** queue with a `delay` parameter.
    -   This offloads timing to Redis, ensuring the application doesn't need to poll the database or run a cron loop.

2.  **Persistence:**
    -   **Redis** holds the active/delayed job queue. If the Node.js process dies, the jobs remain in Redis.
    -   **PostgreSQL** (Prisma) acts as the source of truth for email history and status (PENDING, SENT, FAILED).

3.  **Rate Limiting:**
    -   We use a robust token bucket or window approach (depending on configuration) to ensure we don't exceed the `MAX_EMAILS_PER_HOUR` limit.
    -   Excess jobs are automatically delayed to the next available window.

---

## 🔧 Setup & Installation

### Prerequisites
-   Node.js (v18+)
-   Redis (running locally or via Docker)
-   PostgreSQL (running locally or via Docker)

### 1. Environment Variables
This project uses environment variables for configuration.
We have provided example files for you.

**Backend:**
Copy `apps/api/.env.example` to `apps/api/.env` and fill in your credentials.

**Frontend:**
Copy `apps/web/.env.example` to `apps/web/.env` and fill in your credentials.

### 2. run Backend
The backend consists of the API server and the Worker process.

```bash
cd apps/api
npm install
npx prisma generate
npx prisma db push  # Sync schema with DB

# Terminal 1: API Server
npm run dev

# Terminal 2: Worker (Background Processor)
npm run worker:dev
```

### 3. Run Frontend

```bash
cd apps/web
npm install
npm run dev
```

Visit **http://localhost:3000** to access the dashboard.

---

## 🧪 Tech Stack

-   **Backend:** TypeScript, Express.js, Prisma, BullMQ, Redis, Nodemailer
-   **Frontend:** Next.js (App Router), Tailwind CSS, NextAuth.js
-   **Design:** Glassmorphism UI (Custom CSS + Tailwind)

---

## 📝 Assumptions & Trade-offs
-   **Ethereal Email:** We rely on Ethereal for "sending" emails. In production, this would be swapped for SendGrid/SES.
-   **Redis Persistence:** We assume Redis AOF/RDB is enabled for full durability in a standard production setup.
