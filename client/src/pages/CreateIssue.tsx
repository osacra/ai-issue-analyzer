import { FormEvent, useState } from "react";
import { ArrowLeft, Bug, Loader2, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CreateIssue() {
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const create = trpc.issues.create.useMutation({
    onSuccess: issue => {
      toast.success("Issue criada com sucesso");
      navigate(`/issues/${issue?.id}`);
    },
    onError: error => toast.error(error.message),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({ title, description });
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/">
          <div className="brand">
            <span className="brand-icon">
              <Bug size={17} />
            </span>
            <span>
              issue<span className="brand-accent">lens</span>
            </span>
          </div>
        </Link>
      </header>
      <main className="container narrow page-space">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Voltar ao dashboard
        </Link>
        <div className="form-intro">
          <p className="eyebrow">NEW ISSUE</p>
          <h1>Registre um problema.</h1>
          <p className="muted">
            Inclua contexto suficiente para que a análise seja objetiva e
            acionável.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Contexto do problema</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="form-stack">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Ex.: Login não funciona com senha inválida"
                  minLength={3}
                  maxLength={160}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Descreva o comportamento observado, o resultado esperado e como reproduzir..."
                  minLength={10}
                  maxLength={10000}
                  required
                  rows={8}
                />
                <span className="field-hint">
                  {description.length}/10.000 caracteres
                </span>
              </div>
              <div className="form-note">
                <Sparkles size={17} />
                <span>
                  A IA vai classificar prioridade, severidade, área provável e
                  sugerir próximos passos.
                </span>
              </div>
              <div className="form-actions">
                <Link href="/">
                  <Button type="button" variant="ghost">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : null}
                  {create.isPending ? "Salvando..." : "Criar issue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
