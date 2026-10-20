# Visão de Produto — Pomocute

**Status:** rascunho estratégico v0.1  
**Atualizado em:** 19/10/2026  
**Responsável pelo produto:** João Hélio

## 1. Resumo

Pomocute é um aplicativo de foco baseado em sessões de trabalho e descanso, inspirado na técnica Pomodoro. Ele ajuda a pessoa a começar uma tarefa, permanecer nela por um período definido e perceber o progresso de cada sessão. O timer, o contador de sessões e o player de música dão suporte a esse fluxo.

A proposta é unir utilidade e uma apresentação acolhedora. O Pomocute deve tornar o foco mais acessível e agradável, sem transformar produtividade em cobrança.

## 2. Problema que queremos resolver

Muitas pessoas têm dificuldade para iniciar uma tarefa, manter a atenção e fazer pausas sem perder o ritmo. Ferramentas de produtividade podem parecer complexas, rígidas ou exigentes. Para uma sessão de foco simples, a pessoa precisa de um caminho curto e claro: escolher no que vai trabalhar, iniciar o timer e saber quando fazer uma pausa.

## 3. Público inicial

Pessoas que estudam, trabalham ou realizam projetos pessoais e procuram uma forma simples de organizar períodos de concentração. No início, o produto não será direcionado a uma profissão, faixa etária ou método de trabalho específico.

### Necessidade principal

> “Quero começar uma tarefa e me manter nela por um período, sem precisar configurar uma ferramenta complicada.”

## 4. Proposta de valor

**Pomocute transforma uma tarefa em uma sessão de foco simples, visual e agradável, com timer, acompanhamento das sessões e música em um só lugar.**

## 5. Princípios do produto

1. **Começar deve ser fácil:** o caminho até iniciar uma sessão precisa ser curto.
2. **O usuário mantém o controle:** iniciar, pausar, retomar, encerrar e ajustar devem ser compreensíveis.
3. **A interface acolhe, não cobra:** feedback e progresso devem incentivar sem culpa ou pressão.
4. **O timer é confiável:** mudanças de aba, suspensão do dispositivo e controles precisam respeitar o tempo real decorrido.
5. **Cada recurso deve apoiar o foco:** funcionalidades novas precisam servir à sessão ou à continuidade de uso.
6. **A experiência básica deve ser clara:** a pessoa deve entender o que está acontecendo sem tutorial obrigatório.

## 6. Experiência central

1. A pessoa escolhe ou informa a tarefa em que quer focar.
2. Define ou aceita a duração da sessão.
3. Inicia o timer e, se desejar, usa a música disponível.
4. Pausa, retoma ou encerra quando precisar.
5. Ao concluir, vê a sessão contabilizada e recebe uma indicação simples do próximo passo, como descansar ou iniciar outra sessão.

O fluxo deve continuar útil mesmo que a pessoa não informe uma tarefa ou não use música.

## 7. Escopo do produto

### Base já descrita para o Pomocute

- Timer de foco.
- Controles para iniciar e parar a sessão.
- Contador de sessões.
- Player de música.

Esta lista registra o estado funcional informado pelo responsável pelo produto. Antes de uma implementação, o chat técnico deve conferir o comportamento atual no código e no app publicado.

### Prioridades próximas a validar

- Diferenciar com clareza foco, pausa curta e pausa longa.
- Permitir configurar durações e preferências sem aumentar a fricção inicial.
- Associar uma sessão a uma tarefa, preservando o uso rápido sem tarefa.
- Garantir que o timer continue correto ao alternar de aba, atualizar a página ou retornar ao app.
- Tornar acessíveis os controles, estados e avisos do timer.

Esses itens são hipóteses de produto para avaliação, não funcionalidades já aprovadas ou existentes.

## 8. O que não é prioridade agora

- Substituir ferramentas completas de gerenciamento de projetos ou tarefas.
- Criar feeds sociais, competição entre usuários ou rankings.
- Adicionar gamificação que pressione o usuário a manter sequências.
- Exigir conta, cadastro ou configuração extensa antes da primeira sessão.
- Expandir para muitos recursos sem evidência de que ajudam as pessoas a concluir sessões.

## 9. Como avaliaremos o produto

A primeira validação deve responder se as pessoas conseguem iniciar e concluir sessões e se desejam voltar a usar o Pomocute.

### Métricas iniciais sugeridas

- **Ativação:** proporção de visitantes que iniciam uma primeira sessão.
- **Conclusão:** proporção de sessões iniciadas que chegam ao fim normalmente.
- **Retorno:** proporção de pessoas que iniciam outra sessão em outro dia.
- **Uso do fluxo:** frequência de pausa, retomada e encerramento antecipado, interpretada com contexto.
- **Qualidade percebida:** resposta curta à pergunta “O Pomocute ajudou você a focar nesta sessão?”.

Os números-alvo e a forma de coleta ainda precisam ser definidos. Coletar apenas dados necessários e não registrar o conteúdo de tarefas pessoais sem uma decisão explícita sobre privacidade.

## 10. Hipóteses a validar

- Uma experiência visual acolhedora diferencia o Pomocute de timers genéricos sem atrapalhar a clareza.
- Ter timer e música no mesmo fluxo melhora a experiência para parte do público.
- A pessoa prefere começar rapidamente e ajustar detalhes depois.
- O contador de sessões ajuda a perceber progresso sem precisar de relatórios extensos.

## 11. Decisões em aberto

- Qual identidade visual e tom de voz definem o “cute” do Pomocute?
- Quais durações serão padrão e quais opções de personalização estarão disponíveis?
- O que o controle “stop” deve fazer: pausar, encerrar ou oferecer as duas opções?
- A música é ambiente fornecido pelo Pomocute, player de links externos ou outra experiência? Quais são os limites de direitos autorais e disponibilidade?
- As tarefas e o histórico ficam apenas no dispositivo ou haverá sincronização entre dispositivos?
- O produto será gratuito, terá anúncios, recursos pagos ou outro modelo? Nenhuma monetização está definida neste documento.
- Qual será a plataforma prioritária e quais critérios justificam uma versão instalável ou móvel?
- Quais metas numéricas indicam que a primeira versão foi validada?

## 12. Regra para decisões futuras

Uma funcionalidade entra no plano quando melhora diretamente o início, a continuidade ou a conclusão das sessões, ou quando remove um problema comprovado. O roadmap organiza hipóteses por prioridade e dependência; não substitui validação nem representa compromisso de data.

## 13. Relação com o roadmap

Consulte [`ROADMAP.md`](./ROADMAP.md) para as etapas e critérios sugeridos. Mudanças de direção devem ser registradas aqui e refletidas no roadmap.
