import type { ChatSession } from "../chatSession/chatSession";
import { chatSessionService } from "../chatSession/chatSessionService";
import { NOTIFY_CLASSIFIER_SYSTEM_PROMPT, USER_INITIAL_PROMPT, USER_RESPONSE_PROMPT } from "../llm/prompts";
import { notifyService } from "../notify";
import { schedulerService } from "../scheduler";
import { AgentPollingJob } from "../scheduler/jobs/agentNotification";
import { HardcodedNotificationJob } from "../scheduler/jobs/hardcodedNotification";
import { parseAndValidateResponse } from "./responseParser";
import type { OrchestratorResponse, PipelineResult } from "./types";

export async function orchestrateInitialRequest(text: string): Promise<PipelineResult> {
  const session: ChatSession = await chatSessionService.createSession({
    systemPrompt: NOTIFY_CLASSIFIER_SYSTEM_PROMPT(new Date().toISOString())
  });

  const execution = await session.sendMessage(USER_INITIAL_PROMPT(text));
  return processExecutionResult(session, execution.response);
}

export async function orchestrateFollowUpRequest(sessionId: string, replyText: string): Promise<PipelineResult> {
  const session: ChatSession | null = await chatSessionService.getSession(sessionId);
  if (!session) {
    throw new Error(`Active notification creation session data was not found or has expired for ID: ${sessionId}`);
  }

  const execution = await session.sendMessage(USER_RESPONSE_PROMPT(replyText));
  return processExecutionResult(session, execution.response);
}

async function processExecutionResult(session: ChatSession, rawResponse: string): Promise<PipelineResult> {
  const validatedDecision = parseAndValidateResponse(rawResponse);

  if (validatedDecision.status === "HARDCODED" || validatedDecision.status === "AGENT") {
    await persistActiveNotificationWorker(session.id, validatedDecision);
  }

  if (validatedDecision.status !== "QUESTION") {
    await session.delete(); 
  }

  return {
    sessionId: session.id,
    decision: validatedDecision
  };
}

async function persistActiveNotificationWorker(
  sessionId: string,
  decision: OrchestratorResponse
): Promise<void> {

  if (decision.status === "HARDCODED") {
    schedulerService.schedule(
      new HardcodedNotificationJob(
        sessionId,
        new Date(decision.execute_at),
        decision.response,
        notifyService
      )
    );
  }

  if (decision.status === "AGENT") {
    schedulerService.schedule(
      new AgentPollingJob(
        sessionId,
        decision.interval,
        decision.agent_prompt,
        notifyService
      )
    );
  }
}