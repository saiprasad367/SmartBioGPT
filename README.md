<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Smart%20Bio%20GPT&fontSize=80&fontColor=fff&animation=twinkling&fontAlignY=35&desc=AI-Powered%20Biomedical%20Research%20Assistant&descAlignY=55&descAlign=50" width="100%"/>

<div align="center">

# 🧬 Smart Bio GPT

### *AI-Powered Biomedical Research Assistant*

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=00D9FF&center=true&vCenter=true&width=600&lines=Explore+Gene+%26+Protein+Data;AI-Powered+Chat+Interface;3D+Protein+Visualization;Real-time+Biomedical+Insights" alt="Typing SVG" />
</p>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-00D9FF?style=for-the-badge&logo=vercel&logoColor=white)](https://smart-bio-gpt-tau.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/saiprasad367/SmartBioGPT)
[![TypeScript](https://img.shields.io/badge/TypeScript-85%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://github.com/saiprasad367/SmartBioGPT)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">

</div>

---

## 🎯 Overview

**Smart Bio GPT** is a cutting-edge full-stack web application that revolutionizes the way researchers interact with gene and protein data. Using a conversational ChatGPT-style interface, it combines secure authentication, AI-powered insights, real-time biomedical data retrieval, and stunning 3D protein visualization.

<div align="center">

### 🚀 **[Launch App →](https://smart-bio-gpt-tau.vercel.app)**

</div>

### 📊 Project Stats

<div align="center">

<table>
<tr>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/000000/code.png" width="48"/>
<br><strong>10,000+</strong>
<br>Lines of Code
</td>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/000000/api.png" width="48"/>
<br><strong>5+</strong>
<br>External APIs
</td>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/000000/source-code.png" width="48"/>
<br><strong>TypeScript</strong>
<br>Primary Language
</td>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/000000/launch-rocket.png" width="48"/>
<br><strong>Live</strong>
<br>Production Ready
</td>
</tr>
</table>

</div>

---

## 🏗️ System Architecture

A self-hosted **distributed system** — every part runs in Docker and comes up
with a single `docker compose up`.

```mermaid
graph TD
    U[User Browser] -->|HTTP :8080| GW[NGINX API Gateway]
    GW -->|/| FE[React + Vite SPA]
    GW -->|/api/auth| AUTH[auth-service<br/>JWT + Google OAuth]
    GW -->|/api/bio, /api/structure| BIO[bio-service<br/>protein aggregation]
    GW -->|/api/chat, /api/user| CHAT[chat-service<br/>chat + AI + workspace]
    AUTH --> PG[(PostgreSQL)]
    CHAT --> PG
    AUTH -.-> RS[(Redis)]
    BIO -.-> RS
    CHAT -.-> RS
    BIO -->|internal| CHAT
    CHAT -->|internal| BIO
    BIO --> EXT[UniProt · RCSB PDB · AlphaFold · ChEMBL · STRING]
    CHAT --> AI[OpenRouter AI]

    style GW fill:#111,stroke:#000,color:#fff
    style FE fill:#61DAFB,stroke:#21A1F1,color:#000
    style AUTH fill:#68A063,stroke:#4F7942,color:#fff
    style BIO fill:#68A063,stroke:#4F7942,color:#fff
    style CHAT fill:#68A063,stroke:#4F7942,color:#fff
    style PG fill:#316192,stroke:#1F3F5F,color:#fff
    style RS fill:#D82C20,stroke:#A81E15,color:#fff
    style EXT fill:#FFB84D,stroke:#E69A2E,color:#000
    style AI fill:#FF6B9D,stroke:#E05580,color:#000
```

### Quick start

```bash
cp .env.example .env       # set POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET,
                           # INTERNAL_API_KEY, GOOGLE_CLIENT_ID
docker compose up --build  # → http://localhost:8080
```

Full instructions: **[`SETUP.md`](SETUP.md)**.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔐 **Secure Authentication**
JWT-based user registration and login system with encrypted password storage

</td>
<td width="50%">

### 💬 **AI-Powered Chat**
Natural language interface for biological queries with intelligent responses

</td>
</tr>
<tr>
<td width="50%">

### 🔬 **Gene & Protein Search**
Multi-source biomedical data aggregation from leading databases

</td>
<td width="50%">

### 🧪 **3D Protein Visualization**
Interactive molecular structure rendering with Three.js and Mol*

</td>
</tr>
<tr>
<td width="50%">

### ⭐ **Favorites & History**
Save and track your research queries for easy reference

</td>
<td width="50%">

### 📱 **Responsive Design**
Seamless experience across mobile, tablet, and desktop devices

</td>
</tr>
</table>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

---

## 🛠️ Tech Stack

<div align="center">

### Frontend Technologies

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Backend Technologies

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-D82C20?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

### Deployment & Tools

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)

</div>

### 📊 Language Distribution

```mermaid
pie title Codebase Composition
    "TypeScript" : 85.0
    "JavaScript" : 11.3
    "CSS" : 2.1
    "HTML" : 1.6
```

---

## 📁 Repository Structure

```
📦 SmartBioGPT
┣ 📜 docker-compose.yml           # 🐳 one command brings up the whole system
┣ 📜 .env.example                 # single env file for every service
┃
┣ 📂 infra/gateway                # 🌐 NGINX API gateway (only exposed port)
┣ 📂 db                           # 🗄️ schema.sql (applied by the migrator)
┃
┣ 📂 packages/shared              # 📚 @sbg/shared — infra + web + domain library
┃ ┗ 📂 src
┃   ┣ 📂 bio                      #    UniProt/PDB/AlphaFold/ChEMBL/STRING + aggregation
┃   ┣ 📂 ai                       #    OpenRouter chat
┃   ┣ 📂 data                     #    pg repositories (users, tokens, workspace)
┃   ┗ 📂 auth                     #    Google verify, welcome email
┃
┣ 📂 services
┃ ┣ 📂 auth-service               # ⚙️ email/password + Google OAuth, JWT
┃ ┣ 📂 bio-service                # ⚙️ protein dossier aggregation (stateless)
┃ ┗ 📂 chat-service               # ⚙️ chat + AI + user workspace
┃
┗ 📂 bio-insight-ai-main          # 🎨 React + Vite SPA (built, served by NGINX)
```

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="400">
</div>

---

## 🚀 Setup

> **Full instructions: [`SETUP.md`](SETUP.md).** The whole system — 3 microservices,
> NGINX gateway, PostgreSQL, Redis, the migrator and the SPA — runs from one file.

### 1️⃣ Clone

```bash
git clone https://github.com/saiprasad367/SmartBioGPT.git
cd SmartBioGPT
```

### 2️⃣ Configure

```bash
cp .env.example .env
```

Set in `.env`:

| Variable | Required | Notes |
|---|---|---|
| `POSTGRES_PASSWORD`, `REDIS_PASSWORD` | ✅ | any strong values |
| `JWT_SECRET` | ✅ | `openssl rand -base64 48` |
| `INTERNAL_API_KEY` | ✅ | `openssl rand -hex 24` — shared secret for service-to-service calls |
| `GOOGLE_CLIENT_ID` | for Google login | OAuth **Web** client id from Google Cloud Console; add `http://localhost:8080` as an authorized JavaScript origin |
| `OPENROUTER_API_KEY` | optional | enables real AI answers (falls back to DB summaries otherwise) |
| `SMTP_*` | optional | welcome email |

### 3️⃣ Run

```bash
docker compose up --build
```

✅ Everything on **http://localhost:8080** — SPA, API, auth, database, cache.
The database persists in the `pgdata` volume between restarts.

```bash
docker compose down            # stop
docker compose down -v         # stop + reset the database
docker compose up --scale bio-service=3   # scale a stateless service
```

### 🎉 You're All Set!

Open your browser and navigate to `http://localhost:5173`

---

## 🌐 Production Deployment

<table>
<tr>
<td width="50%">

### <img src="https://img.icons8.com/color/48/000000/cloud.png" width="30"/> Backend on Render

1. **Connect Repository**
   - Link your GitHub repository to Render

2. **Configure Settings**
   - Set root directory: `backend/`
   - Build command: `npm install`
   - Start command: `npm start`

3. **Environment Variables**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   PORT=5000
   NODE_ENV=production
   ```

4. **Deploy** 🚀

</td>
<td width="50%">

### <img src="https://img.icons8.com/color/48/000000/vercel.png" width="30"/> Frontend on Vercel

1. **Connect Repository**
   - Link your GitHub repository to Vercel

2. **Configure Settings**
   - Root directory: `bio-insight-ai-main/`
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Environment Variables**
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Deploy** 🚀

</td>
</tr>
</table>

<div align="center">

### 🔄 Deployment Workflow

```mermaid
graph LR
    A[💻 Local Development] -->|git push| B[📦 GitHub Repository]
    B -->|Auto Deploy| C[🌐 Vercel Frontend]
    B -->|Auto Deploy| D[⚙️ Render Backend]
    D -->|Connect| E[🗄️ Supabase DB]
    
    style A fill:#FFE66D,stroke:#FFD700,stroke-width:2px,color:#000
    style B fill:#6E5494,stroke:#5C4379,stroke-width:2px,color:#fff
    style C fill:#000000,stroke:#333333,stroke-width:2px,color:#fff
    style D fill:#46E3B7,stroke:#2DA771,stroke-width:2px,color:#000
    style E fill:#3ECF8E,stroke:#2DA771,stroke-width:2px,color:#000
```

</div>

---

## 🔌 API Endpoints

<div align="center">

### Base URL: `https://your-backend.onrender.com/api`

</div>

<table>
<tr>
<th width="15%">Method</th>
<th width="30%">Endpoint</th>
<th width="40%">Description</th>
<th width="15%">Auth Required</th>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" />
</td>
<td><code>/auth/register</code></td>
<td>Register a new user account</td>
<td align="center">❌</td>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" />
</td>
<td><code>/auth/login</code></td>
<td>Login user and receive JWT token</td>
<td align="center">❌</td>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" />
</td>
<td><code>/bio/search</code></td>
<td>Search for gene and protein data</td>
<td align="center">✅</td>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/POST-49CC90?style=flat-square" />
</td>
<td><code>/chat/message</code></td>
<td>Send a message to AI chat interface</td>
<td align="center">✅</td>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/GET-61AFFE?style=flat-square" />
</td>
<td><code>/favorites</code></td>
<td>Retrieve user's saved favorites</td>
<td align="center">✅</td>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/GET-61AFFE?style=flat-square" />
</td>
<td><code>/history</code></td>
<td>Retrieve user's search history</td>
<td align="center">✅</td>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/GET-61AFFE?style=flat-square" />
</td>
<td><code>/protein/:id</code></td>
<td>Get detailed protein structure data</td>
<td align="center">✅</td>
</tr>

<tr>
<td align="center">
<img src="https://img.shields.io/badge/DELETE-F93E3E?style=flat-square" />
</td>
<td><code>/favorites/:id</code></td>
<td>Remove item from favorites</td>
<td align="center">✅</td>
</tr>

</table>

### 📝 Example Request

```bash
curl -X POST https://your-backend.onrender.com/api/bio/search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "BRCA1",
    "type": "gene"
  }'
```

### 📤 Example Response

```json
{
  "success": true,
  "data": {
    "gene": "BRCA1",
    "fullName": "Breast Cancer Type 1 Susceptibility Protein",
    "organism": "Homo sapiens",
    "sequence": "MDLSALRVEEVQNVINAMQKIL...",
    "structure": {...},
    "interactions": [...]
  }
}
```

---

## 📸 Screenshots

<div align="center">

### 🏠 Home Page
<img width="1900" height="907" alt="w1" src="https://github.com/user-attachments/assets/24490d60-8e46-4a9c-85dc-079ebb427e64" />


### 💬 AI Chat Interface
<img width="1917" height="905" alt="w5" src="https://github.com/user-attachments/assets/3844f670-4aad-4311-91c1-05594d295ccd" />

### 🔬 Gene Search Results
![Uploading w5.png…]()

### 🧬 3D Protein Visualization
<img width="1918" height="905" alt="W3" src="https://github.com/user-attachments/assets/9f7d4438-6c25-4c1d-aafc-9456c8df4d13" />

</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284136-03988914-d899-44b4-b1d9-4eeccf656e44.gif" width="1000">
</div>

---

## 🗺️ Roadmap

<div align="center">

```mermaid
gantt
    title Smart Bio GPT Development Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1
    Core Features           :done, 2024-01-01, 90d
    User Authentication     :done, 2024-01-15, 30d
    Basic Search           :done, 2024-02-01, 45d
    section Phase 2
    AI Chat Integration    :done, 2024-03-15, 60d
    3D Visualization       :done, 2024-04-01, 45d
    Multi-source Data      :done, 2024-05-01, 30d
    section Phase 3
    Advanced Analytics     :active, 2024-06-01, 60d
    Mobile App            :2024-07-01, 90d
    API Marketplace       :2024-08-01, 90d
```

</div>

### 🔮 Upcoming Features

- [ ] **Advanced Analytics Dashboard** - Comprehensive data visualization and insights
- [ ] **Collaborative Research** - Share and collaborate on research projects
- [ ] **Mobile Applications** - Native iOS and Android apps
- [ ] **Offline Mode** - Work without internet connectivity
- [ ] **Export Functionality** - Export data in multiple formats (PDF, CSV, JSON)
- [ ] **Machine Learning Models** - Custom ML models for protein prediction
- [ ] **Integration Hub** - Connect with popular research tools and platforms

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. **Fork the Repository**
   ```bash
   gh repo fork saiprasad367/SmartBioGPT
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit Your Changes**
   ```bash
   git commit -m "Add some AmazingFeature"
   ```

4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**

### Code Style Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add unit tests for new features
- Update documentation as needed

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="100">
</div>

---

## 📄 License

MIT License

Copyright (c) 2025 Sai Prasad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<div align="center">

## 💝 Support This Project

If you found this project helpful, please consider giving it a ⭐!

[![Star this repo](https://img.shields.io/github/stars/saiprasad367/SmartBioGPT?style=social)](https://github.com/saiprasad367/SmartBioGPT)

---

### 📞 Connect With Me

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/saiprasad2523)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/saiprasad367)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:saiprasad2523@gmail.com)

---

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="1000">

### ⚡ Fun Facts About This Project

```javascript
const smartBioGPT = {
  linesOfCode: "10,000+",
  coffeeConsumed: "∞ cups ☕",
  sleepLost: "Too many nights 😴",
  bugsSquashed: "999+ 🐛",
  featuresBuilt: "Awesome ones ✨"
};
```

---

<div align="center">
  <h3>Made with 💙 and lots of ☕ by</h3>
  <img src="https://readme-typing-svg.demolab.com?font=Brush+Script+MT&size=40&pause=1000&color=00D9FF&center=true&vCenter=true&width=435&lines=Sai+Prasad" alt="Sai Prasad" />
</div>

<br>

<div align="center">
  <sub>Built with passion for advancing biomedical research 🧬</sub>
</div>

<br>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=150&section=footer&text=Thank%20You!&fontSize=42&fontColor=fff&animation=twinkling&fontAlignY=72" width="100%"/>

</div>
