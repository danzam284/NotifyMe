import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test";

import type { ScheduledJob } from "../../../services/scheduler/types";
import { SchedulerService } from "../../../services/scheduler";

describe("SchedulerService", () => {
  let scheduler: SchedulerService;

  const createMockJob = (
    overrides: Partial<ScheduledJob> = {}
  ): ScheduledJob => {
    return {
      id: "job-123",
      start: mock(),
      cancel: mock(),
      isComplete: mock(() => false),
      ...overrides,
    };
  };

  beforeEach(() => {
    scheduler = new SchedulerService();
  });

  afterEach(() => {
    mock.restore();

    // prevent dangling interval timers during tests
    clearInterval((scheduler as any).cleanupInterval);
  });

  describe("schedule", () => {
    it("registers and starts a job", () => {
      const job = createMockJob();

      scheduler.schedule(job);

      expect(job.start).toHaveBeenCalledTimes(1);

      expect(scheduler.getJob(job.id)).toBe(job);
    });

    it("throws if a job with the same id already exists", () => {
      const job = createMockJob();

      scheduler.schedule(job);

      expect(() => scheduler.schedule(job)).toThrow(
        'Job "job-123" already exists'
      );
    });
  });

  describe("cancel", () => {
    it("cancels and removes an existing job", () => {
      const job = createMockJob();

      scheduler.schedule(job);

      scheduler.cancel(job.id);

      expect(job.cancel).toHaveBeenCalledTimes(1);

      expect(scheduler.getJob(job.id)).toBeUndefined();
    });

    it("does nothing if the job does not exist", () => {
      expect(() => scheduler.cancel("missing-job")).not.toThrow();
    });
  });

  describe("cleanupCompletedJobs", () => {
    it("removes completed jobs", () => {
      const completedJob = createMockJob({
        id: "completed-job",
        isComplete: mock(() => true),
      });

      const activeJob = createMockJob({
        id: "active-job",
        isComplete: mock(() => false),
      });

      scheduler.schedule(completedJob);
      scheduler.schedule(activeJob);

      scheduler.cleanupCompletedJobs();

      expect(scheduler.getJob("completed-job")).toBeUndefined();

      expect(scheduler.getJob("active-job")).toBe(activeJob);
    });

    it("does not remove incomplete jobs", () => {
      const job = createMockJob({
        isComplete: mock(() => false),
      });

      scheduler.schedule(job);

      scheduler.cleanupCompletedJobs();

      expect(scheduler.getJob(job.id)).toBe(job);
    });
  });

  describe("getJob", () => {
    it("returns undefined for missing jobs", () => {
      expect(scheduler.getJob("missing")).toBeUndefined();
    });
  });
});