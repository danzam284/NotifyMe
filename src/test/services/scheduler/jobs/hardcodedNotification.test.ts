import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

import { HardcodedNotificationJob } from "../../../../services/scheduler/jobs/hardcodedNotification";
import type { TimerHandler } from "bun";
import type { NotifyService } from "../../../../services/notify";

describe("HardcodedNotificationJob", () => {
  let setTimeoutSpy: ReturnType<typeof spyOn>;
  let clearTimeoutSpy: ReturnType<typeof spyOn>;

  let notifyMock: ReturnType<typeof mock>;
  let notifyService: NotifyService;

  beforeEach(() => {
    mock.restore();

    notifyMock = mock(async () => {});

    notifyService = {
        notify: notifyMock,
    } as unknown as NotifyService;

    setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(
      ((callback: TimerHandler) => {
        return {
          fake: true,
          callback,
        } as any;
      }) as any
    );

    clearTimeoutSpy = spyOn(global, "clearTimeout").mockImplementation(
      () => {}
    );
  });

  afterEach(() => {
    mock.restore();
  });

  describe("constructor", () => {
    it("sets the job id", () => {
      const job = new HardcodedNotificationJob(
        "job-123",
        new Date(Date.now() + 1000),
        "Reminder text",
        notifyService
      );

      expect(job.id).toBe("job-123");
    });

    it("starts incomplete", () => {
      const job = new HardcodedNotificationJob(
        "job-123",
        new Date(Date.now() + 1000),
        "Reminder text",
        notifyService
      );

      expect(job.isComplete()).toBe(false);
    });
  });

  describe("start", () => {
    it("schedules a timeout with the correct delay", () => {
      const futureDate = new Date(Date.now() + 5000);

      const job = new HardcodedNotificationJob(
        "job-123",
        futureDate,
        "Reminder text",
        notifyService
      );

      job.start();

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Number)
      );

      const delay = setTimeoutSpy.mock.calls[0][1] as number;

      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it("marks complete immediately if executeAt is in the past", () => {
      const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

      const pastDate = new Date(Date.now() - 1000);

      const job = new HardcodedNotificationJob(
        "job-123",
        pastDate,
        "Reminder text",
        notifyService
      );

      job.start();

      expect(job.isComplete()).toBe(true);

      expect(setTimeoutSpy).not.toHaveBeenCalled();

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("sends notification when timeout callback executes", async () => {
      const futureDate = new Date(Date.now() + 5000);

      const job = new HardcodedNotificationJob(
        "job-123",
        futureDate,
        "Reminder text",
        notifyService
      );

      job.start();

      const callback = setTimeoutSpy.mock.calls[0][0] as Function;

      await callback();

      expect(notifyMock).toHaveBeenCalledTimes(1);

      expect(notifyMock).toHaveBeenCalledWith({
        type: "HARDCODED",
        context: "Reminder text",
      });

      expect(job.isComplete()).toBe(true);
    });
  });

  describe("cancel", () => {
    it("clears the timeout and marks complete", () => {
      const futureDate = new Date(Date.now() + 5000);

      const job = new HardcodedNotificationJob(
        "job-123",
        futureDate,
        "Reminder text",
        notifyService
      );

      job.start();

      job.cancel();

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

      expect(job.isComplete()).toBe(true);
    });

    it("still marks complete if timeout was never started", () => {
      const futureDate = new Date(Date.now() + 5000);

      const job = new HardcodedNotificationJob(
        "job-123",
        futureDate,
        "Reminder text",
        notifyService
      );

      job.cancel();

      expect(job.isComplete()).toBe(true);

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });
  });
});