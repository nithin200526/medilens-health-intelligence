"use client";

import { useState } from "react";
import { Play, Pause, Volume2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30); // Mock progress

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg flex items-center gap-4">
      <Button 
        size="icon" 
        className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white border-none"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>
      
      <div className="flex-1 space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Health Summary (Hindi)</span>
          <span>01:12 / 03:45</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden cursor-pointer">
          <div 
            className="h-full bg-blue-500 rounded-full relative" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8">
          <Volume2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8">
          <Globe className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
