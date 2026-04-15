# AI_DEV

An AI-assisted MERN workspace with real-time project collaboration, Gemini-powered code generation, and a split deployment setup that fits free hosting comfortably.

## Why This Project Feels Useful
- Real-time collaboration with Socket.IO
- Authentication with JWT + cookies
- AI prompt-to-file-tree generation using Gemini
- React + Vite frontend that can live on Vercel
- Express backend that can live on Render

## Architecture
```text
frontend (Vite + React)
  -> calls REST API on backend
  -> opens Socket.IO connection for project rooms

backend (Express + Socket.IO)
  -> MongoDB for users/projects
  -> Redis for token blacklist
  -> Gemini API for AI-generated project scaffolds
```

## Project Structure
```text
AI_DEV/
|- frontend/
|  |- src/
|  |- .env.example
|- backend/
|  |- controllers/
|  |- routes/
|  |- services/
|  |- tests/
|  |- .env.example
|- README.md
```

## Local Setup
### 1. Install dependencies
```bash
cd frontend
npm install

cd ../backend
npm install
```

### 2. Create environment files
Copy the example env files and fill in your real values.

Frontend `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:5000
```

Backend `backend/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/AI_DEV
JWT_SECRET=replace-with-a-long-random-secret
REDIS_URL=redis://username:password@host:port
GEMINI_API_KEY=replace-with-your-gemini-api-key
CLIENT_URL=http://localhost:5173
```

### 3. Run the apps
```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

## Test And Build Commands
Backend tests:
```bash
cd backend
npm test
```

Frontend production build:
```bash
cd frontend
npm run build
```

## Free Deployment Guide
### Frontend on Vercel
1. Import the `frontend` folder as a Vercel project.
2. Set `VITE_API_BASE_URL` to your deployed Render backend URL.
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend on Render
1. Create a new Web Service from the `backend` folder.
2. Start command: `npm start`
3. Add environment variables:
   `PORT`, `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`, `GEMINI_API_KEY`, `CLIENT_URL`
4. Set `CLIENT_URL` to your Vercel frontend domain.

### Recommended Free Supporting Services
- MongoDB Atlas free tier for `MONGODB_URI`
- Redis Cloud free tier for `REDIS_URL`

## Production Notes
- Cookies are now configured for cross-origin production usage.
- CORS is environment-driven through `CLIENT_URL`.
- The backend exposes `/health` for uptime checks and quick deploy verification.
- Redis missing in production should be treated as a misconfiguration, not ignored.

## Before You Deploy
- Rotate any previously exposed API keys, Redis URLs, or JWT secrets.
- Make sure `.env` files are not committed with real credentials.
- Confirm Vercel frontend URL is added to backend `CLIENT_URL`.
- Verify MongoDB and Redis allow connections from your deployment provider.
- Run backend tests and frontend build one last time.

## Common Issues
- `CORS origin not allowed`: check `CLIENT_URL` on the backend.
- Cookies not sticking in production: confirm HTTPS is enabled and `NODE_ENV=production`.
- Socket connection failing: verify frontend API URL and backend CORS origin list.
- Gemini route failing: confirm `GEMINI_API_KEY` is set correctly.

## Quick Verification After Deploy
- Open `https://your-render-service/health`
- Open the frontend and test register/login
- Create a project
- Open a project room and confirm socket-based updates work

## Security Reminder
If this repository ever contained real secrets, treat them as compromised and rotate them before going live.
