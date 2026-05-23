import type { ScheduledJob } from "../types";

export class HardcodedNotificationJob implements ScheduledJob {
  public readonly id: string;

  private timeout: Timer | null = null;
  private completed = false;

  constructor(
    id: string,
    private readonly executeAt: Date,
    private readonly context: string
  ) {
    this.id = id;
  }

  public start(): void {
    const delay = this.executeAt.getTime() - Date.now();

    if (delay <= 0) {
      console.warn(`[Scheduler] Job "${this.id}" already expired`);
      this.completed = true;
      return;
    }

    console.log(
      `[Scheduler] Scheduling notification "${this.id}" for ${this.executeAt.toISOString()}`
    );

    this.timeout = setTimeout(() => {
      console.log(`[Notification] ${this.context}`);

      this.completed = true;
    }, delay);
  }

  public cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.completed = true;
  }

  public isComplete(): boolean {
    return this.completed;
  }
}