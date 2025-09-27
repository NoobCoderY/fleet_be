# Fleet Glide Link

## Project Structure

- `backend/` — Node.js/Express server (TypeScript)
- `frontend/` — React app (Vite + Tailwind CSS)

## Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js)
- Docker (optional, for containerized backend)

---

## 1. Backend Setup

```bash
cd backend
npm install
```

### Run Backend (Development)

```bash
npm run dev
```

### Run Backend (Production)

---

## Docker Setup (Backend & MongoDB)

This project supports running both the backend and MongoDB using Docker.

### 1. Build and Start Containers

From the `backend` directory, run:

```powershell
docker-compose up --build
```

This will:

- Build the backend Docker image
- Start the backend and MongoDB containers

### 2. Stopping Containers

```powershell
docker-compose down
```

### 3. Backend MongoDB Connection

The backend connects to MongoDB using the following URI (set in `.env` or via docker-compose):

```
MONGODB_URI=mongodb://mongo:27017/fleetlink
```

### 4. Accessing Services

- Backend API: http://localhost:3000
- MongoDB: localhost:27017

---

```bash
npm run build
npm start
```

### Run Backend with Docker

```bash
docker-compose up
```

---

## 2. Frontend Setup

```bash
cd frontend
npm install
```

### Run Frontend (Development)

```bash
npm run dev
```

---

## 3. Access the App

- Frontend: http://localhost:8080/
- Backend API: http://localhost:3000

---

## 4. Running Tests

### Backend

```bash
cd backend
npm test
```

---

## 5. Environment Variables

- See `.env` files in both `backend/` and `frontend/` for configuration.

---
