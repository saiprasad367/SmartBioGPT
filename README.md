# Smart Bio GPT

A full-stack web application for exploring gene and protein data using a conversational, ChatGPT-style interface. Smart Bio GPT provides secure user authentication, AI-powered chat for biological queries, real-time biomedical data retrieval, and interactive 3D protein visualization.

**Live Demo:** [https://smart-bio-gpt-tau.vercel.app](https://smart-bio-gpt-tau.vercel.app)

## Architecture

```
Frontend (React + TypeScript + Tailwind CSS)
    ↓ HTTPS
Backend (Node.js + Express + JWT Authentication + Zod Validation)
    ↓
MongoDB Atlas
    ↓
External Biomedical APIs (UniProt, RCSB PDB, STRING DB, DrugBank, ESMFold)
```

## Key Features

- **Secure Authentication** - User registration and login using JWT-based authentication
- **AI-Powered Chat Interface** - Conversational interface for biological queries
- **Gene and Protein Search** - Multi-source biomedical data aggregation
- **3D Protein Visualization** - Interactive protein structure visualization using Three.js and Mol*
- **Favorites and History** - Save and track research queries
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Cloud Deployment** - Frontend on Vercel, backend on Render

## Tech Stack

### Frontend (TypeScript 85%, JavaScript 11.3%, CSS 2.1%, HTML 1.6%)
- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router
- Framer Motion
- Axios
- Three.js / Mol* (3D visualization)
- Zustand / React Query (state and data management)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Zod (request validation)
- Axios (external API calls)
- bcryptjs (password hashing)
- dotenv, cors, morgan

## Repository Structure

```
SmartBioGPT/
├── bio-insight-ai-main/   # React + TypeScript frontend application
├── backend/               # Node.js + Express backend API
├── .gitignore
└── README.md
```

## Local Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/saiprasad367/SmartBioGPT.git
cd SmartBioGPT
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd bio-insight-ai-main
npm install
```

Create a `.env` file in the `bio-insight-ai-main/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Production Deployment

### Backend (Render)
1. Connect your repository to Render
2. Set the root directory to `backend/`
3. Set environment variables in the Render dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `PORT`
   - `NODE_ENV=production`
4. Deploy

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set the root directory to `bio-insight-ai-main/`
3. Set environment variable:
   - `VITE_API_BASE_URL=<your-render-backend-url>`
4. Deploy

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login user and receive JWT token |
| POST | `/bio/search` | Search for gene and protein data |
| POST | `/chat/message` | Send a message to the AI chat interface |
| GET | `/favorites` | Retrieve user's saved favorites |
| GET | `/history` | Retrieve user's search history |

## Screenshots

_Screenshots will be added here_

## License

MIT License

---

**Developed by Sai Prasad**
