import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getLeaderboard } from "@/lib/rule-engine";

// GET /api/leaderboard?companyId=xxx&limit=10&offset=0
export async function GET(request: NextRequest): Promise<Response> {
    try {
        const { userId } = await whopsdk.verifyUserToken(await headers());
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

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

        const leaderboard = await getLeaderboard(companyId, limit, offset);

        return NextResponse.json({
            leaderboard,
            pagination: {
                limit,
                offset,
                hasMore: leaderboard.length === limit,
            },
        });
    } catch (error) {
        console.error("[Leaderboard API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
