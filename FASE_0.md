# Fase 0 — Base confiável

**Status:** concluída localmente em 19/10/2026, após validação do responsável pelo produto.

## Comportamento definido

- Foco: 25 minutos; pausa curta: 5; pausa longa: 15. Valores existentes preservados.
- Estados: pronto, em andamento, pausado, concluído e encerrado.
- Pausar conserva milissegundos restantes; retomar cria um novo horário de término.
- Encerrar descarta a sessão incompleta, sem incrementar o contador.
- Só foco concluído incrementa o contador, uma vez. Pausas não contam.
- Conclusão permanece visível. Preparar a próxima etapa não inicia o relógio.
- Após cada quatro focos, sugere pausa longa. Outras conclusões de foco sugerem pausa curta.
- Troca de modo fica bloqueada durante sessão ativa ou pausada: encerre primeiro.
- Sessão e contador persistem localmente. Recarga e retorno reconciliam o horário real; não criam ciclos automáticos durante ausência.
- Música começa por ação explícita. Trocar trilha pausa a reprodução. Falhas têm mensagem e permitem tentar novamente.

## Limitações e verificação

- Sem sincronização entre abas ou dispositivos. Armazenamento bloqueado impede restauração.
- Mudanças manuais no relógio do sistema afetam o timer.
- Navegador/dispositivo suspenso pode atrasar o alerta sonoro; o tempo é corrigido no retorno. Som depende das permissões de reprodução.
- Rádios externas dependem de rede e disponibilidade do provedor.
- Comparação com versão publicada pendente: endereço e referência visual ainda não confirmados neste chat.
- O responsável pelo produto informou que verificou a entrega e autorizou seguir. A confirmação não detalhou os dispositivos e cenários conferidos.

## Validação em 19/10/2026

- Seis testes automatizados passaram.
- Build de produção compilou com sucesso.
- Navegador desktop: início, pausa e restauração após recarga conferidos.
- Instalação local via pnpm com --shamefully-hoist para compatibilidade com o ESLint do Create React App; package-lock.json preservado.
- Aceite do responsável pelo produto: “verifiquei, pode seguir”. Fase 0 encerrada para a entrega local; comparação com a versão publicada permanece pendente antes de publicar.
