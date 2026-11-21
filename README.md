# Pomocute

Um timer Pomodoro leve para sessões de foco, pausas, tarefas e música ambiente.

## Ambiente de desenvolvimento

**Pasta oficial de trabalho:** `C:\Dev\pomocute`

Todo desenvolvimento, teste, build e servidor local do Pomocute deve ser executado a partir dessa pasta. A cópia anterior em `C:\Users\onlyj\OneDrive\Documentos\Projetos GPT\Pomocute\pomocute` deve ser mantida apenas como contingência e não deve ser usada para desenvolvimento ativo, pois a sincronização do OneDrive pode tornar operações com Git, `node_modules` e builds mais lentas.


## Desenvolvimento local

```bash
npm ci
npm start
```

A aplicação abre em [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Crie um arquivo `.env.local` para habilitar conta e sincronização:

```
REACT_APP_SUPABASE_URL=https://SEU-PROJETO.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

A chave `anon` pode ser exposta no cliente quando Row Level Security estiver ativo. Nunca use nem publique uma chave `service_role` no navegador.

## Banco de dados e segurança

- Para um ambiente novo, execute [`supabase/schema.sql`](./supabase/schema.sql).
- Para um ambiente existente, aplique [`supabase/migrations/20261109_harden_mvp_sync_and_rls.sql`](./supabase/migrations/20261109_harden_mvp_sync_and_rls.sql) e depois [`supabase/migrations/20261120_idempotent_focus_sessions.sql`](./supabase/migrations/20261120_idempotent_focus_sessions.sql), primeiro em ambiente de teste.
- Em seguida, execute [`supabase/tests/rls_policies_test.sql`](./supabase/tests/rls_policies_test.sql) pelo runner de testes do Supabase. O teste verifica que uma conta não lê, altera ou remove dados de outra.

As migrações preservam os dados atuais e adicionam identificadores de sincronização estáveis a tarefas, links de música e sessões concluídas. A migração de sessões evita duplicatas quando a gravação é repetida após recarga ou falha de rede. As migrações devem estar aplicadas antes de publicar um cliente que use essas alterações.

## Verificação

```bash
npm test -- --watchAll=false
npm run build
```

O GitHub Actions executa esses dois comandos em pull requests e em mudanças na `main`. O Vercel cria uma prévia para revisão; a produção só deve receber a alteração depois da migração e da validação da prévia.

## Estrutura relevante

- `src/components/Timer.jsx`: ciclo do timer e controles de foco.
- `src/components/FloatingMiniTimer.jsx`: mini timer flutuante.
- `src/components/TasksButton.jsx` e `src/components/AudioPlayer.jsx`: dados locais e sincronização.
- `src/services/auth.js` e `src/services/data.js`: autenticação e acesso ao Supabase.
- `supabase/`: esquema, migrações e testes RLS.
