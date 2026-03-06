import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { image, filename } = await req.json();

    if (!image || !filename) {
      return NextResponse.json({ error: "Image data and filename are required" }, { status: 400 });
    }

    // Remove header if present (e.g., "data:image/png;base64,")
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const publicDir = path.join(process.cwd(), 'public', 'backgrounds');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, path: `/backgrounds/${filename}` });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}
