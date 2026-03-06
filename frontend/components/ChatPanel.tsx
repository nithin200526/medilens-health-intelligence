"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API = "http://127.0.0.1:8001/api";

type Message = { role: "user" | "assistant"; content: string };
type Props = {
    tests: Record<string, any>;
    analytics: Record<string, any>;
    alert: Record<string, any>;
    explanation: string;
    language: string;
    patient_info?: Record<string, any>;
    panels?: any[];
    dynamic_analysis?: Record<string, any>;
    isGeneralMode?: boolean;
};

export default function ChatPanel({ tests, analytics, alert, explanation, language, patient_info, panels, dynamic_analysis, isGeneralMode }: Props) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: isGeneralMode
                ? "Hi! I'm your Medical AI Assistant. Ask me any general medical question. Please note that I cannot diagnose conditions or prescribe medication."
                : "Hi! I'm your Report Assistant. Ask me anything about your uploaded report — I'll answer based only on your results. I cannot diagnose conditions or prescribe medication.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Generate dynamic suggested questions based on report data
    const dynamicQuestions = useMemo(() => {
        if (isGeneralMode) {
            return [
                "What are the symptoms of the flu?",
                "How much sleep do I need?",
                "What is a healthy blood pressure?",
                "How to lower cholesterol naturally?",
                "What causes migraines?"
            ];
        }

        const questions = ["What does my overall result mean?"];

        // Add critical markers if any
        const critical = alert?.critical_tests || [];
        if (critical.length > 0) {
            questions.push(`How urgent is my ${critical[0]} level?`);
        }

        // Add high/low markers from analytics
        const high = analytics?.high_tests || [];
        const low = analytics?.low_tests || [];

        if (high.length > 0) questions.push(`Why is my ${high[0]} level high?`);
        if (low.length > 0) questions.push(`What does low ${low[0]} indicate?`);

        // Add generic health paths
        questions.push("What lifestyle changes can help?");
        questions.push("Should I see a doctor soon?");

        // Ensure uniqueness and limit to 5
        return Array.from(new Set(questions)).slice(0, 5);
    }, [analytics, alert, isGeneralMode]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async (question?: string) => {
        const q = (question || input).trim();
        if (!q) return;
        setInput("");
        const userMsg: Message = { role: "user", content: q };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
            const res = await axios.post(`${API}/chat`, {
                question: q, tests, analytics, alert, explanation, language, history,
                patient_info: patient_info || {},
                panels: panels || [],
                dynamic_analysis: dynamic_analysis || {},
                is_general_mode: isGeneralMode || false
            });
            setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }]);
        } catch {
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "⚠️ Chat unavailable. Please ensure the backend is running on port 8001." },
            ]);
        } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col h-full bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="relative z-10 flex items-center gap-4 p-6 border-b border-white/10 glass-dark">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white tracking-tight leading-none">
                            {isGeneralMode ? "General Medical Assistant" : "Report Assistant"}
                        </h4>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/20 text-[9px] font-black uppercase tracking-widest text-accent border border-accent/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Live
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium italic opacity-70">
                        {isGeneralMode ? "General Medical Knowledge · No diagnosis" : "Grounded in your clinical data · No diagnosis"}
                    </p>
                </div>
            </div>

            {/* ── Messages Area ───────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative z-10">
                <AnimatePresence mode="popLayout">
                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`flex items-end gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md ${m.role === "user" ? "bg-slate-700 text-slate-300" : "bg-blue-600 text-white"}`}>
                                    {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`px-5 py-3.5 rounded-[1.75rem] text-sm leading-relaxed shadow-sm font-medium ${m.role === "user"
                                    ? "bg-primary text-white rounded-br-none whitespace-pre-wrap"
                                    : "bg-white/5 border border-white/10 text-slate-300 rounded-bl-none"
                                    }`}>
                                    {m.role === "user" ? (
                                        m.content
                                    ) : (
                                        <ReactMarkdown
                                            components={{
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1.5 my-3" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1.5 my-3" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-1 marker:text-primary/70" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-white tracking-wide" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mt-4 mb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mt-3 mb-1.5" {...props} />,
                                                br: () => <br className="my-2" />,
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start pl-11"
                    >
                        <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-[1.75rem] rounded-bl-none flex gap-2 items-center">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Synthesizing...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Prompt Engineering / Suggested Questions ─────────────────────────── */}
            <div className="relative z-20 pb-2 px-6">
                <div
                    className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2"
                    style={{
                        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                    }}
                >
                    {dynamicQuestions.map(q => (
                        <button
                            key={q}
                            onClick={() => send(q)}
                            disabled={loading}
                            className="shrink-0 text-[11px] font-bold px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-primary/40 hover:text-primary transition-all whitespace-nowrap backdrop-blur-md"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Input ─────────────────────────────────────────────────────────── */}
            <div className="p-6 pt-2 border-t border-white/10 relative z-20 bg-[#0f172a]/40">
                <div className="relative flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                            placeholder="Deep dive into your report…"
                            disabled={loading}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-sm text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-500 font-medium"
                        />
                        <button
                            onClick={() => send()}
                            disabled={loading || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-[0.2em] mt-4 opacity-50">
                    MediLens Neural Engine · Encrypted & Grounded
                </p>
            </div>
        </div>
    );
}
