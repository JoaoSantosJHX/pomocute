# Roadmap — Pomocute

**Status:** proposta inicial, sem datas comprometidas  
**Atualizado em:** 19/10/2026  
**Princípio de priorização:** confiabilidade do foco antes de expansão de escopo.

Este roadmap organiza o trabalho por resultados e critérios de saída. As etapas podem mudar após inspeção do app, feedback de usuários e validação das hipóteses descritas em [`VISAO_PRODUTO.md`](./VISAO_PRODUTO.md).

## Fase 0 — Base confiável (concluída localmente)

**Objetivo:** fazer com que a experiência atual de timer, controles, contador e música seja clara e confiável.

**Conclusão em 19/10/2026:** implementação local validada com seis testes automatizados, build de produção e conferência do fluxo desktop. O responsável pelo produto informou que verificou a entrega e autorizou seguir. Regras, limitações e pendência de comparação com a versão publicada estão em [FASE_0.md](./FASE_0.md). Nenhuma publicação foi realizada.

- Conferir o comportamento real de cada recurso no app e no código.
- Definir estados do timer: pronto, focando, pausado, concluído e encerrado.
- Definir claramente as ações de iniciar, pausar, retomar e encerrar.
- Corrigir erros de contagem ao trocar de aba, atualizar a página ou voltar depois de algum tempo.
- Garantir que o contador de sessões só avance nas condições definidas.
- Revisar responsividade, acessibilidade dos controles e feedback visual/sonoro.
- Documentar limitações conhecidas e o comportamento esperado.

**Critério de saída:** uma pessoa consegue iniciar, pausar, retomar e concluir uma sessão; o tempo exibido permanece correto nos cenários suportados; os estados e próximos passos são compreensíveis.

## Próxima etapa — Ciclo Pomodoro claro

**Objetivo:** apoiar um ciclo completo de foco e descanso sem tornar a configuração um obstáculo.

- Definir duração padrão de foco e pausas.
- Implementar a transição entre foco, pausa curta e pausa longa, caso confirmada como prioridade.
- Permitir iniciar a próxima etapa manualmente; avaliar início automático após observar o uso.
- Oferecer personalização essencial das durações.
- Mostrar o estado atual e a próxima etapa de forma evidente.
- Permitir informar uma tarefa opcional para a sessão.

**Critério de saída:** usuários conseguem completar mais de um ciclo sem se confundir sobre o estado do timer ou precisar reconfigurar tudo a cada etapa.

## Depois — Preferências e continuidade

**Objetivo:** permitir que a pessoa retome o Pomocute de um jeito familiar e perceba seu próprio progresso.

- Salvar preferências de duração, som e música no dispositivo.
- Avaliar histórico simples de sessões concluídas e tempo focado.
- Definir como tratar dados em caso de fechamento ou recarga da página.
- Explorar lembretes e notificações somente se houver necessidade observada e opção clara de controle.
- Validar uma experiência de instalação como PWA ou equivalente, se o uso recorrente justificar.

**Critério de saída:** as preferências persistem como esperado, o histórico é compreensível e útil, e cada dado salvo tem propósito claro para o usuário.

## Futuro — Crescimento orientado por evidência

**Objetivo:** testar expansões somente depois de validar o uso recorrente da experiência principal.

Possibilidades para pesquisa, ainda sem compromisso de implementação:

- Sincronização entre dispositivos e conta opcional.
- Relatórios de foco por dia ou semana.
- Mais opções de paisagem sonora ou integração com serviços externos.
- Recursos para grupos, salas de estudo ou compartilhamento de progresso.
- Monetização compatível com a experiência e com custos reais do produto.
- Aplicativo móvel nativo, se a experiência web não atender às necessidades identificadas.

**Critério de entrada:** problema do usuário documentado, benefício esperado claro, custo e complexidade avaliados e impacto sobre privacidade e direitos autorais entendido.

## Fora do plano atual

- Construir um gerenciador completo de tarefas e projetos.
- Adicionar competição, ranking ou sequências punitivas.
- Criar conta obrigatória antes da primeira sessão.
- Integrar serviços externos sem validar necessidade, permissões e manutenção.

## Critérios transversais de conclusão

Uma entrega é considerada pronta para usuários quando:

- o comportamento esperado está descrito e corresponde à interface;
- o fluxo funciona em telas pequenas e grandes;
- estados de erro, pausa e conclusão são compreensíveis;
- o timer não depende apenas de contagens de intervalo que se perdem quando a aba fica inativa;
- as interações principais podem ser usadas por teclado e têm rótulos acessíveis;
- dados pessoais e permissões são minimizados;
- mudanças relevantes são verificadas no app antes de publicar.

## Como priorizar itens novos

Antes de adicionar um item, responder:

1. Qual dificuldade concreta do usuário ele resolve?
2. Em qual parte do ciclo de foco atua: começar, continuar ou concluir?
3. Como saberemos se ajudou?
4. Há uma forma mais simples de resolver?
5. Quais são os efeitos sobre complexidade, acessibilidade, privacidade, custo e manutenção?

## Revisão do roadmap

Revisar este documento quando uma etapa terminar, quando feedback mostrar que a prioridade mudou ou quando surgir uma dependência técnica relevante. Não atribuir datas até que escopo, capacidade de execução e critérios de validação estejam definidos.
