export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  UPLOAD: {
    UPLOAD_REPORT: "/upload",
  },
  ANALYSIS: {
    ANALYZE: "/analyze",
    GET_HISTORY: "/analysis/history",
    GET_REPORT: (id: string) => `/analysis/${id}`,
  },
  GENERATION: {
    GENERATE_PDF: "/generate-pdf",
    TTS: "/tts",
  },
} as const;
