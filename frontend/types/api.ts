export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: "Normal" | "Borderline" | "High" | "Low";
  trend?: "up" | "down" | "stable";
  percentageChange?: number;
}

export interface AnalysisReport {
  id: string;
  date: string;
  overallStatus: "Stable" | "Needs Attention" | "Critical";
  healthScore: number;
  summary: string;
  metrics: Metric[];
  aiInsights: {
    whatThisMeans: string;
    whyItMatters: string;
    trendAnalysis: string;
    lifestyleSuggestions: string[];
  };
}

export interface UploadResponse {
  reportId: string;
  status: "processing" | "completed" | "failed";
}
