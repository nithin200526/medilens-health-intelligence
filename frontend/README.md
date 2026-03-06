<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/82315509-c9af-4859-be91-225c1b4a4d8e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Core Modules & Navigation

The application is structured around four primary navigation hubs, accessible via the main sidebar:

### 1. Overview (Dashboard)
The central command center. Provides a high-level summary of the active patient's health status. It displays critical health alerts, recent activities, and quick-access widgets summarizing the most recent lab results, ensuring users get immediate intelligence upon logging in without data overwhelm.

### 2. Medical History
A secure, centralized digital vault for managing medical records. Users can upload new lab reports (PDFs/Images) which are automatically processed via OCR and LLM extraction. It serves as a historical timeline, allowing users to view, analyze, and export beautiful PDF summaries of past diagnostic tests.

### 3. Family Hub
A multi-patient management system designed for caregivers and families. Users can create distinct health profiles for different family members (e.g., parents, children, spouses). This ensures that lab reports, medical history, and AI context remain strictly separated and organized per individual.

### 4. AI Assistant
A sophisticated, dual-mode intelligent medical companion powered by RAG (Retrieval-Augmented Generation):
- **General Mode:** Acts as a strictly-guarded medical encyclopedia capable of answering general health, nutrition, and biological queries with high safety and structured formatting.
- **Contextual Mode:** Grounds itself in a specific patient report selected by the user. It dynamically generates suggested questions based on the patient's critical/abnormal markers and provides personalized, report-specific insights while refusing to replace professional medical diagnosis.

---

### ⚠️ Multi-Language PDF Export Note (Hindi, Tamil, Telugu)
When exporting a patient report to a non-English language that utilizes complex Unicode scripts (e.g. Hindi, Tamil, Telugu), the `ReportLab` backend generator requires a TrueType Font (TTF) that contains those specific glyphs.
- **On Windows:** The backend will automatically attempt to locate and register `Nirmala.ttf` (`C:\Windows\Fonts\nirmala.ttf`), which is standard on modern Windows OS and perfectly supports these languages.
- **On Linux / Cloud Deployments:** You must ensure a compatible Unicode TrueType font is installed or provided in the environment. You can set the explicit file path to your custom font by creating an environment variable `NIRMALA_FONT_PATH=/your/path/font.ttf` in your `backend/.env` file.
