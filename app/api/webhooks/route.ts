import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { processEvent, type WebhookEvent } from "@/lib/rule-engine";

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Validate the webhook to ensure it's from Whop
		const requestBodyText = await request.text();
		const headers = Object.fromEntries(request.headers);
		const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

		console.log("[Webhook] Received event:", webhookData.type);

		// Extract company ID from the webhook data
		const companyId = (webhookData.data as { company_id?: string })?.company_id;

		if (!companyId) {
			console.log("[Webhook] No company_id in event, skipping gamification");
			return new Response("OK", { status: 200 });
		}

		// Process the event through our rule engine (non-blocking)
		const event: WebhookEvent = {
			type: webhookData.type,
			data: webhookData.data as unknown as WebhookEvent["data"],
		};

		waitUntil(
			processEvent(event, companyId).then((result) => {
				if (result.xpAwarded > 0) {
					console.log(
						`[Webhook] Awarded ${result.xpAwarded} XP, ` +
						`${result.badgesEarned.length} badges, ` +
						`Level up: ${result.levelUp}`
					);
				}
			}).catch((error) => {
				console.error("[Webhook] Error processing event:", error);
			})
		);

		// Return 200 quickly to prevent webhook retries
		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("[Webhook] Error validating webhook:", error);
		return new Response("Invalid webhook", { status: 400 });
	}
}

// Health check for the webhook endpoint
export async function GET(): Promise<Response> {
	return new Response(
		JSON.stringify({
			status: "healthy",
			service: "EngageForge Webhooks",
			timestamp: new Date().toISOString(),
		}),
		{
			status: 200,
			headers: { "Content-Type": "application/json" },
		}
	);
}
