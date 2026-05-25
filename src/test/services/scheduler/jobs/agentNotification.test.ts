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
import type { NotifyService } from "../../../../services/notify";

describe("AgentPollingJob", () => {
  let setIntervalSpy: ReturnType<typeof spyOn>;
  let clearIntervalSpy: ReturnType<typeof spyOn>;

  let notifyMock: ReturnType<typeof mock>;
  let notifyService: NotifyService;

  beforeEach(() => {
    mock.restore();

    notifyMock = mock(async () => {});

    notifyService = {
      notify: notifyMock,
    } as unknown as NotifyService;

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
        "Check Bitcoin price",
        notifyService
      );

      expect(job.id).toBe("job-123");
    });

    it("starts as incomplete", () => {
      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price",
        notifyService
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
        "Check Bitcoin price",
        notifyService
      );

      job.start();

      expect(typeUtils.intervalToMs).toHaveBeenCalledWith("1_HOUR");

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5000
      );
    });

    it("sends a notification when polling succeeds", async () => {
      spyOn(typeUtils, "intervalToMs").mockReturnValue(5000);

      const randomSpy = spyOn(Math, "random").mockReturnValue(0.1);

      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price",
        notifyService
      );

      job.start();

      const callback = setIntervalSpy.mock.calls[0][0] as Function;

      await callback();

      expect(notifyMock).toHaveBeenCalledTimes(1);

      expect(notifyMock).toHaveBeenCalledWith({
        type: "AGENT",
        agentPrompt: "Check Bitcoin price",
        agentResponse: "Criteria matched for notification.",
      });

      expect(job.isComplete()).toBe(true);

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

      randomSpy.mockRestore();
    });

    it("does not send notification when polling does not succeed", async () => {
      spyOn(typeUtils, "intervalToMs").mockReturnValue(5000);

      const randomSpy = spyOn(Math, "random").mockReturnValue(0.9);

      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price",
        notifyService
      );

      job.start();

      const callback = setIntervalSpy.mock.calls[0][0] as Function;

      await callback();

      expect(notifyMock).not.toHaveBeenCalled();

      // Job still completes because cancel() is called in finally
      expect(job.isComplete()).toBe(true);

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

      randomSpy.mockRestore();
    });
  });

  describe("cancel", () => {
    it("clears the interval and marks the job complete", () => {
      spyOn(typeUtils, "intervalToMs").mockReturnValue(5000);

      const job = new AgentPollingJob(
        "job-123",
        "1_HOUR",
        "Check Bitcoin price",
        notifyService
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
        "Check Bitcoin price",
        notifyService
      );

      job.cancel();

      expect(job.isComplete()).toBe(true);

      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });
  });
});
