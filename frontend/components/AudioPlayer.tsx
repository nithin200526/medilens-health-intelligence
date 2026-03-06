"use client";
import { useState, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8001/api";
const LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Spanish"];

export default function AudioPlayer({ explanation, language: defaultLang }: { explanation: string; language: string }) {
    const [lang, setLang] = useState(defaultLang || "English");
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState("");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speak = async () => {
        if (!explanation) return;
        setError(""); setLoading(true);
        try {
            const res = await axios.post(`${API}/tts`, { text: explanation, language: lang });
            const b64 = res.data.audio_base64;
            const url = `data:audio/mp3;base64,${b64}`;
            if (audioRef.current) audioRef.current.pause();
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setPlaying(false);
            audio.play();
            setPlaying(true);
        } catch (e: any) {
            setError("TTS failed. Is the backend running?");
        } finally { setLoading(false); }
    };

    const stop = () => { audioRef.current?.pause(); setPlaying(false); };

    return (
        <div className="card p-5 flex items-center gap-4 flex-wrap">
            <div className="text-2xl">{playing ? "🔊" : "🔈"}</div>
            <div className="flex-1">
                <p className="text-xs font-medium text-[#e8eef7] mb-1">Listen in your language</p>
                <p className="text-xs text-[#7b8ba8]">Audio explanation via gTTS · Free · No API key needed</p>
            </div>
            <select value={lang} onChange={e => setLang(e.target.value)}
                className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8eef7] outline-none">
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            {playing
                ? <button onClick={stop} className="btn-secondary px-4 py-2 text-sm">⏹ Stop</button>
                : <button onClick={speak} disabled={loading} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                    {loading ? <span className="spinner w-4 h-4" /> : "▶"} Listen
                </button>
            }
            {error && <p className="w-full text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
}
