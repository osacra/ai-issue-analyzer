# AI Issue Analyzer

Aplicação full stack para registrar problemas de software, organizar um backlog técnico e gerar análises estruturadas com a Google Gemini API. O produto apresenta prioridade, severidade, área provável, causa, solução e testes sugeridos em uma interface objetiva.

## Overview

O fluxo principal é local e independente: React envia operações ao backend Node.js/Express através do contrato tRPC; o backend persiste issues e análises com Drizzle e chama diretamente a API da Google Gemini. A chave permanece exclusivamente no servidor.

## Funcionalidades

A aplicação permite criar, listar, consultar e excluir issues. Cada issue pode ser analisada sob demanda, mantendo um histórico de análises persistido e exibindo recomendações acionáveis na tela de detalhes.

## Stack

| Camada          | Tecnologia                                  |
| --------------- | ------------------------------------------- |
| Frontend        | React, TypeScript, Vite, Tailwind CSS       |
| Backend         | Node.js, Express, tRPC                      |
| Persistência    | MySQL/TiDB compatível com Drizzle ORM       |
| IA              | Google Gemini API via `GeminiProvider`      |
| Qualidade       | TypeScript strict, ESLint, Prettier, Vitest |
| Desenvolvimento | Docker Compose                              |

## Arquitetura

```text
React + tRPC client
        |
        v
Express /api/trpc
        |
        +--> Drizzle --> Database
        |
        +--> AIProvider --> GeminiProvider --> Google Gemini API
```

O contrato `AIProvider` isola o provedor de IA da camada de procedures. A resposta do modelo é solicitada em JSON estruturado e validada com Zod antes da persistência.

## Execução local

Requisitos: Node.js 20 ou superior, pnpm ou npm, Docker e uma chave da Google Gemini API.

```bash
git clone https://github.com/osacra/ai-issue-analyzer.git
cd ai-issue-analyzer
pnpm install
cp .env.example .env
```

Preencha o `.env`:

```env
GEMINI_API_KEY=sua_chave
GEMINI_MODEL=gemini-2.0-flash
DATABASE_URL=mysql://app:app@127.0.0.1:3306/ai_issue_analyzer
WORKSPACE_USER_ID=1
```

O projeto já pode ser validado usando o banco conectado ao ambiente de desenvolvimento. Por decisão aprovada para esta versão, a persistência permanece em MySQL/TiDB compatível com o ambiente conectado; não é necessária uma migração para PostgreSQL para executar a entrega atual. Para uma execução local independente, suba uma instância compatível e execute:

```bash
docker compose up -d
pnpm drizzle-kit migrate
pnpm dev
```

A interface ficará disponível no endereço local informado pelo servidor. Em uma instalação externa, configure `GEMINI_API_KEY` e `DATABASE_URL`; o banco conectado do ambiente não é necessário para quem executar o projeto localmente.

## API

As operações são expostas sob `/api/trpc` pelo adaptador tRPC.

| Operação         | Entrada                  | Resultado                               |
| ---------------- | ------------------------ | --------------------------------------- |
| `issues.list`    | Nenhuma                  | Lista de issues do workspace            |
| `issues.get`     | `{ id }`                 | Issue e histórico de análises           |
| `issues.create`  | `{ title, description }` | Issue criada                            |
| `issues.delete`  | `{ id }`                 | Exclusão da issue e análises vinculadas |
| `issues.analyze` | `{ id }`                 | Nova análise validada e persistida      |

Payloads inválidos são rejeitados antes da persistência. Issues ausentes retornam `NOT_FOUND` no contrato tRPC.

## Testes e qualidade

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

Os testes cobrem o contrato estruturado de análise, rejeição de respostas inválidas e configuração server-side da chave.

## Decisões de engenharia

A integração com o provedor foi mantida em `server/ai.ts`, evitando chamadas de IA nos componentes de interface ou diretamente na lógica de apresentação. A resposta é validada novamente no backend, mesmo usando schema no pedido ao modelo, porque entradas externas nunca devem ser consideradas confiáveis por padrão.

O workspace utiliza um identificador local configurável por `WORKSPACE_USER_ID`, o que mantém o escopo focado no produto de gestão de issues sem adicionar autenticação ao protótipo de portfólio. A escolha de MySQL/TiDB nesta versão foi aprovada para preservar compatibilidade com o banco conectado; PostgreSQL fica como evolução futura, não como requisito da execução atual. Timestamps são gerenciados pelo banco e o histórico não é sobrescrito quando uma nova análise é executada.

## Melhorias futuras

Entre as extensões naturais estão autenticação própria, múltiplos workspaces, filtros por prioridade, edição de issues, exportação de análises e suporte a providers adicionais que implementem `AIProvider`.

## Organização do repositório

O repositório mantém somente a branch remota `main` como linha de integração. As branches de trabalho já integradas foram removidas após o merge, preservando seus commits no histórico. A PR #13 foi fechada como obsoleta porque o mesmo escopo foi reaplicado e integrado pela PR #14. As Issues #1–#7 foram encerradas após a implementação correspondente; a Issue #8 registra a remoção das dependências proprietárias. No estado atual, não há Pull Requests nem Issues abertas.

## Autoria

Arthur Sacramento
