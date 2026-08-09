# DineFlow — Frontend (React)

React + Vite frontend for **DineFlow**, a restaurant reservation and review platform. Customers browse restaurants, book tables, and leave reviews. Restaurant owners and admins use dedicated dashboards.

**Related repo:** [Backend API (server)](https://github.com/him912/restaurant_reservation/tree/main/server)

## Live links

| Service | URL |
|---------|-----|
| **API (required)** | `https://restaurant-reservation-g6r0.onrender.com/api` |
| **Frontend** | Deploy on [Netlify](https://www.netlify.com/) or [Vercel](https://vercel.com/) |

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| **Customer** | `dellsaini711@gmail.com` | `123456` |
| **Admin** | `Himanshusaini712@gmail.com` | `secret123` |
| **Restaurant Owner** | `Applelogintest6@gmail.com` | `123456` |
| **Restaurant Owner** | `shivika99@gmail.com` | `123456` |

## Tech stack

- React 19 · Vite 6
- React Router 7
- Tailwind CSS 4
- Axios
- Motion (animations)
- Lucide React (icons)

## Getting started

### Prerequisites

- Node.js 18+
- Running [backend server](https://github.com/him912/restaurant_reservation/tree/main/server) (local or deployed)

### Install & run

```bash
npm install
```

Create `.env` in the `client` folder:

```env
VITE_API_URL=http://localhost:5008/api
```

Use your deployed API URL in production, for example:

```env
VITE_API_URL=https://restaurant-reservation-g6r0.onrender.com/api
```

```bash
npm run dev
```

App runs at **http://localhost:3000**

### Build for production

```bash
npm run build
npm run preview
```

Output is in the `dist/` folder.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Base URL of the backend API (include `/api`) |

## Project structure

```
client/
├── src/
│   ├── pages/           # Home, RestaurantDetails, dashboards, AdminPanel
│   ├── components/      # Navbar, AuthModal, SuccessModal, RestaurantCard, etc.
│   ├── context/         # AppContext — auth & global state
│   ├── hooks/           # usePolling, etc.
│   ├── utils/           # currency, payment flow, restaurant search
│   ├── constants/       # filter options (dietary, ambiance, features)
│   └── api.js           # API client
├── index.html
├── vite.config.ts
└── package.json
```

## Features

### Customer
- Restaurant discovery with **search & advanced filters** (cuisine, city, price, rating, dietary, ambiance, features)
- Restaurant details — menu, gallery, reviews, real-time slot availability
- Table booking with **Razorpay deposit** (INR) and confirmation ticket
- My Reservations — edit, cancel, **retry payment**
- Write/edit/delete own reviews

### Restaurant owner
- Owner dashboard — profile, menu, gallery, reservations
- Accept/reject bookings with **payment status**
- Reply to customer reviews (own restaurant only)

### Admin
- Admin panel — restaurants, reservations, reviews
- Accept/reject reservations, reply to or delete reviews

### UX notes
- Admins and owners **cannot book tables** or **post reviews** (reply only)
- Payment status auto-refreshes on owner/admin reservation lists

## Deploy (Netlify example)

1. Connect this `client` folder (or monorepo with **Base directory** = `client`)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variable: `VITE_API_URL=https://your-api.onrender.com/api`
5. Add a redirect for SPA routing (`/*` → `/index.html`) if using client-side routes

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript check |

## License

Apache-2.0
