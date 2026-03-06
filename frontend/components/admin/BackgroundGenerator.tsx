"use client";

import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackgroundGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const generateBackground = async () => {
    setIsGenerating(true);
    try {
      // Initialize GenAI client
      // Try to use the environment key first
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found");
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A minimal, aesthetic, abstract medical background. Soft blue and cyan gradients, subtle DNA helix or molecular structures in the background, clean, high-tech, white and light blue color palette, 4k resolution, high quality, no people, no doctors, smooth flowing lines, glassmorphism feel.',
            },
          ],
        },
      });

      let base64Image = null;
      
      // Extract image from response
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (!base64Image) {
        throw new Error("No image generated");
      }

      // Save the image
      const saveResponse = await fetch('/api/save-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          filename: 'ai-medical-bg.png',
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save image");
      }

      // Refresh the page to show the new background
      window.location.reload();

    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate background. See console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={generateBackground} 
        disabled={isGenerating}
        className="bg-slate-900/80 backdrop-blur-md text-white border border-slate-700 shadow-2xl hover:bg-slate-800"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate New BG
          </>
        )}
      </Button>
    </div>
  );
}
