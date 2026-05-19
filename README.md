# VOLT VYBE — Full-Stack App (Assignment 4)

## Assignment 4 Features
- ✅ Secure register / login with **bcrypt** password hashing
- ✅ **JWT-based** session management (`Authorization: Bearer <token>`)
- ✅ **Inactivity timeout** — auto-logout after 15 minutes of no interaction
- ✅ **HTTPS** — self-signed TLS cert (run `npm run gen-cert` once)
- ✅ **Role-based access** — USER / ADMIN permissions enforced on every route
- ✅ Backend binds to `0.0.0.0` — accessible from any machine on the same LAN

---

## Quick Start (same machine)

### Terminal 1 — Backend
```bash
cd backend
npm install
npm run gen-cert        # generate TLS cert once (creates backend/certs/)
npm run prisma:migrate  # set up the database
npm run prisma:seed     # seed roles & demo data
npm run dev             # starts HTTPS server on port 3000
```

### Terminal 2 — Frontend
```bash
npm install
npm run dev             # starts Vite on http://localhost:5173
```

Open **http://localhost:5173** in your browser. The frontend proxies all `/api` calls to `https://localhost:3000`.

> **First time:** your browser may show a self-signed cert warning for the backend. Accept it by visiting `https://localhost:3000` directly and clicking "proceed anyway". The Vite proxy then handles subsequent calls transparently.

---

## LAN Cross-Machine Setup (required for lab demo)

> The backend runs on **Machine A**, the frontend (client browser) runs on **Machine B** — connected on the same hotspot / LAN.

### Machine A — Backend server

1. Find your LAN IP:
   ```powershell
   # Windows
   ipconfig | findstr "IPv4"
   # Linux / Mac
   ip addr | grep "inet "
   ```
   Example: `192.168.1.42`

2. Edit `backend/.env` and ensure:
   ```env
   HOST=0.0.0.0
   PORT=3000
   HTTPS=true
   ```

3. Start the backend:
   ```bash
   cd backend
   npm run gen-cert   # if not already done
   npm run dev
   ```

4. The server will print its LAN address, e.g.:
   ```
   VOLT VYBE API  →  https://0.0.0.0:3000
   LAN clients: replace 0.0.0.0 with your machine's LAN IP
   ```

### Machine B — Client browser

Open the browser on Machine B and visit:
```
https://192.168.1.42:3000
```
Accept the self-signed cert warning (once). Then navigate to:
```
https://192.168.1.42:5173
```
*(if Vite is running on Machine A, or open the dist build directly)*

Alternatively, build the frontend and serve it from Machine A:
```bash
# On Machine A
npm run build
npx serve dist --listen 5173
```
Then visit `http://192.168.1.42:5173` on Machine B.

---

## Authentication Flow

| Action | Endpoint | Returns |
|--------|----------|---------|
| Register | `POST /api/auth/register` | `{ token, user }` |
| Login | `POST /api/auth/login` | `{ token, user }` |
| Logout | `POST /api/auth/logout` | 204 |
| Verify session | `GET /api/auth/me` | `{ id, email, roleCode, permissions }` |

All protected API calls require:
```
Authorization: Bearer <JWT token>
```

Tokens expire after **30 minutes**. The frontend automatically logs out the user after **15 minutes of inactivity** (no mouse/keyboard/touch events).

---

## Running Tests
```bash
cd backend
npm test
```

All tests pass — the test environment uses a separate `test.db` and injects a JWT secret so bcrypt/JWT work in isolation.