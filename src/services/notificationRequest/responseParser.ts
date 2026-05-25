import { OrchestratorParsingError, VALID_INTERVALS, VALID_STATUSES, type AgentInterval, type OrchestratorResponse, type OrchestratorStatus } from "./types";

export function parseAndValidateResponse(rawLLMOutput: string): OrchestratorResponse {
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

  return categorizeResponse(parsedResponse);
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

function categorizeResponse(parsedResponse: any): OrchestratorResponse {
    const { reason, question, execute_at, interval, agent_prompt, context } = parsedResponse;

    switch (parsedResponse.status as OrchestratorStatus) {
        case 'CANNOT_DO':
            if (!reason || typeof reason !== 'string' || reason.trim() === '') {
                throw new OrchestratorParsingError('Status is CANNOT_DO but "reason" string is missing or empty.');
            }
            return { status: 'CANNOT_DO', reason: reason.trim() };

        case 'QUESTION':
            if (!question || typeof question !== 'string' || question.trim() === '') {
                throw new OrchestratorParsingError('Status is QUESTION but "question" string is missing or empty.');
            }
            return { status: 'QUESTION', question: question.trim() };

        case 'HARDCODED':
            if (!execute_at || isNaN(Date.parse(execute_at))) {
                throw new OrchestratorParsingError(`Status is HARDCODED but "execute_at" is missing or not a valid ISO-8601 timestamp. Received: ${execute_at}`);
            }
            if (new Date(execute_at).getTime() <= Date.now()) {
                throw new OrchestratorParsingError(`Status is HARDCODED but "execute_at" must be in the future. Received: ${execute_at}`);
            }
            if (!context || typeof context !== 'string' || context.trim() === '') {
                throw new OrchestratorParsingError('Status is HARDCODED but "context" string is missing or empty.');
            }
            return { 
                status: 'HARDCODED', 
                execute_at: execute_at, 
                context: context
            };

        case 'AGENT':
            if (!interval || !VALID_INTERVALS.includes(interval)) {
                throw new OrchestratorParsingError(`Status is AGENT but "interval" token is invalid. Got: "${interval}"`);
            }
            if (!agent_prompt || typeof agent_prompt !== 'string' || agent_prompt.trim() === '') {
                throw new OrchestratorParsingError('Status is AGENT but "agent_prompt" string is missing or empty.');
            }
            return { 
                status: 'AGENT', 
                interval: interval as AgentInterval, 
                agent_prompt: agent_prompt.trim() 
            };

        default:
            throw new OrchestratorParsingError('Unreachable state hit during execution fallback.');
    }
}