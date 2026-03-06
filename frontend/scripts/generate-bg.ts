import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY });

async function generateBackgroundImage() {
  try {
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
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K"
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');
        
        const publicDir = path.join(process.cwd(), 'public', 'backgrounds');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        const filePath = path.join(publicDir, 'medical-bg.png');
        fs.writeFileSync(filePath, buffer);
        console.log(`Image saved to ${filePath}`);
        return;
      }
    }
    console.log("No image data found in response.");
  } catch (error) {
    console.error("Error generating image:", error);
  }
}

generateBackgroundImage();
