import { OrchestratorParsingError, VALID_INTERVALS, VALID_STATUSES, type AgentInterval, type OrchestratorResponse, type OrchestratorStatus } from "../services/notificationRequest/types";
import type { AgentResult } from "../services/scheduler/agent/types";

export function parseAndValidateCreateResponse(rawLLMOutput: string): OrchestratorResponse {
  if (!rawLLMOutput || typeof rawLLMOutput !== 'string') {
    throw new OrchestratorParsingError('Received empty or non-string input from the LLM.');
  }

  let cleaned = cleanRawResponse(rawLLMOutput);

  let parsedResponse: any;
  try {
    parsedResponse = JSON.parse(cleaned);
  } catch (e: any) {
    throw new OrchestratorParsingError(`Invalid JSON payload. Succeeded cleaning but failed parsing: ${e.message}`);
  }

  if (!parsedResponse.status || !VALID_STATUSES.includes(parsedResponse.status)) {
    throw new OrchestratorParsingError(`Missing or invalid status field. Received: "${parsedResponse.status}"`);
  }

  return categorizeCreateResponse(parsedResponse);
}

export function parseAndValidateAgentResponse(rawLLMOutput: string): AgentResult {
  if (!rawLLMOutput || typeof rawLLMOutput !== 'string') {
    throw new OrchestratorParsingError('Received empty or non-string input from the LLM.');
  }

  const cleaned = cleanRawResponse(rawLLMOutput);

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    throw new OrchestratorParsingError(`Invalid JSON payload: ${e.message}`);
  }

  // Validate structure
  if (typeof parsed.shouldNotify !== 'boolean') {
    throw new OrchestratorParsingError('Field "shouldNotify" must be a boolean.');
  }

  // Logic validation: If shouldNotify is true, response must exist and be non-empty
  if (parsed.shouldNotify) {
    validateNotNullOrEmpty(parsed.response, "Response");
  }

  return {
    shouldNotify: parsed.shouldNotify,
    response: parsed.shouldNotify ? parsed.response.trim() : null,
  };
}

function cleanRawResponse(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        // Regex extracts text between first opening json block/ticks and final ticks
        const match = cleaned.match(/^(?:```json\s*|```\s*)?([\s\S]*?)(?:```)?$/);
        if (match && match[1]) {
            cleaned = match[1].trim();
        }
    }

    cleaned = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
    return match
        .replace(/\r?\n/g, '\\n')
        .replace(/\r/g, '\\n');
    });
    return cleaned;
}

function categorizeCreateResponse(parsedResponse: any): OrchestratorResponse {
    const { reason, question, execute_at, interval, agent_prompt, response } = parsedResponse;

    switch (parsedResponse.status as OrchestratorStatus) {
        case 'CANNOT_DO':
            validateNotNullOrEmpty(reason, "Reason");
            return { status: 'CANNOT_DO', reason: reason.trim() };

        case 'QUESTION':
            validateNotNullOrEmpty(question, "Question");
            return { status: 'QUESTION', question: question.trim() };

        case 'HARDCODED':
            if (!execute_at || isNaN(Date.parse(execute_at))) {
                throw new OrchestratorParsingError(`Status is HARDCODED but "execute_at" is missing or not a valid ISO-8601 timestamp. Received: ${execute_at}`);
            }
            if (new Date(execute_at).getTime() <= Date.now()) {
                throw new OrchestratorParsingError(`Status is HARDCODED but "execute_at" must be in the future. Received: ${execute_at}`);
            }
            validateNotNullOrEmpty(response, "Response");
            return { 
                status: 'HARDCODED', 
                execute_at: execute_at, 
                response: response
            };

        case 'AGENT':
            if (!interval || !VALID_INTERVALS.includes(interval)) {
                throw new OrchestratorParsingError(`Status is AGENT but "interval" token is invalid. Got: "${interval}"`);
            }
            validateNotNullOrEmpty(agent_prompt, "Agent_Prompt");
            return { 
                status: 'AGENT', 
                interval: interval as AgentInterval, 
                agent_prompt: agent_prompt.trim() 
            };

        default:
            throw new OrchestratorParsingError('Unreachable state hit during execution fallback.');
    }
}

function validateNotNullOrEmpty(val: String, name: String) {
    if (!val || typeof val !== 'string' || val.trim() === '') {
        throw new OrchestratorParsingError(`\"${name}\" string is missing or empty.`);
    }
}