"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type UserPrefs = {
    language: string;
    reportDetail: "simple" | "standard" | "detailed";
    colorTheme: "light" | "dark" | "system";
    autoSave: boolean;
    showTrends: boolean;
    notifAnalysis: boolean;
    notifAbnormal: boolean;
    notifWeekly: boolean;
    notifFamily: boolean;
};

const DEFAULTS: UserPrefs = {
    language: "English",
    reportDetail: "standard",
    colorTheme: "system",
    autoSave: true,
    showTrends: true,
    notifAnalysis: true,
    notifAbnormal: true,
    notifWeekly: false,
    notifFamily: false,
};

/** Hook: loads user preferences from DB (once per mount). Cached in module scope per session. */
let cachedPrefs: UserPrefs | null = null;
let cacheUserId: string | null = null;

export function usePreferences() {
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;
    const [prefs, setPrefs] = useState<UserPrefs>(cachedPrefs || DEFAULTS);
    const [loading, setLoading] = useState(!cachedPrefs);

    useEffect(() => {
        if (!userId) return;
        if (cachedPrefs && cacheUserId === userId) {
            setPrefs(cachedPrefs);
            setLoading(false);
            return;
        }
        fetch("/api/user/profile")
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.prefs) {
                    const p: UserPrefs = {
                        language: data.prefs.language || DEFAULTS.language,
                        reportDetail: (data.prefs.reportDetail as any) || DEFAULTS.reportDetail,
                        colorTheme: (data.prefs.colorTheme as any) || DEFAULTS.colorTheme,
                        autoSave: data.prefs.autoSave ?? DEFAULTS.autoSave,
                        showTrends: data.prefs.showTrends ?? DEFAULTS.showTrends,
                        notifAnalysis: data.prefs.notifAnalysis ?? DEFAULTS.notifAnalysis,
                        notifAbnormal: data.prefs.notifAbnormal ?? DEFAULTS.notifAbnormal,
                        notifWeekly: data.prefs.notifWeekly ?? DEFAULTS.notifWeekly,
                        notifFamily: data.prefs.notifFamily ?? DEFAULTS.notifFamily,
                    };
                    cachedPrefs = p;
                    cacheUserId = userId;
                    setPrefs(p);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [userId]);

    // Apply color theme to <html> element
    useEffect(() => {
        const root = document.documentElement;
        if (prefs.colorTheme === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else if (prefs.colorTheme === "light") {
            root.classList.remove("dark");
            root.classList.add("light");
        } else {
            // system
            root.classList.remove("dark", "light");
        }
    }, [prefs.colorTheme]);

    return { prefs, loading };
}

/** Invalidate cache (call after saving preferences) */
export function invalidatePrefsCache() {
    cachedPrefs = null;
    cacheUserId = null;
}
