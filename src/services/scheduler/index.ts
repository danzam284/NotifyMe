import type { ScheduledJob } from "./types";

export class SchedulerService {
  private jobs = new Map<string, ScheduledJob>();

  private cleanupInterval: Timer;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, 1000 * 60);
  }

  public schedule(job: ScheduledJob): void {
    if (this.jobs.has(job.id)) {
      throw new Error(`Job "${job.id}" already exists`);
    }

    this.jobs.set(job.id, job);

    job.start();

    console.log(`[Scheduler] Registered job "${job.id}"`);
  }

  public cancel(jobId: string): void {
    const job = this.jobs.get(jobId);

    if (!job) {
      return;
    }

    job.cancel();

    this.jobs.delete(jobId);

    console.log(`[Scheduler] Cancelled job "${jobId}"`);
  }

  public cleanupCompletedJobs(): void {
    for (const [id, job] of this.jobs.entries()) {
      if (job.isComplete()) {
        this.jobs.delete(id);

        console.log(`[Scheduler] Cleaned up completed job "${id}"`);
      }
    }
  }

  public getJob(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }
}

export const schedulerService = new SchedulerService();