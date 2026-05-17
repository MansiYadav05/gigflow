# GigFlow - Smart Leads Dashboard

A high-performance full-stack MERN dashboard for managing sales pipelines.

## Features
- **Auth:** JWT-based authentication with bcrypt password hashing.
- **Leads CRUD:** Full management for sales and administrators.
- **RBAC:** Admins have full access; Sales representatives cannot delete records.
- **Smart Filtering:** Server-side filtering by status, source, and regex search.
- **CSV Export:** Pure JS implementation for downloading lead data.
- **Responsive Design:** Optimized for mission-control style desktop views and mobile access.
- **Dark Mode:** System-persistent dark theme support.

## Project Structure
- `/server.ts`: Combined Express server and Vite middleware.
- `/src/pages`: Dashboard, Login, Register, and Lead Details.
- `/src/context`: Auth state management.
- `/src/lib/api.ts`: Axios client with interceptors.

## API Documentation

### Auth
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Authenticate and receive a JWT.

### Leads
- `GET /api/leads`: Paginated list with filters (`status`, `source`, `search`, `sort`, `page`).
- `GET /api/leads/export`: Full list for CSV export.
- `GET /api/leads/:id`: View a single lead.
- `POST /api/leads`: Create a lead.
- `PUT /api/leads/:id`: Update a lead.
- `DELETE /api/leads/:id`: Remove a lead (Admin only).

## Environment Variables
- `MONGO_URI`: MongoDB connection string (falls back to In-Memory for preview).
- `JWT_SECRET`: Secret key for token signing.
- `VITE_API_BASE_URL`: Base path for frontend API calls.
