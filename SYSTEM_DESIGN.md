# System Design: Society Maintenance Tracker

## 1. Overview
The Society Maintenance Tracker is a full-stack web application designed to streamline the management of community issues and communication. The system provides role-based access, allowing residents to log complaints and admins to manage their resolution, broadcast notices, and identify recurring structural issues. Built on **Next.js 14**, **Prisma**, and **PostgreSQL**, the architecture prioritizes data integrity, auditability, and ease of deployment.

## 2. Core Architectural Decisions

### 2.1 The Status History Model (Audit Trail)
A common pitfall in complaint tracking systems is mutating the status directly on the complaint record without preserving *how* or *when* it got there. To solve this, the application implements a dedicated `ComplaintStatusHistory` table. 

**How it works:**
Whenever an admin updates a complaint's status (e.g., from "Open" to "In Progress"), the API route (`PATCH /api/admin/complaints/:id`) performs two operations in a transaction:
1. It updates the `status` field on the `Complaint` table.
2. It inserts a new record into `ComplaintStatusHistory` detailing the `oldStatus`, `newStatus`, the ID of the user who made the change, and an optional note.

**Why it matters:**
This creates an immutable audit trail. Residents are never left wondering "why" a complaint was closed, as admins can append explanatory notes. It also guarantees that the system's "source of truth" for lifecycle metrics (e.g., time to resolution) is strictly append-only and tamper-proof.

### 2.2 Overdue Detection via Cron and Computed State
Ensuring that complaints don't fall through the cracks requires a robust overdue tracking mechanism. 

**How it works:**
The definition of "overdue" is dynamic and stored in a `Config` table (`overdueThresholdDays`, defaulting to 3 days). 
We use a hybrid approach to detect overdue tickets:
- **Background Job**: A daily cron job (`POST /api/cron/check-overdue`, triggered via Vercel Cron) queries the database for any unresolved complaints older than the threshold and flips their `isOverdue` boolean flag to `true`.
- **Live Fallback**: The UI and API optionally calculate age on-the-fly, ensuring that a ticket that crosses the threshold at noon appears overdue immediately, without waiting for the midnight cron run.

**Why it matters:**
Denormalizing the `isOverdue` flag via the cron job allows the database to easily index and sort queries (e.g., placing overdue items at the top of the admin dashboard) without complex date math in every SQL query.

### 2.3 Photo Handling Strategy
Handling user-uploaded media directly on application servers leads to bloated repositories and complex scaling issues. 

**How it works:**
The system offloads media storage to a dedicated CDN (like Cloudinary or Supabase Storage). 
When a resident submits a complaint with a photo:
1. The client requests a signed upload URL from the backend.
2. The client uploads the binary image directly to the cloud storage bucket.
3. The cloud provider returns a secure URL.
4. The client submits the complaint payload to our API containing only the `photoUrl` string.

**Why it matters:**
Our database remains lightweight, backing up the data takes milliseconds, and images are delivered globally via edge CDNs rather than passing through our Node.js runtime. 

### 2.4 Notification Flow
Timely communication is managed via a centralized email helper (`src/lib/email.ts`), designed to easily swap between Nodemailer (for self-hosting) or Resend (for serverless).

**Trigger Points:**
1. **Status Updates:** When a complaint status changes, the history write operation triggers an asynchronous email to the resident, keeping them informed without requiring them to poll the dashboard.
2. **Important Notices:** When an admin posts a notice and toggles `isImportant: true`, the API fires a broadcast loop. In a production scenario, this integrates with bulk-email APIs (like Resend's batch endpoint) to avoid rate limits.

### 2.5 The "Wow" Factor: Recurring Issue Intelligence (Hotspots)
The most significant pain point for facility admins is distinguishing between one-off breakages and systemic failures. To address this, the application includes a **Hotspot Detection** algorithm built directly into the admin dashboard.

**How it works:**
Instead of relying on admins to manually cross-reference spreadsheets, the dashboard computes a rolling 60-day window of complaints. It groups them by a composite key of `Category + Location` (e.g., `Plumbing + Block A`). If a specific cluster crosses a threshold (e.g., 3+ complaints), the UI dynamically generates a "Hotspot Panel."

**Why it matters:**
This transitions the application from a passive "record keeper" to an active "insight generator." By flagging that Block A has had 5 plumbing complaints in a month, admins know to investigate main water lines rather than just fixing individual taps. It elevates the tool from simple CRUD to true facility intelligence. 
