import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// GET — load profile + preferences for the logged-in user
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const [profile, prefs] = await Promise.all([
        prisma.userProfile.findUnique({ where: { userId } }),
        prisma.userPreferences.findUnique({ where: { userId } }),
    ]);

    return NextResponse.json({ profile, prefs });
}

// PUT — upsert profile + preferences
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;
    const body = await req.json();

    const {
        // profile fields
        displayName, phone, dateOfBirth, gender, bloodType,
        heightValue, heightUnit, weightValue, weightUnit,
        allergies, emergencyContact,
        // preferences fields
        language, reportDetail, colorTheme, autoSave, showTrends,
        notifAnalysis, notifAbnormal, notifWeekly, notifFamily,
    } = body;

    const [profile, prefs] = await Promise.all([
        prisma.userProfile.upsert({
            where: { userId },
            create: {
                userId,
                displayName, phone, dateOfBirth, gender, bloodType,
                heightValue, heightUnit: heightUnit || "cm",
                weightValue, weightUnit: weightUnit || "kg",
                allergies, emergencyContact,
            },
            update: {
                displayName, phone, dateOfBirth, gender, bloodType,
                heightValue, heightUnit,
                weightValue, weightUnit,
                allergies, emergencyContact,
            },
        }),
        prisma.userPreferences.upsert({
            where: { userId },
            create: {
                userId,
                language: language || "English",
                reportDetail: reportDetail || "standard",
                colorTheme: colorTheme || "system",
                autoSave: autoSave ?? true,
                showTrends: showTrends ?? true,
                notifAnalysis: notifAnalysis ?? true,
                notifAbnormal: notifAbnormal ?? true,
                notifWeekly: notifWeekly ?? false,
                notifFamily: notifFamily ?? false,
            },
            update: {
                language, reportDetail, colorTheme,
                autoSave, showTrends,
                notifAnalysis, notifAbnormal, notifWeekly, notifFamily,
            },
        }),
    ]);

    return NextResponse.json({ profile, prefs });
}
