export interface ScheduledJob {
  readonly id: string;

  start(): void;

  cancel(): void;

  isComplete(): boolean;
}