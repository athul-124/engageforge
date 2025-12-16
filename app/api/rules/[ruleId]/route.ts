import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import prisma from "@/lib/prisma";

// GET /api/rules/[ruleId] - Get a specific rule
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ruleId: string }> }
): Promise<Response> {
    try {
        const { userId } = await whopsdk.verifyUserToken(await headers());
        const { ruleId } = await params;

        const rule = await prisma.rule.findUnique({
            where: { id: ruleId },
            include: { badge: true },
        });

        if (!rule) {
            return NextResponse.json(
                { error: "Rule not found" },
                { status: 404 }
            );
        }

        // Verify user has access to this company
        const access = await whopsdk.users.checkAccess(rule.companyId, { id: userId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        return NextResponse.json({ rule });
    } catch (error) {
        console.error("[Rules API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/rules/[ruleId] - Update a rule
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ ruleId: string }> }
): Promise<Response> {
    try {
        const { userId } = await whopsdk.verifyUserToken(await headers());
        const { ruleId } = await params;
        const body = await request.json();

        const rule = await prisma.rule.findUnique({
            where: { id: ruleId },
        });

        if (!rule) {
            return NextResponse.json(
                { error: "Rule not found" },
                { status: 404 }
            );
        }

        // Verify user has access
        const access = await whopsdk.users.checkAccess(rule.companyId, { id: userId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const updatedRule = await prisma.rule.update({
            where: { id: ruleId },
            data: {
                name: body.name,
                description: body.description,
                eventType: body.eventType,
                xpAmount: body.xpAmount !== undefined ? parseInt(body.xpAmount, 10) : undefined,
                badgeId: body.badgeId,
                isActive: body.isActive,
            },
            include: { badge: true },
        });

        return NextResponse.json({ rule: updatedRule });
    } catch (error) {
        console.error("[Rules API] Error updating rule:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/rules/[ruleId] - Delete a rule
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ ruleId: string }> }
): Promise<Response> {
    try {
        const { userId } = await whopsdk.verifyUserToken(await headers());
        const { ruleId } = await params;

        const rule = await prisma.rule.findUnique({
            where: { id: ruleId },
        });

        if (!rule) {
            return NextResponse.json(
                { error: "Rule not found" },
                { status: 404 }
            );
        }

        // Verify user has access
        const access = await whopsdk.users.checkAccess(rule.companyId, { id: userId });
        if (!access.has_access) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        await prisma.rule.delete({
            where: { id: ruleId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Rules API] Error deleting rule:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
