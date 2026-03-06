<div align="center">

# 🩺 MediLens
### Grounded Medical Report Intelligence

An advanced, human-first health tracking platform that transforms dense, clinical lab reports into clear, empathetic, and actionable insights for patients and their families.

</div>

---

## 🌟 Overview

MediLens is a full-stack health application designed to reduce patient anxiety and make medical data truly readable. Users can upload their raw laboratory diagnostic reports (PDFs) and have them instantly processed via OCR and analyzed by an advanced Retrieval-Augmented Generation (RAG) AI engine. 

Instead of presenting users with a confusing spreadsheet of medical jargon, MediLens provides a gorgeous **"Liquid Glass" dashboard**, complete with color-coded alerts, plain English translations of what biomarkers mean, and a fully interactive AI Health Assistant.

## 🚀 Core Features

### 1. Human-First Dashboard
- **Visual Health Orb**: Animated, dynamic centerpieces instantly communicate the urgency of the patient's results (e.g., Stable, Watch, Critical).
- **Insight Cards**: Technical laboratory values are translated into simple "What this means for you" bullet points, ensuring high comprehensibility.
- **Liquid Glass Aesthetic**: A premium UI utilizing deep mesh gradients and high-end blur effects to create a calm, reassuring digital environment.

### 2. Multi-Patient Family Hub
- **Unified Management**: Caregivers can manage reports for multiple family members under a single account.
- **Profile Segregation**: Each family member (e.g., parent, child) gets their own secure historical timeline and AI analysis context, ensuring data is never mixed up.

### 3. Dual-Mode AI Assistant
- **Contextual Report Mode**: Chat directly with a specific lab report. The AI understands the exact abnormal markers in the selected document and suggests relevant questions to ask.
- **General Medical Mode**: A strictly-guarded medical encyclopedia. The AI is securely prompted to answer general health, biology, and nutrition queries while explicitly refusing to offer rogue diagnoses or prescriptions.

### 4. Empathetic Multi-Language PDF Export
- **Reassuring Printouts**: Patients can export simple, large-font PDFs designed perfectly for taking to the doctor—stripping away anxiety-inducing AI jargon.
- **Dynamic AI Translation**: With the click of a button, the entire PDF (including UI labels and medical explanations) is dynamically sent through the LLM engine to be perfectly translated.
- **Supported Languages**: English, Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), and Spanish (Español).

---

## 🏗️ Architecture Stack

**Frontend (Client Portal)**
- Next.js 14 (App Router)
- React & Tailwind CSS
- Prisma ORM (SQLite Database)
- Lucide React Icons

**Backend (AI Engine & Processing)**
- Python FastAPI
- LangChain & Groq LLMs (Llama-3 models)
- pdfplumber (Document parsing)
- ReportLab (Dynamic PDF generation)

---

## 🛠️ Local Setup & Installation

Follow these steps to run MediLens locally. You will need two terminal windows open: one for the Python backend and one for the Next.js frontend.

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your Environment Variables:
   Create a `.env` file in the `backend/` folder and add your free Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROK_MODEL=llama-3.3-70b-versatile
   GROK_TEMPERATURE=0.2
   GROK_MAX_TOKENS=8000
   ```
5. Start the FastAPI server:
   ```bash
   python main.py
   # The server will start on http://127.0.0.1:8001
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Initialize the Prisma Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   # The application will be available at http://localhost:3000
   ```

---

## ⚠️ Important Deployment Notes

### Indic Language PDF Exports (Hindi, Tamil, Telugu)
To export PDFs in complex Unicode scripts, the `ReportLab` engine requires a TrueType Font (TTF) that contains those specific glyphs.
- **On Windows**: The backend automatically hooks into the standard `Nirmala.ttf` font provided by Microsoft. Multi-language exports will work out-of-the-box.
- **On Linux/Cloud**: You must ensure a Unicode TTF font is accessible to the backend Python server. You can specify this explicitly in your backend `.env` file:
  ```env
  NIRMALA_FONT_PATH=/path/to/your/custom/unicode_font.ttf
  ```

---
*Built to empower patients with knowledge, clarity, and peace of mind.*
