# HireLens - AI-Powered Resume Screening Platform

HireLens is a modern, AI-powered platform for resume screening and improvement, built with Next.js, Firebase, and Tailwind CSS.

## Features

1. **Feedback-Focused Resume Ranking**
   - Upload resumes with detailed feedback
   - AI-powered scoring system
   - Comprehensive skill analysis

2. **Dual-Sided Platform**
   - Jobseeker Mode with resume improvement tools
   - Recruiter Mode for managing applications
   - Score history tracking

3. **AI-Powered Resume Fixer**
   - Smart bullet point improvements
   - Skill gap analysis
   - Keyword optimization suggestions

4. **Niche Targeting**
   - Specialized feedback for different career stages
   - Remote work optimization
   - Industry-specific suggestions

5. **Visual Resume Insights**
   - Skill heatmaps
   - Experience timeline visualization
   - Soft skills word cloud

6. **Employer-Backed Validation**
   - Job description matching
   - Candidate shortlisting
   - Resume ranking system

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hirelens.git
   cd hirelens/resume-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config
   - Create `.env.local` from `.env.local.example` and fill in your Firebase credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI Components**: Custom components with Tailwind
- **File Handling**: react-dropzone
- **State Management**: React hooks

#💼 HireLens – AI-Powered Resume Screening System

🎯 **Hire Smarter. Faster. Better.**  
HireLens automates the resume screening process using cutting-edge AI/ML techniques, ranking candidates based on relevance — saving recruiters hours and improving hiring accuracy.





## Demo
How HireLens Works – AI Resume Screening Flow

This document outlines the flow of an AI-powered resume screening system called "HireLens." The diagram illustrates the key steps involved in processing job descriptions and resumes, utilizing advanced natural language processing (NLP) techniques to score and rank candidates effectively. The goal is to provide a clear and intuitive understanding of how HireLens enhances the recruitment process for HR professionals and recruiters.

![How HireLens Works – AI Resume Screening Flow - visual selection](https://github.com/user-attachments/assets/74401283-ad61-4732-93d0-41c16517ac81)


## Table of Content

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [AI Pipeline](#ai-pipeline)
- [Getting Started](#getting-started)
- [API Docs](#api-docs)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
## Features

- ✅ Upload and parse resumes (PDF/DOCX)
- ✅ Resume ranking using:
  - TF-IDF + Random Forest (Phase 1)
  - BiLSTM/Deep Learning (Phase 2)
  - Custom Transformer Model (Phase 3)
- ✅ Matching score with job descriptions
- ✅ Insights for each candidate
- ✅ Admin panel (manage applicants, job roles, rankings)
- ✅ Role-based authentication (Recruiter / Admin)
- ✅ Supabase DB for structured candidate data

---


## Tech Stack

| Layer        | Tech Used |
|--------------|-----------|
| ⚙️ Backend    | Django, Django REST Framework |
| 🎨 Frontend   | Next.js, TailwindCSS |
| 🧠 AI/NLP     | HuggingFace, Scikit-learn, NLTK |
| 🗃 Database   | Supabase (PostgreSQL) |
| ☁️ Hosting   | Vercel (Frontend), Render/Local Server (Backend) |

---
## Architecture
[Frontend - Next.js] | ↓ [Django REST API] | ↓ [AI/NLP Engine] → [Resume Ranking Logic] | ↓ [Supabase Database]

##  Ai Pipeline
```text
1. Resume Upload
2. Preprocessing: Tokenization, Lemmatization
3. Feature Extraction: TF-IDF Vectorization
4. Ranking: ML Model (Random Forest → LSTM → Custom BERT)
5. Output: Top-k Ranked Resumes with Matching Score[README (2).md](https://github.com/user-attachments/files/19865849/README.2.md)
- **Notifications**: react-hot-toast


## 🚀 Getting Started
cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver

🛣 Future Roadmap

 Add interview scheduler integration

Recruiter dashboard with analytics

GPT-4 powered job description parser

 Real-time email alerts on top matches

 Contributing

Contributions are welcome! Please fork the repo and create a PR. For major changes, open an issue first.

📝 License
This project is licensed under the MIT License.

🙌 Acknowledgments

Built with ❤️ by Arun Kumar

NLP tools from HuggingFace, Scikit-learn, and NLTK

UI inspiration from Tailwind UI + Shadcn



