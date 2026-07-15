# Anwar TV - Bengali News Portal & Admin Newsroom System

Anwar TV is a modern, high-performance Bengali news portal built using Next.js, React, Tailwind CSS, and MongoDB. It features a fully dynamic public news website and a secure, role-based admin newsroom dashboard for managing articles, curating homepage layouts, and controlling user permissions.

## 🚀 Live Site
- **Production URL:** [https://anwartv-news.vercel.app](https://anwartv-news.vercel.app)

---

## ✨ Features

### 📰 Public News Site
- **Dynamic Homepage:** Custom layout slots for hero news, sidebar features, and category-focused grids curated in real-time from the admin panel.
- **Dynamic Breaking News:** An animated header ticker that automatically pulls and scrolls the latest breaking news.
- **Article Details:** Premium article layouts displaying populated categories, author name/profile, publication date, inline HTML content, and a custom grid of related articles from the same category.
- **Social Sharing Widget:** Easy one-click sharing to Facebook, Twitter/X, and clipboard link copying.
- **Category Filter Pages:** Custom multi-level category routes for structured news aggregation.
- **Search System:** Dedicated search results page with keywords search directly from the header toggle bar.
- **Custom 404 Page:** A branded, helpful error page to guide lost visitors back to the home page.

### 🛡️ Admin & Editorial Dashboard
- **Role-Based Access Control:** Strict authorization layers for `admin`, `editor`, `writer`, and `reader` roles secured via NextAuth v5.
- **Interactive Rich-Text Editor:** Premium Tiptap editor integration supporting rich formatting, link inserts, and direct image uploads to ImgBB.
- **Homepage Curator:** Drag-and-drop/interactive slot selector interface allowing administrators to change home page news placements on-demand.
- **User Management Control:** Dashboard interface for admins to create, manage, and suspend editor or writer accounts.
- **SEO Optimization Fields:** Advanced fields for meta titles, descriptions, open graph images, and keyword tags for each news piece.

---

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router, Turbopack, SSR, ISR)
- **Frontend library:** React, Framer Motion, Lucide Icons, Tailwind CSS
- **Database ORM:** Mongoose (MongoDB)
- **Cache layer:** Upstash Redis (with mock fallback for local development)
- **Auth Provider:** NextAuth v5 (Beta)
- **Rich Text Editor:** Tiptap Editor
- **Styling Config:** PostCSS & Tailwind CSS

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the root of the project and add the following variables:

```env
# MongoDB Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/anwartv?retryWrites=true&w=majority

# NextAuth Secret (generate one using: openssl rand -base64 33)
AUTH_SECRET=your_auth_secret_here

# Upstash Redis Credentials (optional for local, defaults to mock cache)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

---

## 🏁 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rashedulraha/anwartv.git
cd anwartv
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to view the local instance.

### 3. Build for Production
```bash
npm run build
```

---

## 📦 Deployment on Vercel

To deploy on Vercel:
1. Link the project using the Vercel CLI (`vercel`).
2. Add your environment variables (`MONGODB_URI`, `AUTH_SECRET`) via the Vercel Project Dashboard or CLI:
   ```bash
   vercel env add MONGODB_URI production
   vercel env add AUTH_SECRET production
   ```
3. Deploy to production:
   ```bash
   vercel --prod
   ```
