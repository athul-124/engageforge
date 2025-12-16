import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import prisma from "@/lib/prisma";

// GET /api/badges?companyId=xxx - List all badges for a company
export async function GET(request: NextRequest): Promise<Response> {
    try {
        const { userId } = await whopsdk.verifyUserToken(await headers());
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) {
            return NextResponse.json(
                { error: "companyId is required" },
                { status: 400 }
            );
        }

        // Verify user has access
        const access = await whopsdk.users.checkAccess(companyId, { id: userId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const badges = await prisma.badge.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { earnedBy: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            badges: badges.map((badge) => ({
                ...badge,
                earnedCount: badge._count.earnedBy,
            })),
        });
    } catch (error) {
        console.error("[Badges API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/badges - Create a new badge
export async function POST(request: NextRequest): Promise<Response> {
    try {
        const { userId } = await whopsdk.verifyUserToken(await headers());
        const body = await request.json();
        const { companyId, name, description, icon } = body;

        if (!companyId || !name || !icon) {
            return NextResponse.json(
                { error: "Missing required fields: companyId, name, icon" },
                { status: 400 }
            );
        }

        // Verify user has access
        const access = await whopsdk.users.checkAccess(companyId, { id: userId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Ensure company exists
        await prisma.company.upsert({
            where: { id: companyId },
            create: { id: companyId, name: "Whop Company" },
            update: {},
        });

        const badge = await prisma.badge.create({
            data: {
                companyId,
                name,
                description: description || null,
                icon,
            },
        });

        return NextResponse.json({ badge }, { status: 201 });
    } catch (error) {
        console.error("[Badges API] Error creating badge:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
