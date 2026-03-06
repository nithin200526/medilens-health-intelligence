import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized({ req, token }) {
                const path = req.nextUrl.pathname;

                // Protected routes require a valid token
                if (
                    path.startsWith('/dashboard') ||
                    path.startsWith('/upload') ||
                    path.startsWith('/api/reports') ||
                    path.startsWith('/api/profiles')
                ) {
                    return !!token;
                }

                return true;
            },
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/upload/:path*',
        '/api/reports/:path*',
        '/api/profiles/:path*',
    ],
};
