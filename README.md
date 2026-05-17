# GigFlow - Smart Leads Dashboard

A high-performance full-stack MERN dashboard for managing sales pipelines.

## 🚀 Product Use
GigFlow allows sales teams to track potential clients through various stages (New, Contacted, Qualified, Lost). 
- **Sales Representative** can create and update leads to maintain a healthy pipeline.
- **Administrators** gain access to high-level statistics and the ability to prune the database by deleting records.
- **Data Portability:** Quickly export filtered lead lists to CSV for external reporting.

## Features
- **Auth:** JWT-based authentication with bcrypt password hashing.
- **Leads CRUD:** Full management for sales and administrators.
- **RBAC:** Admins have full access; Sales representatives cannot delete records.
- **Smart Filtering:** Server-side filtering by status, source, and regex search.
- **CSV Export:** Pure JS implementation for downloading lead data.
- **Responsive Design:** Optimized for mission-control style desktop views and mobile access.
- **Dark Mode:** System-persistent dark theme support.

## 🛠 Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS v4 (using semantic @theme variables), Framer Motion.
- **Backend:** Node.js, Express, TypeScript.
- **Authentication:** JSON Web Tokens (JWT) & BcryptJS.
- **Icons & UI:** Lucide React, Sonner (Toasts).

## 🗄 Database
The project uses **MongoDB** via the Mongoose ODM.
- **Production/Cloud:** Connects to MongoDB Atlas via the `MONGO_URI` environment variable.
- **Development Fallback:** If no URI is provided, the server automatically spins up a `mongodb-memory-server` instance. This allows for immediate testing without external dependencies, though data is volatile in this mode.

## ⚙️ Configuration & Setup
### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/gigflow
JWT_SECRET=your_super_secret_key
NODE_ENV=development

### 3. Installation
```bash
npm install
# Install Vercel CLI globally to run the project locally
npm install -g vercel
```

### 4. Running the Project
```bash
# Runs the Express server and Vite HMR concurrently
npm run dev
```

### 5. Docker Setup (Optional)
GigFlow includes complete Docker containerization for development and production:

```bash
# Start with Docker Compose (includes MongoDB)
docker-compose up --build

# Access the app at http://localhost:3000
# MongoDB runs on localhost:27017
```

**Files Included:**
- `Dockerfile` - Multi-stage production build (optimized ~500MB image)
- `docker-compose.yml` - Local development (app + MongoDB)
- `docker-compose.prod.yml` - Production deployment with environment variables
- `init-mongo.js` - Auto-initializes MongoDB with schema and indexes

**Key Features:**
- ✅ Hot-reload with volume mounts
- ✅ Auto-initialized MongoDB (users & leads collections)
- ✅ Health checks for both services
- ✅ Data persistence with named volumes
- ✅ Non-root user and security best practices

## Project Structure
- `/api`: Serverless functions (backend) for Vercel.
- `/api/lib`: Shared database models and middleware.
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

## ⚠️ Error Handling

### Server-Side
The backend implements a centralized error-handling middleware (`errorHandler` in `server.ts`).
- **Validation Errors:** Uses `express-validator` to return 400 Bad Request with a detailed array of field errors.
- **Authentication Errors:** Returns 401 Unauthorized for missing or invalid tokens.
- **RBAC Errors:** Returns 403 Forbidden when a sales representative attempts admin actions (like deleting a lead).
- **Database Connectivity:** The `dbCheck` middleware ensures the API returns a 503 Service Unavailable if the MongoDB connection is dropped, preventing app crashes.

### Client-Side
The frontend uses **Axios Interceptors** to handle global error states:
- **Token Expiry:** Automatically logs the user out if the JWT expires.
- **Toasts:** Utilizes `sonner` to display user-friendly error messages for failed submissions or network issues.

---
Developed as a high-performance MERN solution.
```
