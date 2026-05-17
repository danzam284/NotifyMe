import { describe, it, expect } from "bun:test";
import { apiRouter } from "../../routes/api";

describe("apiRouter", () => {
  it("routes POST /api/createNotification", async () => {
    const req = new Request("http://localhost/api/createNotification", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await apiRouter(req);

    expect(res).toBeInstanceOf(Response);
    expect(res.status).not.toBe(404);
    expect(res.status).not.toBe(405);
  });

  it("returns 404 for unknown route", async () => {
    const req = new Request("http://localhost/api/unknown", {
      method: "POST",
    });

    const res = await apiRouter(req);

    expect(res.status).toBe(404);
  });

  it("returns 405 for unsupported method", async () => {
    const req = new Request("http://localhost/api/createNotification", {
      method: "GET",
    });

    const res = await apiRouter(req);

    expect(res.status).toBe(405);
  });
});