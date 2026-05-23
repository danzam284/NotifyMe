import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

import { AgentPollingJob } from "../../../../services/scheduler/jobs/agentNotification";
import * as typeUtils from "../../../../utils/types";
import type { TimerHandler } from "bun";

describe("AgentPollingJob", () => {
  let setIntervalSpy: ReturnType<typeof spyOn>;
  let clearIntervalSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    mock.restore();

    setIntervalSpy = spyOn(global, "setInterval").mockImplementation(
      ((callback: TimerHandler) => {
        return {
          fake: true,
          callback,
        } as any;
      }) as any
    );

    clearIntervalSpy = spyOn(global, "clearInterval").mockImplementation(
      () => {}
    );
  });

  afterEach(() => {
    mock.restore();
  });

  describe("constructor", () => {
    it("sets the job id", () => {
      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price"
      );

      expect(job.id).toBe("job-123");
    });

    it("starts as incomplete", () => {
      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price"
      );

      expect(job.isComplete()).toBe(false);
    });
  });

  describe("start", () => {
    it("creates an interval using intervalToMs", () => {
      spyOn(typeUtils, "intervalToMs").mockReturnValue(5000);

      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price"
      );

      job.start();

      expect(typeUtils.intervalToMs).toHaveBeenCalledWith("1_HOUR");

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5000
      );
    });

    it("marks the job complete when polling succeeds", () => {
      spyOn(typeUtils, "intervalToMs").mockReturnValue(5000);

      const randomSpy = spyOn(Math, "random").mockReturnValue(0.1);

      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price"
      );

      job.start();

      const callback = setIntervalSpy.mock.calls[0][0] as Function;

      callback();

      expect(job.isComplete()).toBe(true);

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

      randomSpy.mockRestore();
    });

    it("does not complete the job when polling does not succeed", () => {
      spyOn(typeUtils, "intervalToMs").mockReturnValue(5000);

      const randomSpy = spyOn(Math, "random").mockReturnValue(0.9);

      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price"
      );

      job.start();

      const callback = setIntervalSpy.mock.calls[0][0] as Function;

      callback();

      expect(job.isComplete()).toBe(false);

      expect(clearIntervalSpy).not.toHaveBeenCalled();

      randomSpy.mockRestore();
    });
  });

  describe("cancel", () => {
    it("clears the interval and marks the job complete", () => {
      spyOn(typeUtils, "intervalToMs").mockReturnValue(5000);

      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price"
      );

      job.start();

      job.cancel();

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

      expect(job.isComplete()).toBe(true);
    });

    it("still marks complete even if interval was never started", () => {
      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price"
      );

      job.cancel();

      expect(job.isComplete()).toBe(true);

      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });
  });
});