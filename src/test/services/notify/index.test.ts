import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import * as responseParser from "../../../services/notify/responseParser";
import { chatSessionService } from "../../../services/chatSession/chatSessionService";
import { orchestrateFollowUpRequest, orchestrateInitialRequest } from "../../../services/notify";

describe("orchestrator", () => {
  const mockSession = {
    id: "session-123",
    sendMessage: mock(),
    delete: mock(),
  };

  beforeEach(() => {
    mock.restore();

    mockSession.sendMessage.mockReset();
    mockSession.delete.mockReset();
  });

  afterEach(() => {
    mock.restore();
  });

  describe("orchestrateInitialRequest", () => {
    it("creates a session and returns QUESTION response without deleting session", async () => {
      spyOn(chatSessionService, "createSession").mockResolvedValue(
        mockSession as any
      );

      mockSession.sendMessage.mockResolvedValue({
        response: "raw-response",
      });

      spyOn(responseParser, "parseAndValidateResponse").mockReturnValue({
        status: "QUESTION",
        question: "What stock are you tracking?",
      });

      const result = await orchestrateInitialRequest(
        "Notify me when Apple stock drops"
      );

      expect(chatSessionService.createSession).toHaveBeenCalledTimes(1);

      expect(mockSession.sendMessage).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        sessionId: "session-123",
        decision: {
          status: "QUESTION",
          question: "What stock are you tracking?",
        },
      });

      expect(mockSession.delete).not.toHaveBeenCalled();
    });

    it("deletes the session for HARDCODED responses", async () => {
      spyOn(chatSessionService, "createSession").mockResolvedValue(
        mockSession as any
      );

      mockSession.sendMessage.mockResolvedValue({
        response: "raw-response",
      });

      spyOn(responseParser, "parseAndValidateResponse").mockReturnValue({
        status: "HARDCODED",
        execute_at: "2026-05-21T10:00:00Z",
      });

      const result = await orchestrateInitialRequest(
        "Remind me tomorrow at 10am"
      );

      expect(result.decision.status).toBe("HARDCODED");

      expect(mockSession.delete).toHaveBeenCalledTimes(1);
    });

    it("deletes the session for CANNOT_DO responses", async () => {
      spyOn(chatSessionService, "createSession").mockResolvedValue(
        mockSession as any
      );

      mockSession.sendMessage.mockResolvedValue({
        response: "raw-response",
      });

      spyOn(responseParser, "parseAndValidateResponse").mockReturnValue({
        status: "CANNOT_DO",
        reason: "Unsupported request",
      });

      const result = await orchestrateInitialRequest(
        "Hack into NASA"
      );

      expect(result.decision.status).toBe("CANNOT_DO");

      expect(mockSession.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe("orchestrateFollowUpRequest", () => {
    it("throws when session does not exist", async () => {
      spyOn(chatSessionService, "getSession").mockResolvedValue(null);

      await expect(
        orchestrateFollowUpRequest("missing-session", "yes")
      ).rejects.toThrow(
        "Active notification creation session data was not found or has expired"
      );
    });

    it("uses existing session and returns AGENT response", async () => {
      spyOn(chatSessionService, "getSession").mockResolvedValue(
        mockSession as any
      );

      mockSession.sendMessage.mockResolvedValue({
        response: "raw-response",
      });

      spyOn(responseParser, "parseAndValidateResponse").mockReturnValue({
        status: "AGENT",
        interval: "1_HOUR",
        agent_prompt: "Check Bitcoin price hourly",
      });

      const result = await orchestrateFollowUpRequest(
        "session-123",
        "Check every hour"
      );

      expect(chatSessionService.getSession).toHaveBeenCalledWith(
        "session-123"
      );

      expect(mockSession.sendMessage).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        sessionId: "session-123",
        decision: {
          status: "AGENT",
          interval: "1_HOUR",
          agent_prompt: "Check Bitcoin price hourly",
        },
      });

      expect(mockSession.delete).toHaveBeenCalledTimes(1);
    });
  });
});