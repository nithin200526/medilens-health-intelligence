import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWeeklySummaryEmail } from "@/lib/email";

const prisma = new PrismaClient();

/**
 * GET /api/user/weekly-summary
 * Called by a cron job (e.g., Vercel Cron) every Sunday at 08:00.
 * Sends weekly summary emails to all users who have notifWeekly enabled.
 *
 * To set up as a Vercel Cron, add to vercel.json:
 * "crons": [{ "path": "/api/user/weekly-summary", "schedule": "0 8 * * 0" }]
 */
export async function GET(req: Request) {
    // Simple security: require a secret header to prevent public abuse
    const cronSecret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Find all users who want weekly summaries
        const subscribers = await prisma.userPreferences.findMany({
            where: { notifWeekly: true },
            include: { user: { select: { email: true, name: true, id: true } } },
        });

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let sent = 0;
        for (const sub of subscribers) {
            if (!sub.user?.email) continue;

            const weeklyReports = await prisma.report.findMany({
                where: { userId: sub.userId, createdAt: { gte: oneWeekAgo } },
                orderBy: { createdAt: "desc" },
            });

            await sendWeeklySummaryEmail({
                to: sub.user.email,
                name: sub.user.name || "",
                reportCount: weeklyReports.length,
                latestRisk: weeklyReports[0]?.overallRisk || "",
            }).catch(console.error);
            sent++;
        }

        return NextResponse.json({ ok: true, sent });
    } catch (error) {
        console.error("Weekly summary cron failed:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

/**
 * POST /api/user/weekly-summary
 * Manually trigger a weekly summary for the currently logged-in user (for testing).
 */
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } });

    if (!prefs?.notifWeekly) {
        return NextResponse.json({ error: "Weekly notifications are disabled in your preferences" }, { status: 400 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const reports = await prisma.report.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        orderBy: { createdAt: "desc" },
    });

    await sendWeeklySummaryEmail({
        to: session.user.email!,
        name: session.user.name || "",
        reportCount: reports.length,
        latestRisk: reports[0]?.overallRisk || "",
    });

    return NextResponse.json({ ok: true });
}
