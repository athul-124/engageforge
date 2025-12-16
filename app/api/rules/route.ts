import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import prisma from "@/lib/prisma";
import { SUPPORTED_EVENT_TYPES } from "@/lib/rule-engine";

// GET /api/rules?companyId=xxx - List all rules for a company
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

        // Verify user has access to this company
        const access = await whopsdk.users.checkAccess(companyId, { id: userId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const rules = await prisma.rule.findMany({
            where: { companyId },
            include: { badge: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            rules,
            supportedEventTypes: SUPPORTED_EVENT_TYPES,
        });
    } catch (error) {
        console.error("[Rules API] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Internal server error", details: errorMessage },
            { status: 500 }
        );
    }
}

// POST /api/rules - Create a new rule
export async function POST(request: NextRequest): Promise<Response> {
    try {
        const { userId } = await whopsdk.verifyUserToken(await headers());
        const body = await request.json();
        const { companyId, name, description, eventType, xpAmount, badgeId } = body;

        if (!companyId || !name || !eventType || xpAmount === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: companyId, name, eventType, xpAmount" },
                { status: 400 }
            );
        }

        // Verify user has access to this company (admin check)
        const access = await whopsdk.users.checkAccess(companyId, { id: userId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Ensure company exists in our DB
        await prisma.company.upsert({
            where: { id: companyId },
            create: { id: companyId, name: "Whop Company" },
            update: {},
        });

        // Create the rule
        const rule = await prisma.rule.create({
            data: {
                companyId,
                name,
                description: description || null,
                eventType,
                xpAmount: parseInt(xpAmount, 10),
                badgeId: badgeId || null,
            },
            include: { badge: true },
        });

        return NextResponse.json({ rule }, { status: 201 });
    } catch (error) {
        console.error("[Rules API] Error creating rule:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
