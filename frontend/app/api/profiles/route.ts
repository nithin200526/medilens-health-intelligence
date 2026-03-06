import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id as string;

        const profiles = await prisma.patientProfile.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { reports: true }
                }
            },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        return NextResponse.json({ error: 'Error fetching profiles' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id as string;

        const data = await req.json();
        if (!data.name) {
            return NextResponse.json({ error: 'Missing profile name' }, { status: 400 });
        }

        const profile = await prisma.patientProfile.create({
            data: {
                userId,
                name: data.name,
                age: data.age ? parseInt(data.age) : null,
                gender: data.gender || null,
            },
        });

        return NextResponse.json(profile, { status: 201 });
    } catch (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Error creating profile' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id as string;

        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get('id');

        if (!profileId) {
            return NextResponse.json({ error: 'Missing profile ID' }, { status: 400 });
        }

        // Verify the profile belongs to the user
        const profile = await prisma.patientProfile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (profile.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.patientProfile.delete({ where: { id: profileId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting profile:', error);
        return NextResponse.json({ error: 'Error deleting profile' }, { status: 500 });
    }
}
