import { createNotification } from "../services/notify/createNotification.ts";
import { badRequest, json } from "../utils/http.ts";

type NotifyRequestBody = {
  text?: unknown;
};

export async function createNotificationRequest(req: Request): Promise<Response> {
  let body: NotifyRequestBody;

  try {
    body = (await req.json()) as NotifyRequestBody;
    console.log(body);
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body.text !== "string" || body.text.trim() === "") {
    return badRequest("Expected body: { text: string }");
  }

  const result = await createNotification(body.text);

  return json(result, 201);
}