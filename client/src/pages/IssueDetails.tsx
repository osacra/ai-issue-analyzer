import { useMemo } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  Check,
  Clock3,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const labels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
} as const;
export default function IssueDetails() {
  const [, params] = useRoute("/issues/:id");
  const id = Number(params?.id);
  const utils = trpc.useUtils();
  const detail = trpc.issues.get.useQuery(
    { id },
    { enabled: Number.isInteger(id) }
  );
  const analyze = trpc.issues.analyze.useMutation({
    onSuccess: () => {
      toast.success("Análise concluída");
      utils.issues.get.invalidate({ id });
      utils.issues.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const latest = detail.data?.analysis?.[0];
  const tests = useMemo(() => {
    try {
      return latest ? (JSON.parse(latest.suggestedTests) as string[]) : [];
    } catch {
      return [];
    }
  }, [latest]);
  if (detail.isLoading)
    return (
      <div className="screen-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (detail.isError || !detail.data)
    return (
      <div className="screen-center">
        <ShieldAlert size={24} />
        <p>Issue não encontrada.</p>
        <Link href="/">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  const { issue } = detail.data;
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/">
          <div className="brand">
            <span className="brand-icon">
              <BrainCircuit size={17} />
            </span>
            <span>
              issue<span className="brand-accent">lens</span>
            </span>
          </div>
        </Link>
        <Link href="/" className="header-link">
          Dashboard
        </Link>
      </header>
      <main className="container narrow page-space">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Todas as issues
        </Link>
        <section className="detail-heading">
          <div>
            <p className="eyebrow">
              ISSUE #{String(issue.id).padStart(3, "0")}
            </p>
            <h1>{issue.title}</h1>
            <p className="muted">
              Criada em {new Date(issue.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <Badge
            className={
              issue.status === "analyzed" ? "status-analyzed" : "status-open"
            }
          >
            {issue.status === "analyzed" ? "Analisada" : "Aberta"}
          </Badge>
        </section>
        <Card className="description-card">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="description-text">{issue.description}</p>
          </CardContent>
        </Card>
        <div className="analysis-header">
          <div>
            <p className="eyebrow">INSIGHT ENGINE</p>
            <h2>Análise inteligente</h2>
          </div>
          <Button
            onClick={() => analyze.mutate({ id })}
            disabled={analyze.isPending}
          >
            {analyze.isPending ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <BrainCircuit size={17} />
            )}
            {analyze.isPending
              ? "Analisando..."
              : latest
                ? "Executar nova análise"
                : "Analisar com IA"}
          </Button>
        </div>
        {analyze.isPending ? (
          <Card>
            <CardContent>
              <div className="analysis-loading">
                <Loader2 className="animate-spin" />
                <div>
                  <strong>Investigando o contexto da issue...</strong>
                  <p className="muted">
                    Classificando sinais e preparando recomendações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : latest ? (
          <div className="analysis-content">
            <div className="analysis-tags">
              <Card>
                <CardContent>
                  <span className="stat-label">Categoria</span>
                  <strong>{latest.category}</strong>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <span className="stat-label">Prioridade</span>
                  <strong>{labels[latest.priority]}</strong>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <span className="stat-label">Severidade</span>
                  <strong>{labels[latest.severity]}</strong>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <span className="stat-label">Área provável</span>
                  <strong>{latest.area}</strong>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent>
                <div className="analysis-copy">
                  <div>
                    <span className="copy-label">Resumo</span>
                    <p>{latest.summary}</p>
                  </div>
                  <div>
                    <span className="copy-label">Possível causa</span>
                    <p>{latest.possibleCause}</p>
                  </div>
                  <div>
                    <span className="copy-label">Solução sugerida</span>
                    <p>{latest.suggestedSolution}</p>
                  </div>
                  <div>
                    <span className="copy-label">Testes sugeridos</span>
                    <ul>
                      {tests.map(test => (
                        <li key={test}>
                          <Check size={15} />
                          {test}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="history">
              <span className="copy-label">
                <Clock3 size={14} /> Histórico de análises
              </span>
              <p className="muted small">
                {detail.data.analysis.length} análise(s) persistida(s). Última
                execução em {new Date(latest.createdAt).toLocaleString("pt-BR")}
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="empty-state compact">
            <BrainCircuit size={25} />
            <h3>Pronta para investigar</h3>
            <p>
              Execute uma análise para obter contexto técnico e próximos passos.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
