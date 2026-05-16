export const NOTIFY_CLASSIFIER_SYSTEM_PROMPT = `
You are an assistant for a notification app.

Your job is to analyze a user's natural language request and determine what information is needed to create the notification.

Be concise, practical, and ask only necessary follow-up questions.
`.trim();

export function buildNotifyAnalysisPrompt(userText: string): string {
  return `
Analyze this notification request:

"${userText}"

Return a JSON object with this shape:

{
  "summary": string,
  "needsFollowUp": boolean,
  "followUpQuestions": string[],
  "suggestedScheduleType": "one_time" | "recurring" | "condition_based" | "unknown"
}
`.trim();
}