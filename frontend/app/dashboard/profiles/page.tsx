"use client";
import { useEffect, useState } from "react";
import { User, Users, Plus, FileText, ArrowRight, Activity, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type Profile = {
    id: string;
    name: string;
    age: number | null;
    gender: string | null;
    _count: { reports: number };
    createdAt: string;
};

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProfile, setNewProfile] = useState({ name: '', age: '', gender: '' });

    const fetchProfiles = async () => {
        try {
            const res = await fetch("/api/profiles");
            if (res.ok) {
                const data = await res.json();
                setProfiles(data);
            }
        } catch (e) {
            console.error("Fetch profiles failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProfile),
            });
            if (res.ok) {
                setNewProfile({ name: '', age: '', gender: '' });
                setIsCreating(false);
                fetchProfiles();
            }
        } catch (e) {
            console.error("Create profile failed", e);
        }
    };

    const handleDeleteProfile = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the profile for ${name}? This will not delete their reports, but they will no longer be grouped under this profile.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/profiles?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchProfiles();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete profile");
            }
        } catch (e) {
            console.error("Delete profile failed", e);
            alert("An error occurred while deleting the profile.");
        }
    };

    return (
        <div className="min-h-screen pb-20 fade-up">
            <div className="max-w-7xl mx-auto px-6 pt-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">Family Hub</h1>
                        </div>
                        <p className="text-slate-500 max-w-md">
                            Manage health profiles for your family. Reports are automatically grouped by patient name.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="rounded-full h-12 px-8 shadow-lg shadow-primary/20 gap-2 hover:scale-105 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Member</span>
                    </Button>
                </div>

                {/* Profiles Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 rounded-[2.5rem] bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : profiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 rounded-[3rem] border border-slate-100 border-dashed">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mb-6">
                            <User className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No profiles yet</h3>
                        <p className="text-slate-500 max-w-xs mb-8">
                            Create your first profile or upload a report to automatically detect patients.
                        </p>
                        <Button variant="outline" onClick={() => setIsCreating(true)} className="rounded-full px-8">
                            Create Manually
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map((profile) => (
                            <motion.div
                                key={profile.id}
                                layout
                                className="liquid-glass p-8 rounded-[2.5rem] border-white/60 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Activity className="w-24 h-24" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-50 overflow-hidden">
                                            <span className="text-2xl font-black text-primary">
                                                {profile.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                                {profile._count.reports} {profile._count.reports === 1 ? 'Report' : 'Reports'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                                        {profile.name}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm font-medium text-slate-400 mb-8">
                                        {profile.age && <span>{profile.age} Years</span>}
                                        {profile.gender && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="capitalize">{profile.gender}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/40">
                                        <Link
                                            href={`/dashboard/history?profileId=${profile.id}`}
                                            className="flex items-center gap-2 text-primary font-bold text-sm tracking-tight group-hover:gap-3 transition-all"
                                        >
                                            <span>View History</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteProfile(profile.id, profile.name)}
                                            className="p-2 rounded-lg text-slate-300 hover:text-danger hover:bg-danger/5 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Profile Modal overlay */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreating(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md liquid-glass bg-white p-10 rounded-[3rem] shadow-2xl border-white/80"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">New Member</h2>
                            <p className="text-slate-500 mb-8">Add a family member to start tracking their health reports.</p>

                            <form onSubmit={handleCreateProfile} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        value={newProfile.name}
                                        onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                                        className="w-full h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all px-5 font-medium"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Age</label>
                                        <input
                                            type="number"
                                            value={newProfile.age}
                                            onChange={e => setNewProfile({ ...newProfile, age: e.target.value })}
                                            className="w-full h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all px-5 font-medium"
                                            placeholder="25"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                        <select
                                            value={newProfile.gender}
                                            onChange={e => setNewProfile({ ...newProfile, gender: e.target.value })}
                                            className="w-full h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all px-5 font-medium appearance-none"
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="flex-1 h-14 rounded-2xl">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 h-14 rounded-2xl shadow-lg shadow-primary/20">
                                        Save Profile
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
