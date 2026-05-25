import type { AgentInterval } from "../services/notificationRequest/types";

export function intervalToMs(interval: AgentInterval): number {
  switch (interval) {
    case "1_HOUR":
      return 60 * 60 * 1000;

    case "6_HOURS":
      return 6 * 60 * 60 * 1000;

    case "12_HOURS":
      return 12 * 60 * 60 * 1000;

    case "1_DAY":
      return 24 * 60 * 60 * 1000;

    case "1_WEEK":
      return 7 * 24 * 60 * 60 * 1000;

    default: {
      const exhaustiveCheck: never = interval;

      throw new Error(`Unhandled interval: ${exhaustiveCheck}`);
    }
  }
}