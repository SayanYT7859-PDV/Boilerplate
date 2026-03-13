# ⚡ God-Tier Hackathon Boilerplate

An ultra-lightweight, full-stack web application template designed to go from zero to MVP in under 15 minutes. Engineered with a decoupled architecture to ensure lightning-fast compilation and smooth performance even on constrained hardware, this boilerplate comes pre-configured with enterprise authentication, a database, AI vision capabilities, and geospatial mapping.

## 🛠 Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, shadcn/ui
* **Backend:** Node.js, Express
* **Database & Auth:** Supabase (PostgreSQL)
* **AI Engine:** Google Gemini (2.5 Flash)
* **Mapping:** React-Leaflet (Open-source, no API keys needed)

## ✨ Core Features

* **Enterprise Authentication:** Secure login system supporting both explicit Email/Password and Google OAuth, with protected route management.
* **Real-time CRUD Directory:** A persistent feed to add, read, update, and delete items instantly.
* **AI Vision Scanner:** Integrated Gemini model capable of analyzing user-uploaded images and returning structured JSON data.
* **Gamification Engine:** A built-in points system that rewards users for actions (like using the AI scanner) and displays a global Leaderboard.
* **Geospatial UI:** Offline-capable, interactive mapping to plot database locations.
* **System-Synced UI:** Beautiful, accessible Light/Dark mode toggles powered by `next-themes`.

---

## 🚀 Quick Start Guide

### 1. Clone & Install
Open two separate terminal windows to keep the frontend and backend processes isolated.

**Terminal 1 (Backend):**
```bash
cd backend
npm install

Terminal 2 (Frontend):
cd frontend
npm install

2. Environment Variables
You will need two .env files. Never commit these to version control.
In /backend/.env:
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_public_anon_key
GEMINI_API_KEY=your_google_ai_studio_key
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173

In /frontend/.env:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_key
VITE_API_BASE_URL=http://localhost:5000

3. Database Initialization (Supabase)
Run the following SQL commands in your Supabase SQL Editor to set up the required tables:
CREATE TABLE items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE profiles (
  email text PRIMARY KEY,
  points integer DEFAULT 0
);

4. Ignite the Engines
Start both servers simultaneously in their respective terminals.
Terminal 1 (Backend):
node server.js

Terminal 2 (Frontend):
npm run dev

Your app will be live at http://localhost:5173.
💡 Hackathon Pivot Strategy
To rapidly deploy this for a specific hackathon theme:
 * Click "Use this template" on GitHub to start a fresh repo.
 * Identify your Domain: Rename the items table concept. Is it "Pollution Reports"? "Museum Artifacts"? "Study Notes"?
 * Map it: Use the MapWidget to plot locations instantly.
 * AI-ify it: Use the Gemini scanner to automate data entry from user-uploaded photos.
 * Win: You now have a working, full-stack app while others are still setting up their Vite config.
🛡 Security Note
This boilerplate is configured with strict .gitignore rules to protect sensitive keys. Ensure your frontend and backend folders never upload .env or .env.local files to your public repositories.

