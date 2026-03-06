# MediLens WhatsApp Integration Service

FastAPI microservice that sends WhatsApp messages via the **Meta WhatsApp Cloud API**.

## Project Structure

```
whatsapp_backend/
├── main.py                          ← FastAPI app (port 8002)
├── config.py                        ← Env var loading + validation
├── database.py                      ← PostgreSQL layer (whatsapp_users table)
├── requirements.txt
├── .env                             ← Fill your credentials here
│
├── routes/
│   ├── profile_routes.py            ← POST /api/profile/update-phone
│   └── report_routes.py             ← POST /api/report/analysis-complete
│
├── services/
│   └── whatsapp_service.py          ← All WhatsApp Cloud API calls
│
├── models/
│   └── user_model.py                ← Pydantic request/response schemas
│
└── utils/
    └── phone_validator.py           ← E.164 phone validation
```

---

## ⚡ Quick Start

### 1 — Get WhatsApp Cloud API credentials

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a **Meta App → WhatsApp → API Setup**
3. Copy:
   - `WHATSAPP_ACCESS_TOKEN` (Permanent token from System User)
   - `WHATSAPP_PHONE_NUMBER_ID` (from the API Setup page)

### 2 — Fill in `.env`

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
DATABASE_URL=postgresql://...  # Same Neon DB as frontend
MEDILENS_APP_URL=https://medilens.ai
```

### 3 — Install & Run

```bash
cd whatsapp_backend
pip install -r requirements.txt
python main.py
# → Running on http://localhost:8002
# → Swagger docs at http://localhost:8002/docs
```

---

## API Reference

### `POST /api/profile/update-phone`

Save user phone number and send a WhatsApp greeting.

**Request:**
```json
{
  "user_id": "user_abc123",
  "phone_number": "+919876543210"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Phone number saved and greeting sent.",
  "phone_number": "+919876543210"
}
```

---

### `POST /api/report/analysis-complete`

Send the completed analysis PDF to the user's WhatsApp.

**Request:**
```json
{
  "user_id": "user_abc123",
  "report_pdf_url": "https://example.com/reports/abc.pdf"
}
```

**Response:**
```json
{
  "status": "sent",
  "message": "Report sent to WhatsApp."
}
```

---

## Connecting to the MediLens Frontend

Call this service from the Next.js `/api/reports` route after saving a report to DB:

```typescript
// In frontend/app/api/reports/route.ts — add after report.create()
await fetch("http://localhost:8002/api/report/analysis-complete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId,
    report_pdf_url: pdfDownloadUrl,
  }),
}).catch(console.error); // fire-and-forget
```

And from the Profile page phone save:

```typescript
// After PUT /api/user/profile
await fetch("http://localhost:8002/api/profile/update-phone", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId,
    phone_number: profile.phone,
  }),
}).catch(console.error);
```

---

## WhatsApp Business Requirements

> ⚠️ To send messages **outside** the 24-hour window (e.g. report delivery to someone who hasn't messaged you), your Meta App must be in **Live** mode and you must use an approved **Message Template**.
>
> For the greeting + document flow described here, the user must have **opted in** (i.e., sent your business number a message first) OR you use **template messages**.
>
> During development, you can add up to 5 test numbers from the Meta Dashboard.
