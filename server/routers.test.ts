import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

const db = vi.hoisted(() => ({
  createIssue: vi.fn(),
  deleteIssue: vi.fn(),
  getIssueById: vi.fn(),
  listAnalyses: vi.fn(),
  listIssues: vi.fn(),
  createAnalysis: vi.fn(),
}));
const ai = vi.hoisted(() => ({ analyzeIssue: vi.fn() }));

vi.mock("./db", () => db);
vi.mock("./ai", async () => {
  const actual = await vi.importActual<typeof import("./ai")>("./ai");
  return { ...actual, aiProvider: ai };
});

import { appRouter } from "./routers";

describe("issues router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid issue input before touching persistence", async () => {
    const caller = appRouter.createCaller({ req: {}, res: {} } as never);
    await expect(caller.issues.create({ title: "x", description: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createIssue).not.toHaveBeenCalled();
  });

  it("returns not found with the appropriate error code", async () => {
    db.getIssueById.mockResolvedValue(undefined);
    const caller = appRouter.createCaller({ req: {}, res: {} } as never);
    await expect(caller.issues.get({ id: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("persists a valid analysis and serializes suggested tests", async () => {
    const issue = { id: 1, title: "Bug", description: "A reproducible bug", userId: 1 };
    const result = { category: "Bug", priority: "high", severity: "medium", area: "Frontend", summary: "Resumo", possibleCause: "Causa", suggestedSolution: "Solução", suggestedTests: ["Teste de regressão"] };
    db.getIssueById.mockResolvedValue(issue);
    ai.analyzeIssue.mockResolvedValue(result);
    db.createAnalysis.mockResolvedValue({ id: 10, issueId: 1, ...result, suggestedTests: JSON.stringify(result.suggestedTests) });
    const caller = appRouter.createCaller({ req: {}, res: {} } as never);
    await expect(caller.issues.analyze({ id: 1 })).resolves.toMatchObject({ id: 10, issueId: 1 });
    expect(db.createAnalysis).toHaveBeenCalledWith(expect.objectContaining({ issueId: 1, suggestedTests: JSON.stringify(result.suggestedTests) }));
  });

  it("returns the issue with its associated analysis history", async () => {
    const issue = { id: 2, title: "Crash", description: "Crashes on startup", userId: 1 };
    const history = [{ id: 11, issueId: 2, priority: "critical" }];
    db.getIssueById.mockResolvedValue(issue);
    db.listAnalyses.mockResolvedValue(history);
    const caller = appRouter.createCaller({ req: {}, res: {} } as never);
    await expect(caller.issues.get({ id: 2 })).resolves.toEqual({ issue, analysis: history });
    expect(db.listAnalyses).toHaveBeenCalledWith(2);
  });

  it("converts provider failures to an internal server error", async () => {
    db.getIssueById.mockResolvedValue({ id: 1, title: "Bug", description: "A reproducible bug", userId: 1 });
    ai.analyzeIssue.mockRejectedValue(new Error("provider unavailable"));
    const caller = appRouter.createCaller({ req: {}, res: {} } as never);
    await expect(caller.issues.analyze({ id: 1 })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(db.createAnalysis).not.toHaveBeenCalled();
  });
});
