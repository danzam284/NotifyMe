import { intervalToMs } from "../../../utils/types";
import type { AgentInterval } from "../../notify/types";
import type { ScheduledJob } from "../types";

export class AgentPollingJob implements ScheduledJob {
  public readonly id: string;

  private interval: Timer | null = null;
  private completed = false;

  constructor(
    id: string,
    private readonly pollingInterval: AgentInterval,
    private readonly agentPrompt: string
  ) {
    this.id = id;
  }

  public start(): void {
    const intervalMs = intervalToMs(this.pollingInterval);

    console.log(
      `[Agent] Starting polling job "${this.id}"`
    );

    this.interval = setInterval(() => {
      console.log(`[Agent] Polling "${this.id}"`);

      const isDone = Math.random() < 0.2;

      if (isDone) {
        console.log(`[Agent] Completed "${this.id}"`);
        console.log(`[Agent Prompt] ${this.agentPrompt}`);

        this.cancel();
      }
    }, intervalMs);
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
}