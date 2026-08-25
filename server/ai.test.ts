import { describe, expect, it } from "vitest";
import { issueAnalysisSchema } from "./ai";

describe("issueAnalysisSchema", () => {
  it("accepts a complete structured analysis", () => {
    const result = issueAnalysisSchema.parse({
      category: "Bug",
      priority: "high",
      severity: "medium",
      area: "Autenticação",
      summary: "O fluxo não trata credenciais inválidas.",
      possibleCause: "A resposta 401 não é convertida em estado de erro.",
      suggestedSolution: "Tratar explicitamente respostas 401.",
      suggestedTests: ["Login com senha inválida"],
    });
    expect(result.priority).toBe("high");
  });

  it("rejects invalid priorities and empty recommendations", () => {
    const result = issueAnalysisSchema.safeParse({
      category: "Bug",
      priority: "urgent",
      severity: "medium",
      area: "Auth",
      summary: "Resumo",
      possibleCause: "Causa",
      suggestedSolution: "Solução",
      suggestedTests: [],
    });
    expect(result.success).toBe(false);
  });
});
