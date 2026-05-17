import { chatSessionService } from "../chatSession/chatSessionService";
import type { ChatSession } from "../chatSession/chatSession";

export async function createNotification(text: string) {
  const cleanedText = text.trim();
  
  const session: ChatSession = await chatSessionService.createSession();
  const resp1 = await session.sendMessage("Hi, what is 5 + 5");
  console.log(resp1.response);
  const resp2 = await session.sendMessage("Now, what is the sum of the previous sum plus 10");
  console.log(resp2.response);
  return session.messages.toString();
}