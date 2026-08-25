import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { aiProvider, issueAnalysisSchema } from "./ai";
import { createAnalysis, createIssue, deleteIssue, getIssueById, listAnalyses, listIssues } from "./db";
import { publicProcedure, router } from "./_core/trpc";

const issueInput = z.object({ title: z.string().trim().min(3).max(160), description: z.string().trim().min(10).max(10000) });
const workspaceUserId = Number(process.env.WORKSPACE_USER_ID ?? 1);

export const appRouter = router({
  issues: router({
    list: publicProcedure.query(() => listIssues(workspaceUserId)),
    get: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const issue = await getIssueById(input.id, workspaceUserId);
      if (!issue) throw new TRPCError({ code: "NOT_FOUND", message: "Issue não encontrada." });
      return { issue, analysis: await listAnalyses(issue.id) };
    }),
    create: publicProcedure.input(issueInput).mutation(({ input }) => createIssue({ ...input, userId: workspaceUserId })),
    delete: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      if (!(await deleteIssue(input.id, workspaceUserId))) throw new TRPCError({ code: "NOT_FOUND", message: "Issue não encontrada." });
      return { success: true } as const;
    }),
    analyze: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const issue = await getIssueById(input.id, workspaceUserId);
      if (!issue) throw new TRPCError({ code: "NOT_FOUND", message: "Issue não encontrada." });
      try {
        const result = issueAnalysisSchema.parse(await aiProvider.analyzeIssue(issue));
        return createAnalysis({ ...result, issueId: issue.id, suggestedTests: JSON.stringify(result.suggestedTests) });
      } catch (error) {
        console.error("[AI] Analysis failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível analisar a issue agora." });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
