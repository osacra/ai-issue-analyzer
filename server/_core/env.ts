export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  workspaceUserId: Number(process.env.WORKSPACE_USER_ID ?? 1),
  isProduction: process.env.NODE_ENV === "production",
};
