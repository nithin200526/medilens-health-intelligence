"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
    User, Settings, Bell, Shield, Save,
    Mail, Phone, Calendar, Ruler, Weight,
    Heart, AlertCircle, CheckCircle2, Loader2, Activity, Globe, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { invalidatePrefsCache } from "@/lib/usePreferences";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Spanish", "French"];
const NOTIFICATION_OPTIONS = [
    { id: "notifAnalysis", label: "Analysis complete", desc: "When a report is fully processed" },
    { id: "notifAbnormal", label: "Abnormal markers", desc: "Critical or high-priority findings" },
    { id: "notifWeekly", label: "Weekly summary", desc: "Your health overview each Sunday" },
    { id: "notifFamily", label: "Family activity", desc: "When a profile is updated" },
];

type Tab = "profile" | "preferences" | "notifications" | "security";

export default function ProfilePage() {
    const { data: session } = useSession();
    const user = session?.user as { name?: string | null; email?: string | null; image?: string | null } | undefined;

    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<"" | "success" | "error">("");
    const [isLoading, setIsLoading] = useState(true);

    // ── Profile fields ─────────────────────────────────────────────────────
    const [profile, setProfile] = useState({
        displayName: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        bloodType: "",
        heightValue: "",
        heightUnit: "cm",
        weightValue: "",
        weightUnit: "kg",
        allergies: "",
        emergencyContact: "",
    });

    // ── Preferences ────────────────────────────────────────────────────────
    const [prefs, setPrefs] = useState({
        language: "English",
        reportDetail: "standard",
        colorTheme: "system",
        autoSave: true,
        showTrends: true,
        notifAnalysis: true,
        notifAbnormal: true,
        notifWeekly: false,
        notifFamily: false,
    });

    // ── Load from DB on mount ──────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const { profile: p, prefs: q } = await res.json();
                    if (p) {
                        setProfile({
                            displayName: p.displayName || user?.name || "",
                            phone: p.phone || "",
                            dateOfBirth: p.dateOfBirth || "",
                            gender: p.gender || "",
                            bloodType: p.bloodType || "",
                            heightValue: p.heightValue || "",
                            heightUnit: p.heightUnit || "cm",
                            weightValue: p.weightValue || "",
                            weightUnit: p.weightUnit || "kg",
                            allergies: p.allergies || "",
                            emergencyContact: p.emergencyContact || "",
                        });
                    } else {
                        // Pre-fill name from Google session if no saved profile
                        setProfile(prev => ({ ...prev, displayName: user?.name || "" }));
                    }
                    if (q) {
                        setPrefs({
                            language: q.language || "English",
                            reportDetail: q.reportDetail || "standard",
                            colorTheme: q.colorTheme || "system",
                            autoSave: q.autoSave ?? true,
                            showTrends: q.showTrends ?? true,
                            notifAnalysis: q.notifAnalysis ?? true,
                            notifAbnormal: q.notifAbnormal ?? true,
                            notifWeekly: q.notifWeekly ?? false,
                            notifFamily: q.notifFamily ?? false,
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to load profile", e);
            } finally {
                setIsLoading(false);
            }
        };
        if (session?.user) load();
    }, [session?.user, user?.name]);

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        setSaveMsg("");
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...profile, ...prefs }),
            });
            if (res.ok) {
                setSaveMsg("success");
                invalidatePrefsCache(); // force other pages to reload prefs fresh
                // Apply theme immediately for instant visual feedback
                const root = document.documentElement;
                if (prefs.colorTheme === "dark") { root.classList.add("dark"); root.classList.remove("light"); }
                else if (prefs.colorTheme === "light") { root.classList.remove("dark"); root.classList.add("light"); }
                else { root.classList.remove("dark", "light"); }
            } else {
                setSaveMsg("error");
            }
        } catch {
            setSaveMsg("error");
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMsg(""), 3000);
        }
    };


    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "profile", label: "Profile", icon: User },
        { id: "preferences", label: "Preferences", icon: Settings },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
    ];

    const avatarText = user?.name?.substring(0, 2).toUpperCase() || "US";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 fade-up">

            {/* ── Account Header ─────────────────────────────────────────────── */}
            <div className="liquid-glass rounded-[2rem] p-6 border-white/60 shadow-xl flex items-center gap-5">
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden">
                        {user?.image
                            ? <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                            : avatarText}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900 truncate">{user?.name || "Your Account"}</h2>
                    <p className="text-slate-400 text-sm truncate">{user?.email}</p>
                    <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Activity className="w-3 h-3" /> Active Account
                    </span>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────────── */}
            <div className="flex gap-1 p-1 liquid-glass rounded-xl border-white/60 shadow-sm">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === id
                            ? "bg-white text-slate-900 shadow-md"
                            : "text-slate-400 hover:text-slate-700"
                            }`}
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                >

                    {/* ── PROFILE ─────────────────────────────────────────────── */}
                    {activeTab === "profile" && (
                        <div className="liquid-glass rounded-[2rem] p-6 border-white/60 shadow-xl space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                                <p className="text-slate-400 text-sm mt-0.5">Your medical profile helps us personalise analysis insights.</p>
                            </div>

                            {/* Name + Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Display Name" icon={<User className="w-3.5 h-3.5" />}>
                                    <input
                                        type="text"
                                        value={profile.displayName}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        className="input-field"
                                        placeholder="Your full name"
                                    />
                                </Field>
                                <Field label="Email (read-only)" icon={<Mail className="w-3.5 h-3.5" />}>
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        readOnly
                                        className="input-field bg-slate-50/80 text-slate-400 cursor-not-allowed"
                                    />
                                </Field>
                                <Field label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="+91 98765 43210"
                                    />
                                </Field>
                                <Field label="Date of Birth" icon={<Calendar className="w-3.5 h-3.5" />}>
                                    <input
                                        type="date"
                                        value={profile.dateOfBirth}
                                        onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                                        className="input-field"
                                    />
                                </Field>
                            </div>

                            {/* Medical section */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                                    <Heart className="w-4 h-4 text-rose-500" /> Medical Details
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Gender">
                                        <select
                                            value={profile.gender}
                                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                            className="input-field cursor-pointer"
                                        >
                                            <option value="">Select gender</option>
                                            {GENDERS.map(g => <option key={g}>{g}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Blood Type">
                                        <select
                                            value={profile.bloodType}
                                            onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                                            className="input-field cursor-pointer"
                                        >
                                            <option value="">Select blood type</option>
                                            {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Height" icon={<Ruler className="w-3.5 h-3.5" />}>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={profile.heightValue}
                                                onChange={(e) => setProfile({ ...profile, heightValue: e.target.value })}
                                                className="input-field flex-1"
                                                placeholder={profile.heightUnit === "cm" ? "170" : "5.7"}
                                            />
                                            <select
                                                value={profile.heightUnit}
                                                onChange={(e) => setProfile({ ...profile, heightUnit: e.target.value })}
                                                className="h-12 w-20 px-2 rounded-2xl bg-white/60 border border-slate-200/60 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
                                            >
                                                <option value="cm">cm</option>
                                                <option value="ft/in">ft/in</option>
                                            </select>
                                        </div>
                                    </Field>
                                    <Field label="Weight" icon={<Weight className="w-3.5 h-3.5" />}>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={profile.weightValue}
                                                onChange={(e) => setProfile({ ...profile, weightValue: e.target.value })}
                                                className="input-field flex-1"
                                                placeholder={profile.weightUnit === "kg" ? "70" : "154"}
                                            />
                                            <select
                                                value={profile.weightUnit}
                                                onChange={(e) => setProfile({ ...profile, weightUnit: e.target.value })}
                                                className="h-12 w-20 px-2 rounded-2xl bg-white/60 border border-slate-200/60 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
                                            >
                                                <option value="kg">kg</option>
                                                <option value="lbs">lbs</option>
                                            </select>
                                        </div>
                                    </Field>
                                    <Field label="Known Allergies" icon={<AlertCircle className="w-3.5 h-3.5 text-amber-500" />} className="sm:col-span-2">
                                        <input
                                            type="text"
                                            value={profile.allergies}
                                            onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                                            className="input-field"
                                            placeholder="e.g. Penicillin, Peanuts (comma separated)"
                                        />
                                    </Field>
                                    <Field label="Emergency Contact" icon={<Phone className="w-3.5 h-3.5 text-red-500" />} className="sm:col-span-2">
                                        <input
                                            type="text"
                                            value={profile.emergencyContact}
                                            onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                                            className="input-field"
                                            placeholder="Name — +91 98765 43210"
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PREFERENCES ─────────────────────────────────────────── */}
                    {activeTab === "preferences" && (
                        <div className="liquid-glass rounded-[2rem] p-6 border-white/60 shadow-xl space-y-7">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">App Preferences</h3>
                                <p className="text-slate-400 text-sm mt-0.5">Customise how MediLens presents your health data.</p>
                            </div>

                            {/* Language */}
                            <div className="space-y-3">
                                <SectionLabel icon={<Globe className="w-4 h-4" />}>Preferred Language</SectionLabel>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => setPrefs({ ...prefs, language: lang })}
                                            className={`h-11 rounded-xl text-sm font-semibold transition-all border ${prefs.language === lang
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30"
                                                : "bg-white/60 text-slate-600 border-slate-200/60 hover:border-indigo-300 hover:text-indigo-600"
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Report Detail Level */}
                            <div className="space-y-3">
                                <SectionLabel>Report Detail Level</SectionLabel>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: "simple", label: "Simple", desc: "Plain English, no medical jargon" },
                                        { id: "standard", label: "Standard", desc: "Balanced overview with key metrics" },
                                        { id: "detailed", label: "Clinical", desc: "Full technical data + reference ranges" },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setPrefs({ ...prefs, reportDetail: opt.id })}
                                            className={`p-4 rounded-2xl text-left transition-all border ${prefs.reportDetail === opt.id
                                                ? "bg-indigo-50 border-indigo-400 shadow-md"
                                                : "bg-white/60 border-slate-200/60 hover:border-indigo-200"
                                                }`}
                                        >
                                            <div className={`text-sm font-bold mb-0.5 ${prefs.reportDetail === opt.id ? "text-indigo-700" : "text-slate-900"}`}>
                                                {opt.label}
                                            </div>
                                            <div className="text-xs text-slate-400 leading-snug">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Theme */}
                            <div className="space-y-3">
                                <SectionLabel icon={<Palette className="w-4 h-4" />}>Color Theme</SectionLabel>
                                <div className="flex gap-2">
                                    {[{ id: "light", label: "☀️ Light" }, { id: "dark", label: "🌙 Dark" }, { id: "system", label: "💻 System" }].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setPrefs({ ...prefs, colorTheme: t.id })}
                                            className={`h-11 px-5 rounded-xl text-sm font-semibold transition-all border ${prefs.colorTheme === t.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-white/60 text-slate-600 border-slate-200/60 hover:border-indigo-300"
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-2">
                                <SectionLabel>Display Options</SectionLabel>
                                {[
                                    { key: "autoSave", label: "Auto-save analysis to history", desc: "Automatically store every report" },
                                    { key: "showTrends", label: "Show health trends", desc: "Compare current vs. previous reports" },
                                ].map(({ key, label, desc }) => (
                                    <ToggleRow
                                        key={key}
                                        label={label}
                                        desc={desc}
                                        checked={prefs[key as keyof typeof prefs] as boolean}
                                        onChange={(v) => setPrefs({ ...prefs, [key]: v })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── NOTIFICATIONS ────────────────────────────────────────── */}
                    {activeTab === "notifications" && (
                        <div className="liquid-glass rounded-[2rem] p-6 border-white/60 shadow-xl space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Notification Preferences</h3>
                                <p className="text-slate-400 text-sm mt-0.5">Choose which events should trigger email alerts.</p>
                            </div>
                            {NOTIFICATION_OPTIONS.map(({ id, label, desc }) => (
                                <ToggleRow
                                    key={id}
                                    label={label}
                                    desc={desc}
                                    checked={prefs[id as keyof typeof prefs] as boolean}
                                    onChange={(v) => setPrefs({ ...prefs, [id]: v })}
                                    icon={<Bell className={`w-4 h-4 ${prefs[id as keyof typeof prefs] ? "text-indigo-600" : "text-slate-400"}`} />}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── SECURITY ─────────────────────────────────────────────── */}
                    {activeTab === "security" && (
                        <div className="liquid-glass rounded-[2rem] p-6 border-white/60 shadow-xl space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Account Security</h3>
                                <p className="text-slate-400 text-sm mt-0.5">Manage your login methods and account safety.</p>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Google Sign-In</p>
                                        <p className="text-xs text-slate-400">{user?.email}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    Connected
                                </span>
                            </div>
                            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-rose-900">Delete Account Data</p>
                                        <p className="text-xs text-rose-500 mt-1 leading-relaxed">This will permanently delete all your reports, profiles, and analysis history. This action cannot be undone.</p>
                                        <button className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 underline underline-offset-2 transition-colors">
                                            Request data deletion →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Save Button (hidden on Security) ───────────────────────────── */}
            {activeTab !== "security" && (
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-2xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100"
                    >
                        {isSaving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2" />Save Changes</>
                        )}
                    </Button>
                    <AnimatePresence>
                        {saveMsg === "success" && (
                            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                                <CheckCircle2 className="w-4 h-4" /> Saved!
                            </motion.span>
                        )}
                        {saveMsg === "error" && (
                            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-red-500 text-sm font-bold">
                                <AlertCircle className="w-4 h-4" /> Failed to save
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

// ── Reusable sub-components ──────────────────────────────────────────────────
function Field({ label, icon, children, className = "" }: {
    label: string; icon?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                {icon}{label}
            </label>
            {children}
        </div>
    );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            {icon}{children}
        </div>
    );
}

function ToggleRow({ label, desc, checked, onChange, icon }: {
    label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-slate-100 hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${checked ? "bg-indigo-50" : "bg-slate-100"}`}>
                        {icon}
                    </div>
                )}
                <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-indigo-600" : "bg-slate-200"}`}
                aria-label={`Toggle ${label}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
            </button>
        </div>
    );
}
