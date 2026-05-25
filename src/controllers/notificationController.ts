

import { orchestrateFollowUpRequest, orchestrateInitialRequest } from "../services/notificationRequest/index.ts";
import { badRequest, json } from "../utils/http.ts";

export async function handleInitialPrompt(req: Request): Promise<Response> {
  let body: { text?: unknown };
  try {
    body = (await req.json()) as { text?: unknown };
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body.text !== "string" || body.text.trim() === "") {
    return badRequest("Expected body shape: { text: string }");
  }

  try {
    const result = await orchestrateInitialRequest(body.text.trim());
    return json(result, 200);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

export async function handleFollowUpResponse(req: Request): Promise<Response> {
  let body: { sessionId?: unknown; text?: unknown };
  try {
    body = (await req.json()) as { text?: unknown };
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body.sessionId !== "string" || body.sessionId.trim() === "") {
    return badRequest("Expected body parameter: sessionId (string)");
  }
  if (typeof body.text !== "string" || body.text.trim() === "") {
    return badRequest("Expected body parameter: text (string)");
  }

  try {
    const result = await orchestrateFollowUpRequest(body.sessionId.trim(), body.text.trim());
    return json(result, 200);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}