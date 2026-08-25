import { describe, expect, it } from "vitest";

describe("Gemini configuration", () => {
  it("validates the server-side API key against the models endpoint", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey ?? "")}`
    );
    expect(response.ok).toBe(true);
  }, 15_000);
});
