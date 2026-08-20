# Society Maintenance Tracker

A comprehensive solution for societies and apartments to track maintenance complaints, notices, and track recurring issues. Built with Next.js 14, Tailwind CSS, Prisma, and PostgreSQL.

## Features
- **Role-based Access**: Separate dashboards and permissions for Residents and Admins.
- **Complaint Lifecycle**: Log complaints, track status history (Open -> In Progress -> Resolved).
- **Overdue Detection**: Cron job automatically flags complaints that haven't been resolved within a configurable threshold.
- **Notice Board**: Admins can post notices. Important notices are highlighted.
- **Hotspot Intelligence (Wow Factor)**: The admin dashboard automatically detects "hotspots"—recurring issues of the same category in the same location (e.g., plumbing issues in Block A) over a 60-day window, indicating a deeper root cause.

## Tech Stack
- Frontend & Backend: Next.js 14 (App Router)
- Database: PostgreSQL (via Prisma ORM)
- Authentication: NextAuth.js (Credentials Provider)
- Styling: Tailwind CSS

## Local Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Database Setup**
   Ensure you have a PostgreSQL instance running (or use Neon/Supabase).
   Copy `.env.example` to `.env` and update the `DATABASE_URL`.

   Run Prisma migrations:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## API Documentation

### Auth
- `POST /api/auth/register`: Register a new user (resident or admin).

### Complaints
- `GET /api/complaints`: List complaints for the logged-in resident.
- `POST /api/complaints`: Log a new complaint.
- `GET /api/complaints/:id`: Get complaint details and status history.
- `GET /api/admin/complaints`: (Admin) List all complaints with optional filtering.
- `PATCH /api/admin/complaints/:id`: (Admin) Update complaint status/priority (automatically logs to history).

### Notices
- `GET /api/notices`: View the notice board.
- `POST /api/admin/notices`: (Admin) Post a new notice.

### Cron
- `POST /api/cron/check-overdue`: Triggers overdue calculation.

## Database Schema Highlights
- `User`: Handles both admins and residents.
- `Complaint`: The core issue tracker.
- `ComplaintStatusHistory`: An immutable audit log of status changes.
- `Notice`: Broadcast messages.
- `Config`: Stores global settings like `overdueThresholdDays`.
