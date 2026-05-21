import { describe, expect, test, spyOn, mock } from "bun:test";
import { handleFollowUpResponse, handleInitialPrompt } from "../../controllers/notificationController";
import * as notifyServices from "../../services/notify/index.ts";
import type { PipelineResult } from "../../services/notify/types.ts";

// Mock the dependencies
mock.module("../services/notify/index.ts", () => ({
  orchestrateInitialRequest: mock(),
  orchestrateFollowUpRequest: mock(),
}));

describe("Handler Tests", () => {
  
  describe("handleInitialPrompt", () => {
    test("returns 400 for invalid JSON", async () => {
      const req = new Request("http://localhost", { method: "POST", body: "invalid" });
      const res = await handleInitialPrompt(req);
      expect(res.status).toBe(400);
    });

    test("returns 400 for missing text", async () => {
      const req = new Request("http://localhost", { 
        method: "POST", 
        body: JSON.stringify({ text: "" }) 
      });
      const res = await handleInitialPrompt(req);
      expect(res.status).toBe(400);
    });

    test("returns 200 on success", async () => {
      const mockResult: PipelineResult = { 
        sessionId: "abc-123", 
        decision: { 
            status: "CANNOT_DO", 
            reason: "Not enough information" 
        } 
      };
      spyOn(notifyServices, "orchestrateInitialRequest").mockResolvedValue(mockResult);

      const req = new Request("http://localhost", { 
        method: "POST", 
        body: JSON.stringify({ text: "hello" }) 
      });
      const res = await handleInitialPrompt(req);
      
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockResult);
    });
  });

  describe("handleFollowUpResponse", () => {
    test("returns 400 if sessionId is missing", async () => {
      const req = new Request("http://localhost", { 
        method: "POST", 
        body: JSON.stringify({ text: "more info" }) 
      });
      const res = await handleFollowUpResponse(req);
      expect(res.status).toBe(400);
    });

    test("returns 200 on success", async () => {
      const mockResult: PipelineResult = { 
        sessionId: "abc-123", 
        decision: { 
            status: "CANNOT_DO", 
            reason: "Not enough information" 
        } 
      };
      spyOn(notifyServices, "orchestrateFollowUpRequest").mockResolvedValue(mockResult);

      const req = new Request("http://localhost", { 
        method: "POST", 
        body: JSON.stringify({ sessionId: "123", text: "more info" }) 
      });
      const res = await handleFollowUpResponse(req);
      
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockResult);
    });

    test("returns 500 on service error", async () => {
      spyOn(notifyServices, "orchestrateFollowUpRequest").mockRejectedValue(new Error("Service failed"));

      const req = new Request("http://localhost", { 
        method: "POST", 
        body: JSON.stringify({ sessionId: "123", text: "test" }) 
      });
      const res = await handleFollowUpResponse(req);
      
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Service failed" });
    });
  });
});