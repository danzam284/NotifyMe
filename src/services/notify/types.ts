export const VALID_STATUSES = ['CANNOT_DO', 'QUESTION', 'HARDCODED', 'AGENT'] as const;
export const VALID_INTERVALS = ['1_HOUR', '6_HOURS', '12_HOURS', '1_DAY', '1_WEEK'] as const;

export type OrchestratorStatus = (typeof VALID_STATUSES)[number];
export type AgentInterval = (typeof VALID_INTERVALS)[number];

export type CannotDoResponse = { status: 'CANNOT_DO'; reason: string };
export type QuestionResponse = { status: 'QUESTION'; question: string };
export type HardcodedResponse = { status: 'HARDCODED'; execute_at: string };
export type AgentResponse = { status: 'AGENT'; interval: AgentInterval; agent_prompt: string };

export type OrchestratorResponse = CannotDoResponse | QuestionResponse | HardcodedResponse | AgentResponse;

export class OrchestratorParsingError extends Error {
  constructor(message: string) {
    super(`[Orchestrator Parsing Error] ${message}`);
    this.name = 'OrchestratorParsingError';
  }
}

export type PipelineResult = {
  sessionId: string;
  decision: OrchestratorResponse;
};