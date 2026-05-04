# SportaDesk 🏆

**Host. Score. Dominate.**

SportaDesk is a full-stack web application designed for sports enthusiasts to seamlessly host, manage, and track tournaments across various sports (like Cricket, Football, Kabaddi, and more). With a sleek, modern UI and a robust backend, SportaDesk provides an all-in-one dashboard for tournament administration and live match tracking.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Animations & 3D:** Framer Motion, React Three Fiber / Drei
- **Routing:** React Router DOM

### Backend
- **Environment:** Node.js + Express
- **Database:** MySQL
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs for password hashing

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) running locally

### 1. Database Setup
1. Open your MySQL client or terminal.
2. Create a new database for the project:
   ```sql
   CREATE DATABASE sportadesk;
   ```
*(Note: Tables are managed via your backend models or SQL setup scripts. Ensure your MySQL server is running before starting the backend).*

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   - Copy the `.env.example` file and rename it to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and update your MySQL database credentials (`DB_USER`, `DB_PASSWORD`), and set a secure `JWT_SECRET`.
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   - Create a `.env` file in the frontend directory.
   - Add the following line to point to your local backend API:
     ```env
     VITE_API_BASE_URL=http://localhost:5000
     ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The app will be accessible at `http://localhost:5173`.*

---

## 📂 Project Structure

```text
SportaDesk/
├── backend/                  # Node.js + Express API
│   ├── config/               # Database configurations
│   ├── controllers/          # Route handlers & logic
│   ├── middleware/           # JWT & Auth middlewares
│   ├── models/               # MySQL Data models
│   ├── routes/               # API endpoint definitions
│   └── index.js              # Entry point
│
└── frontend/                 # React + Vite application
    ├── public/               # Static assets
    └── src/
        ├── components/       # Reusable UI components
        ├── lib/              # API utilities (axios instances)
        ├── pages/            # Full page components
        └── store/            # Zustand state stores
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
