<div align="center">

# 🩺 MediLens: Health Intelligence Platform
### *Turning Clinical Lab Reports into Empathetic, Actionable Insights*

[![MediLens Dashboard](https://img.shields.io/badge/MediLens-Premium_Dashboard-indigo.svg)](https://medilens.ai)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-UI-black.svg)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg)](https://www.postgresql.org)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Integration-25D366.svg)](https://developers.facebook.com/docs/whatsapp/cloud-api)

**MediLens** is an advanced health analysis platform designed to reduce patient anxiety by transforming dense, jargon-filled laboratory diagnostic reports into clear, empathetic, and visually engaging health narratives.

</div>

---

## 🌟 Modern Health Experience

MediLens provides a premium, "Liquid Glass" digital environment for managing your family's health. It bridges the gap between raw medical data and human understanding.

### 🎥 Feature Showcase

*   **Human-First Dashboard**: Animated **Visual Health Orbs** instantly communicate your overall well-being.
*   **Insight Cards**: Biomarker values are translated into "What this means for you" bullet points.
*   **Family Hub**: Securely manage profiles for multiple family members in one place.
*   **WhatsApp Delivery**: Get your analysis results sent directly to your phone as a PDF.
*   **Dual-Mode AI Assistant**: Switch between Contextual Report Chat and General Health Encyclopedia.

---

## 🚀 Core Modules

### 1. 📂 Document Engine (backend_old)
The brain of the operation. It handles high-precision OCR and clinical analysis of lab reports.
- **Biomarker Extraction**: Automatically identifies values, units, and reference ranges.
- **RAG-Powered Insights**: Uses a Retrieval-Augmented Generation engine to explain clinical results.
- **Dynamic PDF Generation**: Creates clean, doctor-ready report summaries.

### 2. 💬 WhatsApp Integration (whatsapp_backend)
A dedicated microservice for seamless mobile health updates via **WhatsApp Cloud API**.
- **Real-time Notifications**: Alerts when a new report is ready.
- **PDF Delivery**: Directly sends the structured health report to your WhatsApp inbox.
- **Best-Effort Greeting**: Auto-welcomes users upon phone registration.

### 3. 🧠 Analysis & Translation (rag_engine)
A shared intelligence library used by the backends to interact with LLMs (Grok/Llama-3).
- **Multi-lingual Support**: Professional medical translation into Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), and Spanish (Español).
- **Explanation Logic**: The core system prompts that ensure the AI remains empathetic yet clinically accurate.

---

## 🏗️ Technical Stack

- **Frontend**: Next.js 14, Tailwind CSS, Lucide React, Framer Motion.
- **Authentication**: NextAuth.js with Google OAuth.
- **Database**: PostgreSQL (hosted on **Neon**) via Prisma ORM.
- **Email**: SMTP integration via Nodemailer for analysis alerts.
- **Backend API**: Dual FastAPI services (Processing & Messaging).
- **AI/LLM**: Groq Llama-3 (70B/8B) and Grok-certified models.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (Neon recommended)
- Meta WhatsApp Cloud API credentials

### 1. Backend Services
You will need to run both the Processing Engine and the WhatsApp Service.

**Processing Engine (backend_old):**
```bash
cd backend_old
pip install -r requirements.txt
python main.py # Runs on port 8001
```

**WhatsApp Service (whatsapp_backend):**
```bash
cd whatsapp_backend
pip install -r requirements.txt
python main.py # Runs on port 8002
```

### 2. Frontend Application
```bash
cd frontend
npm install
npx prisma generate
npm run dev # Runs on port 3000
```

### 3. Environment Config
Ensure you have `.env` files in `frontend/`, `backend_old/`, and `whatsapp_backend/` with the appropriate API keys for Google, Meta, and Groq.

---

## 🛡️ Privacy & Security
MediLens is built with privacy-first principles. Reports are processed securely, data is stored in enterprise-grade PostgreSQL, and AI interactions are strictly gated to provide medical information without diagnostic prescriptions.

---
<div align="center">
*Built with ❤️ to empower patients with knowledge and peace of mind.*
</div>
