import { parseAndValidateAgentResponse, parseAndValidateCreateResponse } from "../../../utils/responseParser";
import { intervalToMs } from "../../../utils/types";
import { GroqAgent } from "../../llm/providers/groqAgent";
import { MistralAgent } from "../../llm/providers/mistralAgent";
import type { AgentInterval } from "../../notificationRequest/types";
import type { NotifyService } from "../../notify";
import type { AgentResult } from "../agent/types";
import type { ScheduledJob } from "../types";

export class AgentPollingJob implements ScheduledJob {
  public readonly id: string;

  private interval: Timer | null = null;
  private completed = false;
  private agent = new GroqAgent();

  constructor(
    id: string,
    private readonly pollingInterval: AgentInterval,
    private readonly agentPrompt: string,
    private readonly notifyService: NotifyService
  ) {
    this.id = id;
  }

  public start(): void {
    const intervalMs = intervalToMs(this.pollingInterval);

    console.log(
      `[Agent] Starting polling job "${this.id}"`
    );

    this.checkNotification();
    this.interval = setInterval(async () => {
      this.checkNotification();
    }, 120000);
  }

  public cancel(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.completed = true;
  }

  public isComplete(): boolean {
    return this.completed;
  }

  private async checkNotification(): Promise<void> {
    try {
      console.log(`[Agent] Polling "${this.id}"`);
      console.log(this.agentPrompt);
      const result = await this.askAgent();

      if (result.shouldNotify) {
        console.log(`[Agent] Completed "${this.id}"`);
        await this.notifyService.notify(result.response!);
        this.cancel();
      }
    } catch (error) {
      console.error(`[Notification] Failed job "${this.id}"`, error);
    }
  }

  private async askAgent(): Promise<AgentResult> {
    const response = await this.agent.sendText(this.agentPrompt);
    console.log(response);
    return parseAndValidateAgentResponse(response)
  }
}