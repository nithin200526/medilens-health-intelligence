import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    let apiKey = process.env.API_KEY;
    let source = "API_KEY";
    
    if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      source = "NEXT_PUBLIC_GEMINI_API_KEY";
    }
    
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY;
      source = "GEMINI_API_KEY";
    }

    if (!apiKey) {
      return NextResponse.json({ 
        error: "API key not found",
        env: {
          API_KEY: !!process.env.API_KEY,
          NEXT_PUBLIC_GEMINI_API_KEY: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
        }
      }, { status: 500 });
    }
    
    console.log(`Using API Key from: ${source}`);
    console.log(`API Key prefix: ${apiKey.substring(0, 5)}...`);

    const ai = new GoogleGenAI({ apiKey });
    
    console.log("Testing API key with text generation...");
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: {
        parts: [{ text: 'Hello' }]
      }
    });
    console.log("Text generation successful:", textResponse.text);

    console.log("Generating background image...");
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: 'A minimal, aesthetic, abstract medical background. Soft blue and cyan gradients, subtle DNA helix or molecular structures in the background, clean, high-tech, white and light blue color palette, 4k resolution, high quality, no people, no doctors, smooth flowing lines, glassmorphism feel.',
          },
        ],
      },
      config: {
        // imageConfig is not supported for gemini-2.5-flash-image
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
      const base64Data = part.inlineData.data;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const publicDir = path.join(process.cwd(), 'public', 'backgrounds');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      const filePath = path.join(publicDir, 'medical-bg.png');
      fs.writeFileSync(filePath, buffer);
      console.log(`Image saved to ${filePath}`);
      
      return NextResponse.json({ success: true, path: '/backgrounds/medical-bg.png' });
    }
    
    return NextResponse.json({ error: "No image data found" }, { status: 500 });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json({ error: "Failed to generate image", details: error.message }, { status: 500 });
  }
}
