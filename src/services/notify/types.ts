export type NotifyContext =
  | {
      type: "HARDCODED";
      context: string;
    }
  | {
      type: "AGENT";
      agentPrompt: string;
      agentResponse?: string;
    };