import { z } from "zod";

export const issueAnalysisSchema = z.object({
  category: z.string().min(1).max(80),
  priority: z.enum(["low", "medium", "high", "critical"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  area: z.string().min(1).max(120),
  summary: z.string().min(1),
  possibleCause: z.string().min(1),
  suggestedSolution: z.string().min(1),
  suggestedTests: z.array(z.string().min(1)).min(1).max(8),
});

export type IssueInput = { title: string; description: string };
export type IssueAnalysis = z.infer<typeof issueAnalysisSchema>;
export interface AIProvider {
  analyzeIssue(input: IssueInput): Promise<IssueAnalysis>;
}

const responseSchema = {
  type: "OBJECT",
  properties: {
    category: { type: "STRING" },
    priority: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
    severity: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
    area: { type: "STRING" },
    summary: { type: "STRING" },
    possibleCause: { type: "STRING" },
    suggestedSolution: { type: "STRING" },
    suggestedTests: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "category",
    "priority",
    "severity",
    "area",
    "summary",
    "possibleCause",
    "suggestedSolution",
    "suggestedTests",
  ],
};

export class GeminiProvider implements AIProvider {
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  async analyzeIssue(input: IssueInput): Promise<IssueAnalysis> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY is not configured");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "Você é um analista sênior de software. Responda em português do Brasil com recomendações objetivas.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analise esta issue e retorne somente o JSON solicitado.\nTítulo: ${input.title}\nDescrição: ${input.description}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });
    if (!response.ok)
      throw new Error(
        `Gemini API request failed with status ${response.status}`
      );
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini API returned an empty response");
    return issueAnalysisSchema.parse(JSON.parse(text));
  }
}

export const aiProvider: AIProvider = new GeminiProvider();
