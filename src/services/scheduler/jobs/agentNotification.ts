import { intervalToMs } from "../../../utils/types";
import type { AgentInterval } from "../../notificationRequest/types";
import type { NotifyService } from "../../notify";
import type { ScheduledJob } from "../types";

export class AgentPollingJob implements ScheduledJob {
  public readonly id: string;

  private interval: Timer | null = null;
  private completed = false;

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

    this.interval = setInterval(async () => {
      void this.executeNotification();
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

  private async executeNotification(): Promise<void> {
    try {
      console.log(`[Agent] Polling "${this.id}"`);

      // Placeholder until real agent exists
      const agentResponse = "Criteria matched for notification.";

      const isDone = Math.random() < 0.5;

      if (isDone) {
        console.log(`[Agent] Completed "${this.id}"`);
        await this.notifyService.notify({
          type: "AGENT",
          agentPrompt: this.agentPrompt,
          agentResponse,
        });
      }
    } catch (error) {
      console.error(`[Notification] Failed job "${this.id}"`, error);
    } finally {
      this.cancel();
    }
  }
}