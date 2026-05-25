import { describe, expect, it } from "bun:test";
import { parseAndValidateResponse } from "../../../services/notificationRequest/responseParser";
import { OrchestratorParsingError } from "../../../services/notificationRequest/types";


describe("parseAndValidateResponse", () => {
  describe("valid responses", () => {
    it("parses a valid CANNOT_DO response", () => {
      const result = parseAndValidateResponse(`
        {
          "status": "CANNOT_DO",
          "reason": "I cannot access private bank accounts."
        }
      `);

      expect(result).toEqual({
        status: "CANNOT_DO",
        reason: "I cannot access private bank accounts.",
      });
    });

    it("parses a valid QUESTION response", () => {
      const result = parseAndValidateResponse(`
        {
          "status": "QUESTION",
          "question": "Which stock would you like tracked?"
        }
      `);

      expect(result).toEqual({
        status: "QUESTION",
        question: "Which stock would you like tracked?",
      });
    });

    it("parses a valid HARDCODED response", () => {
      const result = parseAndValidateResponse(`
        {
          "status": "HARDCODED",
          "execute_at": "2040-05-21T10:00:00Z",
          "context": "hi"
        }
      `);

      expect(result).toEqual({
        status: "HARDCODED",
        execute_at: "2040-05-21T10:00:00Z",
        context: "hi"
      });
    });

    it("parses a valid AGENT response", () => {
      const result = parseAndValidateResponse(`
        {
          "status": "AGENT",
          "interval": "1_HOUR",
          "agent_prompt": "Check Bitcoin price every hour"
        }
      `);

      expect(result).toEqual({
        status: "AGENT",
        interval: "1_HOUR",
        agent_prompt: "Check Bitcoin price every hour",
      });
    });

    it("parses markdown wrapped JSON", () => {
      const result = parseAndValidateResponse(`
\`\`\`json
{
  "status": "QUESTION",
  "question": "What city?"
}
\`\`\`
      `);

      expect(result).toEqual({
        status: "QUESTION",
        question: "What city?",
      });
    });

    it("preserves escaped newlines inside strings", () => {
      const result = parseAndValidateResponse(`
        {
          "status": "QUESTION",
          "question": "Line 1
Line 2"
        }
      `);

      expect(result).toEqual({
        status: "QUESTION",
        question: "Line 1\nLine 2",
      });
    });
  });

  describe("invalid input", () => {
    it("throws for empty input", () => {
      expect(() => parseAndValidateResponse("")).toThrow(
        OrchestratorParsingError
      );
    });

    it("throws for non-string input", () => {
      expect(() =>
        parseAndValidateResponse(null as any)
      ).toThrow(OrchestratorParsingError);
    });

    it("throws for invalid JSON", () => {
      expect(() =>
        parseAndValidateResponse("{ invalid json")
      ).toThrow(OrchestratorParsingError);
    });

    it("throws for missing status", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "question": "Missing status"
          }
        `)
      ).toThrow(OrchestratorParsingError);
    });

    it("throws for invalid status", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "SOMETHING_RANDOM"
          }
        `)
      ).toThrow(OrchestratorParsingError);
    });

    it("throws for hardcoded date in the past", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "HARDCODED",
            "execute_at": "2020-05-21T10:00:00Z",
            "context": "hi"
          }
        `)
      ).toThrow(OrchestratorParsingError)
    });
  });

  describe("CANNOT_DO validation", () => {
    it("throws when reason is missing", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "CANNOT_DO"
          }
        `)
      ).toThrow(
        'Status is CANNOT_DO but "reason" string is missing or empty.'
      );
    });

    it("throws when reason is empty", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "CANNOT_DO",
            "reason": "   "
          }
        `)
      ).toThrow(OrchestratorParsingError);
    });
  });

  describe("QUESTION validation", () => {
    it("throws when question is missing", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "QUESTION"
          }
        `)
      ).toThrow(
        'Status is QUESTION but "question" string is missing or empty.'
      );
    });
  });

  describe("HARDCODED validation", () => {
    it("throws when execute_at is missing", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "HARDCODED"
          }
        `)
      ).toThrow(OrchestratorParsingError);
    });

    it("throws when execute_at is invalid", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "HARDCODED",
            "execute_at": "tomorrow-ish"
          }
        `)
      ).toThrow(OrchestratorParsingError);
    });
  });

  describe("AGENT validation", () => {
    it("throws when interval is invalid", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "AGENT",
            "interval": "EVERY_MINUTE",
            "agent_prompt": "Track something"
          }
        `)
      ).toThrow(
        'Status is AGENT but "interval" token is invalid. Got: "EVERY_MINUTE"'
      );
    });

    it("throws when agent_prompt is missing", () => {
      expect(() =>
        parseAndValidateResponse(`
          {
            "status": "AGENT",
            "interval": "1_HOUR"
          }
        `)
      ).toThrow(
        'Status is AGENT but "agent_prompt" string is missing or empty.'
      );
    });

    it("trims whitespace from agent_prompt", () => {
      const result = parseAndValidateResponse(`
        {
          "status": "AGENT",
          "interval": "1_DAY",
          "agent_prompt": "   Track Seattle weather daily   "
        }
      `);

      expect(result).toEqual({
        status: "AGENT",
        interval: "1_DAY",
        agent_prompt: "Track Seattle weather daily",
      });
    });
  });
});