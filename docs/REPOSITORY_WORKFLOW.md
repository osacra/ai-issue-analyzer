# Organização do repositório

## Estado atual

O repositório utiliza `main` como única branch remota ativa. Branches de trabalho são criadas para mudanças com escopo definido e removidas após integração, preservando os commits no histórico do Git.

No momento, não há Pull Requests abertas nem Issues abertas. As Issues históricas foram encerradas depois que seus respectivos escopos foram implementados, e continuam disponíveis para rastreabilidade. A PR #13 foi fechada como obsoleta porque o mesmo escopo de testes foi reaplicado sem conflitos e integrado pela PR #14.

## Labels

As labels operacionais utilizadas são `status:completed`, `status:obsolete`, `type:feature`, `type:chore`, `type:test` e `type:fix`. Elas distinguem trabalho concluído, itens obsoletos e a natureza de cada alteração.

## Fluxo recomendado

Para cada nova mudança, crie uma Issue pequena e objetiva, abra uma branch derivada de `main`, implemente com um commit Conventional Commit, execute os testes, abra uma Pull Request, revise o diff e faça o merge somente quando a branch estiver atualizada. Depois do merge, remova a branch remota e mantenha a Issue fechada com uma referência à PR integrada.

Esse fluxo evita branches abandonadas, reduz PRs duplicadas e mantém o histórico auditável sem reescrever commits já publicados.
