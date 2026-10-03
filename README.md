# CareerMatch AI

AI-powered Resume Analysis, Job Matching & Skill Gap Platform.

## MVP features
- Upload a PDF resume
- Extract resume text
- Analyze skills using a built-in skill dictionary
- Paste a job description
- Calculate transparent match score
- Show matched and missing skills
- Generate a simple skill-gap roadmap
- React dashboard + FastAPI backend
- No API key required for the starter version

## Project structure

```text
careermatch-by-pk/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── analyzer.py
│   │   └── __init__.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

## Run backend

```powershell
cd backend
py -3.12 -m venv venv
.env\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: http://127.0.0.1:8000

## Run frontend

Open another terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend: http://localhost:5173

## GitHub

Create an empty GitHub repository, then:

```powershell
git init
git add .
git commit -m "Initial CareerMatch By PK"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Important

This is a production-oriented starter/MVP, not a claim of perfect ATS or hiring accuracy. Matching is deliberately transparent so it can later be upgraded with embeddings/LLMs and real job data.
