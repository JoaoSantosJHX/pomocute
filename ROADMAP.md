# Roadmap — Pomocute

**Status:** auditoria final do MVP em andamento na branch `audit/mvp-stabilization`; produção corresponde à `main` no commit `28c9fa3`

**Atualizado em:** 20/11/2026

**Princípio de priorização:** confiabilidade do foco e clareza de uso antes de expansão de escopo.

Este roadmap organiza o trabalho por resultados e critérios de saída, sem datas comprometidas. As etapas podem mudar após validar o app publicado e observar o uso. Consulte também [VISAO_PRODUTO.md](./VISAO_PRODUTO.md).

## Ciclo ativo — Consolidação do MVP

**Objetivo:** transformar os fluxos já existentes em uma base segura, consistente e verificável antes de expandir o produto.

**Consolidado na `main` pela PR #16 e publicado na Vercel:**

- Isolamento do cache de tarefas e links de música por conta, sem importar dados de visitante automaticamente no login.
- Sincronização idempotente por registro, com chave gerada no cliente e reconciliação de tentativas que falharam sem criar duplicatas.
- Renovação de sessão Supabase e tratamento correto do cadastro que exige confirmação de e-mail.
- Bloqueio da troca de modo enquanto uma sessão está em andamento.
- Foco preso no diálogo de conta/configurações, fechamento por Escape e indicador de foco visível para campos de tarefa e música.
- Migração versionada para chaves de sincronização, políticas RLS explícitas, permissões mínimas, índices por usuário e teste de isolamento entre contas.
- Cabeçalhos de segurança no Vercel, metadados básicos da página e pipeline de CI para testes e build.

**Auditoria final em andamento:**

- A produção está na `main` e no último deploy pronto da Vercel.
- A checagem do Supabase confirmou RLS e chaves únicas para tarefas e links de música. O histórico do Supabase CLI não registra migrações, então a aplicação da migração anterior foi verificada pelos objetos existentes, não pelo ledger.
- A auditoria identificou que sessões concluídas ainda não usam chave idempotente. A correção está isolada na branch `audit/mvp-stabilization` e requer uma migração adicional, ainda não aplicada.
- No projeto isolado `pomocute-staging`, a migração de sessões foi aplicada; `client_id` obrigatório e índice único foram confirmados. O teste RLS passou nas 10 asserções e reverteu seus dados fictícios com `ROLLBACK`.
- A produção foi conferida em desktop e nos viewports 390×844 e 320×568. Em 320×568, o painel de música ficava fora da tela; a correção na branch foi validada com cinco links e rolagem interna. Ainda falta publicar e validar em aparelho físico.

**Critério de saída:** os testes automatizados e o build passam; a migração de sessões é aplicada e comprovada em ambiente seguro; uma conta não acessa nem mistura os dados de outra; os fluxos críticos funcionam em desktop e mobile; a decisão de publicar a correção fica registrada.

## Fase 0 — Base confiável (concluída localmente)

**Objetivo:** tornar a experiência atual de timer, controles, contador e música clara e confiável.

**Concluída localmente em 19/10/2026:** implementação validada com seis testes automatizados, build de produção e conferência do fluxo em desktop. As regras e limitações técnicas estão registradas em [FASE_0.md](./FASE_0.md).

**Validação ainda pendente:** comparar a versão pública com a versão local e conferir os principais fluxos em produção e em telas móveis. A conclusão local não confirma, por si só, que a versão publicada está atualizada ou que todos os cenários reais foram validados.

- Conferir os estados do timer: pronto, focando, pausado, concluído e encerrado.
- Confirmar as ações de iniciar, pausar, retomar, resetar e encerrar.
- Verificar a contagem após troca de aba, recarga da página e suspensão do dispositivo.
- Confirmar quando o contador de sessões avança e como ocorre a transição entre foco e pausa.
- Conferir responsividade, acessibilidade dos controles e feedback visual e sonoro.
- Comparar a versão pública com a implementação local e registrar diferenças ou limitações.

**Critério de saída:** a versão pública corresponde ao comportamento validado localmente; uma pessoa consegue iniciar, pausar, retomar e concluir uma sessão; o tempo e o contador se comportam conforme definido em desktop e celular; os estados e próximos passos ficam claros.

## Próxima etapa — Ciclo Pomodoro e usabilidade

**Objetivo:** deixar o ciclo de foco e descanso fácil de entender e continuar, mantendo baixa a fricção para começar.

- Tornar evidentes o modo atual e a próxima etapa do ciclo.
- Confirmar as durações padrão e a transição entre foco, pausa curta e pausa longa.
- Definir se a próxima etapa começa manualmente ou automaticamente; manter o usuário informado e no controle.
- Permitir informar uma tarefa opcional sem exigir configuração antes de iniciar.
- Refinar a experiência de música existente: seleção e controle das faixas disponíveis, sem depender de novas integrações externas.
- Validar a interface em desktop e celular, incluindo o modo de foco compacto.
- Preservar a direção visual acolhedora que está sendo explorada: cenários Lo-fi e superfícies com efeito glassmorphism, mantendo contraste, legibilidade e controles acessíveis.

**Critério de saída:** usuários conseguem entender o estado do timer, completar mais de um ciclo e controlar a música sem perder o foco ou precisar reconfigurar a experiência a cada etapa. A interface continua utilizável em telas pequenas e grandes.

## Frente planejada — SEO e Aquisição Orgânica

**Prioridade:** iniciar depois de validar a versão pública e consolidar a experiência principal. Esta frente foi incluída no planejamento, sem compromisso de data ou execução imediata.

**Objetivo:** tornar o Pomocute mais fácil de encontrar em buscas e atrair pessoas interessadas em ferramentas de foco por canais orgânicos.

- Fazer um diagnóstico de indexação, estrutura das páginas, metadados, links e desempenho.
- Entender como o público procura timers Pomodoro e ferramentas de foco; priorizar termos e necessidades compatíveis com o produto.
- Melhorar títulos, descrições, hierarquia de conteúdo e dados técnicos de SEO nas páginas existentes.
- Criar conteúdo útil para as dúvidas e buscas identificadas, sem publicar páginas repetitivas ou conteúdo feito apenas para mecanismos de busca.
- Avaliar sitemap, robots, dados estruturados e ferramentas de acompanhamento de desempenho orgânico.
- Revisar velocidade, experiência móvel e métricas de experiência da página, considerando o impacto dos recursos visuais.
- Medir impressões, cliques, acessos orgânicos e início de sessões; estabelecer uma linha de base antes de definir metas.

**Diretriz de custo:** preservar a operação sem custo de hospedagem e priorizar ações orgânicas enquanto o produto valida sua experiência e aquisição. Não assumir investimento em anúncios ou novas ferramentas pagas sem evidência de retorno.

**Critério de saída:** páginas importantes podem ser indexadas e são tecnicamente acessíveis; as buscas priorizadas correspondem ao público e à proposta do Pomocute; o desempenho orgânico e sua contribuição para o início de sessões podem ser acompanhados com uma linha de base definida.

## Depois — Preferências e histórico simples

**Objetivo:** apoiar a continuidade de uso e ajudar a pessoa a perceber seu próprio progresso, com dados mínimos.

- Salvar preferências essenciais no dispositivo, como duração, som e faixa selecionada, se isso melhorar o retorno ao app.
- Avaliar um histórico simples de sessões concluídas e tempo focado.
- Definir claramente como sessões e preferências se comportam ao fechar ou recarregar a página.
- Considerar lembretes ou notificações somente após identificar uma necessidade real e oferecer controles claros.
- Avaliar uma experiência instalável como PWA se o uso recorrente justificar.

**Critério de saída:** preferências persistem de forma previsível; qualquer histórico é compreensível, útil e baseado apenas nos dados necessários.

## Futuro — Crescimento orientado por evidência

**Objetivo:** considerar expansões depois de validar o uso recorrente da experiência principal.

Possibilidades para pesquisa, sem compromisso de implementação:

- Relatórios de foco por dia ou semana.
- Sincronização entre dispositivos e conta opcional.
- Mais opções de paisagem sonora ou integração com serviços externos.
- Recursos para grupos, salas de estudo ou compartilhamento de progresso.
- Monetização compatível com a experiência e com os custos reais do produto.
- Aplicativo móvel nativo, se a experiência web não atender às necessidades identificadas.

**Critério de entrada:** problema do usuário documentado, benefício esperado claro, custos e manutenção avaliados e impactos sobre privacidade e direitos autorais compreendidos.

## Fora do plano atual

- Construir um gerenciador completo de tarefas e projetos.
- Adicionar competição, ranking ou sequências punitivas.
- Exigir conta antes da primeira sessão.
- Adicionar integração externa de música sem validar necessidade, permissões, direitos autorais e manutenção.
- Definir monetização antes de validar uso e custos do produto.

## Critérios transversais de conclusão

Uma entrega está pronta para usuários quando:

- o comportamento esperado está descrito e corresponde à interface;
- o fluxo funciona em telas pequenas e grandes;
- estados de erro, pausa e conclusão são compreensíveis;
- o timer considera o tempo real decorrido e não depende apenas de intervalos que podem ser interrompidos quando a aba fica inativa;
- interações principais funcionam por teclado e têm rótulos acessíveis;
- dados pessoais e permissões são minimizados;
- mudanças relevantes são verificadas localmente e na versão pública antes de serem consideradas concluídas.

## Como priorizar itens novos

Antes de adicionar um item, responder:

1. Qual dificuldade concreta do usuário ele resolve?
2. Em qual parte do ciclo de foco atua: começar, continuar ou concluir?
3. Como saberemos se ajudou?
4. Há uma forma mais simples de resolver?
5. Quais são os efeitos sobre complexidade, acessibilidade, privacidade, custo e manutenção?

## Revisão do roadmap

Revisar este documento quando uma etapa terminar, quando o feedback mudar a prioridade ou quando surgir uma dependência técnica relevante. Não atribuir datas até que escopo, capacidade de execução e critérios de validação estejam definidos.
