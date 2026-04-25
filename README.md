# Smart Campus Ops Hub

Smart Campus Ops Hub is a full-stack campus operations platform for managing facilities, resource bookings, and maintenance tickets.
It includes role-based workflows for admins, technicians, and end users.

## What this project includes

- **Ticket management**: Raise issues with attachments, track status, assign technicians, and add comments.
- **Resource management**: Create and manage campus resources/facilities.
- **Booking management**: Create, approve, reject, cancel, and list bookings.
- **Authentication**: Username/password login with JWT plus Google sign-in support.
- **Notifications**: Email notifications for ticket and booking events.

## Tech stack

- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend**: Spring Boot, Spring Security, Spring Data JPA, Liquibase
- **Database**: PostgreSQL (default)
- **Build tools**: Maven (backend), npm (frontend)

## Repository structure

```text
PAF/
  backend/     Spring Boot API
  frontend/    React + Vite web app
  uploads/     Uploaded ticket attachments
```

## Prerequisites

- Java 25 (the backend `pom.xml` is configured with `java.version=25`)
- Maven 3.9+ (or use the Maven wrapper in `backend`)
- Node.js 20+ and npm
- PostgreSQL 14+ (or compatible)

## Backend setup (`backend`)

1. Create a PostgreSQL database:
   - Name: `smart_campus` (default used by the app), or adjust `DATABASE_URL`.
2. Create `backend/.env` with the variables below.
3. Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend default URL: `http://localhost:8080`

### Backend environment variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/smart_campus

# Frontend origin
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMTP (Brevo)
BREVO_SMTP_HOST=
BREVO_SMTP_PORT=
BREVO_SMTP_USER=
BREVO_SMTP_KEY=
BREVO_SMTP_FROM=
```

## Frontend setup (`frontend`)

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Optional: create `frontend/.env` for Google login UI settings:

```env
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

3. Start the frontend:

```bash
cd frontend
npm run dev
```

Frontend default URL: `http://localhost:5173`

The Vite config proxies `/api/*` requests to `http://localhost:8080`.

## Default seeded users

The backend seeds default users on startup:

- `admin` / `Admin@123` (ADMIN)
- `AdminDheena` / `Dheena@123` (ADMIN)
- `tech1` / `Tech@123` (TECHNICIAN)
- `tech2` / `Tech@123` (TECHNICIAN)
- `tech3` / `Tech@123` (TECHNICIAN)

## Main API groups

### Auth APIs (`/auth`)

- `GET /auth/`
- `POST /auth/register`
- `POST /auth/token`
- `POST /auth/google`
- `GET /auth/protected`

### Resource APIs (`/api/resources`)

- `POST /api/resources`
- `GET /api/resources`
- `GET /api/resources/{id}`
- `PUT /api/resources/{id}`
- `DELETE /api/resources/{id}`

### Booking APIs (`/api/bookings`)

- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/pending`
- `GET /api/bookings/waitlist`
- `GET /api/bookings/{id}`
- `DELETE /api/bookings/{id}`
- `PUT /api/bookings/{id}/cancel`
- `PUT /api/bookings/{id}/approve`
- `PUT /api/bookings/{id}/reject`
- `GET /api/bookings/user-by-email/{email}`

### Ticket APIs (`/api/tickets` and `/api/v1/tickets`)

- `GET /api/tickets` and `GET /api/v1/tickets`
- `GET /api/tickets/{id}` and `GET /api/v1/tickets/{id}`
- `GET /api/tickets/{id}/comments` and `GET /api/v1/tickets/{id}/comments`
- `POST /api/tickets/{id}/comments` and `POST /api/v1/tickets/{id}/comments`
- `PATCH /api/tickets/{id}/assign` and `PATCH /api/v1/tickets/{id}/assign`
- `PATCH /api/tickets/{id}/status` and `PATCH /api/v1/tickets/{id}/status`
- `POST /api/tickets` and `POST /api/v1/tickets` (multipart ticket + attachments)
- `PUT /api/tickets/{id}` and `PUT /api/v1/tickets/{id}`
- `DELETE /api/tickets/{id}` and `DELETE /api/v1/tickets/{id}`
- `GET /api/tickets/attachments/{attachmentId}/download` and `GET /api/v1/tickets/attachments/{attachmentId}/download`

### User APIs (`/api/v1/users`)

- `GET /api/v1/users`

## Common commands

```bash
# Frontend
cd frontend
npm run dev
npm run build
npm run lint

# Backend
cd backend
./mvnw spring-boot:run
./mvnw test
```

## Notes

- File uploads are stored under `uploads/tickets`.
- `.env` files are ignored by git; keep secrets local.
- The existing `frontend/README.md` is the default Vite template and can be replaced later with frontend-specific docs if needed.
