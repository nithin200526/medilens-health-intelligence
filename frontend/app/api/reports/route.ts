import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendAnalysisCompleteEmail, sendAbnormalMarkersEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id as string;
        const userEmail = session.user?.email || '';
        const userName = session.user?.name || '';

        const data = await req.json();

        if (!data.fullPayload) {
            return NextResponse.json({ error: 'Missing fullPayload' }, { status: 400 });
        }

        let profileId = data.profileId;

        // Auto-link profile if name matches and profileId isn't provided
        if (!profileId && data.patientName && data.patientName !== 'Unknown Patient') {
            const existingProfile = await prisma.patientProfile.findFirst({
                where: { userId, name: { equals: data.patientName } }
            });
            if (existingProfile) profileId = existingProfile.id;
        }

        // Check if auto-save is enabled (default true if no preference saved)
        const userPrefs = await prisma.userPreferences.findUnique({ where: { userId } });
        const autoSave = userPrefs?.autoSave ?? true;

        // If autoSave is OFF, skip DB save but still return a response
        if (!autoSave) {
            return NextResponse.json({ skipped: true, reason: 'autoSave disabled' }, { status: 200 });
        }

        const report = await prisma.report.create({
            data: {
                userId,
                profileId: profileId || null,
                patientName: data.patientName || 'Unknown Patient',
                patientAge: data.patientAge ? parseInt(data.patientAge) : null,
                patientGender: data.patientGender || null,
                reportDate: data.reportDate || null,
                labName: data.labName || null,
                overallRisk: data.overallRisk || 'Unknown',
                totalTests: data.totalTests || 0,
                abnormalTests: data.abnormalTests || 0,
                criticalTests: data.criticalTests || 0,
                fullPayload: typeof data.fullPayload === 'string' ? data.fullPayload : JSON.stringify(data.fullPayload),
            },
        });

        // ── Fire-and-forget email notifications ──────────────────────────
        if (userEmail) {
            // 1. Analysis complete notification
            if (userPrefs?.notifAnalysis !== false) {
                sendAnalysisCompleteEmail({
                    to: userEmail,
                    name: userName,
                    patientName: data.patientName || 'Unknown Patient',
                    totalTests: data.totalTests || 0,
                    abnormalTests: data.abnormalTests || 0,
                    overallRisk: data.overallRisk || 'Unknown',
                    reportId: report.id,
                }).catch(console.error);
            }

            // 2. Abnormal markers (only if there are critical or many abnormals)
            const criticalCount = data.criticalTests || 0;
            const abnormalCount = data.abnormalTests || 0;
            if ((userPrefs?.notifAbnormal !== false) && (criticalCount > 0 || abnormalCount > 0)) {
                sendAbnormalMarkersEmail({
                    to: userEmail,
                    name: userName,
                    patientName: data.patientName || 'Unknown Patient',
                    criticalCount,
                    abnormalTests: abnormalCount,
                    reportId: report.id,
                }).catch(console.error);
            }
        }

        return NextResponse.json({
            ...report,
            promptCreateProfile: !profileId && data.patientName && data.patientName !== 'Unknown Patient'
        }, { status: 201 });
    } catch (error) {
        console.error('Error saving report:', error);
        return NextResponse.json({ error: 'Error saving report' }, { status: 500 });
    }
}


export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id as string;

        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get('profileId');
        const id = searchParams.get('id');

        // Fetch single report if ID is provided
        if (id) {
            const report = await prisma.report.findUnique({
                where: { id, userId },
            });
            return NextResponse.json(report);
        }

        // Fetch list (optionally filtered by profile)
        const reports = await prisma.report.findMany({
            where: {
                userId,
                ...(profileId ? { profileId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Error fetching reports' }, { status: 500 });
    }
}
