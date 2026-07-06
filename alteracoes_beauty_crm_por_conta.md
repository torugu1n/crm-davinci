# Documento de alterações por tipo de conta — Beauty CRM

Este documento consolida as alterações recomendadas para a plataforma Beauty CRM com base nas telas analisadas do painel do profissional e do atendimento/WhatsApp.[cite:1][cite:2]

## Escopo analisado

As evidências observadas mostram pelo menos dois contextos funcionais já implementados: o painel do profissional, com foco em operação do dia, agenda, clientes do dia e configurações de perfil público; e o painel de atendimento, com foco em agenda, clientes, mensagens WhatsApp e atendimento do estabelecimento.[cite:1][cite:2]

A segmentação abaixo organiza o que deve ser alterado, expandido ou adicionado por tipo de conta, priorizando clareza operacional, gestão comercial e escalabilidade do SaaS para salões, barbearias e estética.[cite:1][cite:2]

## Conta do profissional

No perfil do profissional já existem foto, especialidade, mini bio e indicação de comissão ativa, o que é um bom início para exposição no portal e gestão interna.[cite:1] No entanto, o perfil ainda está incompleto para operação real do salão e para uma boa apresentação pública.[cite:1]

### Alterações recomendadas

- Adicionar telefone e WhatsApp profissional para contato interno e eventual uso controlado no portal.[cite:1]
- Adicionar grade semanal de trabalho com dias, horários de entrada, saída e intervalos para bloqueio automático da agenda.[cite:1]
- Vincular serviços executados por aquele profissional, evitando dependência de cadastro genérico do salão.[cite:1]
- Definir duração por serviço e possibilidade de tempo personalizado por atendimento.[cite:1]
- Incluir modo férias, folga e indisponibilidade temporária com bloqueio automático da agenda.[cite:1]
- Incluir histórico de comissões por período, com visão diária, semanal e mensal.[cite:1]
- Exibir total de atendimentos, ticket médio, taxa de retorno e avaliação média dos clientes para medir performance.[cite:1]
- Adicionar histórico completo de atendimentos, não apenas os do dia, com filtros por período, cliente e serviço.[cite:1]
- Incluir observações internas por cliente, para registrar preferências, restrições e recorrência.[cite:1]
- Adicionar configuração de notificações, alteração de senha e controles básicos de segurança da conta.[cite:1]

### Ajustes de UX/UI

- Separar melhor o que é perfil público do que é dado interno da operação, reduzindo mistura de contexto na mesma tela.[cite:1]
- Transformar a área de comissão em um bloco clicável com detalhamento, em vez de apenas exibir o percentual isolado.[cite:1]
- Exibir indicadores operacionais com mais contexto, como tempo estimado de espera, atrasos e próximo cliente.[cite:1]

## Conta de recepção ou atendimento

O painel de atendimento já mostra uma estrutura de operação voltada para WhatsApp, com lista de contatos, operador identificado como recepção e área de visualização e resposta das mensagens.[cite:2] Isso é relevante para centralizar a comunicação do estabelecimento, mas ainda faltam camadas importantes de produtividade, rastreabilidade e contexto comercial.[cite:2]

### Alterações recomendadas

- Mostrar status do atendimento por conversa, como novo contato, aguardando resposta, agendamento em andamento, confirmado, finalizado e perdido.[cite:2]
- Exibir dados rápidos do cliente ao lado da conversa, como última visita, profissional preferido, serviços recorrentes e total gasto.[cite:2]
- Criar botões rápidos para transformar conversa em agendamento, cadastro de cliente, retorno ou orçamento.[cite:2]
- Registrar histórico completo de interações por operador para auditoria e gestão da equipe.[cite:2]
- Adicionar filas por prioridade, etiquetas e filtros por unidade, profissional, origem e estágio do atendimento.[cite:2]
- Implementar modelos de mensagem, respostas rápidas e automações para confirmação, lembrete, reagendamento e pós-atendimento.[cite:2]
- Exibir SLA de atendimento, tempo médio de resposta e volume por operador.[cite:2]
- Permitir transferência de conversa entre atendentes com anotação interna.[cite:2]
- Integrar a conversa ao cadastro do cliente e ao histórico de agenda, para que a recepção atenda com contexto.[cite:2]
- Criar permissões para visualizar mensagens, responder, encerrar, transferir e acessar dados sensíveis.[cite:2]

### Ajustes de UX/UI

- Melhorar a hierarquia visual da lista de conversas, pois hoje os dados parecem densos e pouco separados entre nome, telefone e estado da conversa.[cite:2]
- Destacar melhor o operador ativo e o canal em uso para evitar erro operacional em ambientes com múltiplos atendentes.[cite:2]
- Diferenciar visualmente mensagem do cliente, mensagem do operador e mensagem interna do sistema.[cite:2]

## Conta do gestor ou dono do salão

As telas analisadas mostram módulos operacionais, mas ainda não evidenciam uma camada executiva forte para acompanhamento do negócio como um todo.[cite:1][cite:2] Para o gestor, a plataforma precisa consolidar visão financeira, operacional, comercial e de equipe em uma mesma experiência.[cite:1][cite:2]

### Alterações recomendadas

- Criar dashboard executivo com faturamento do dia, semana e mês, serviços mais vendidos, ocupação da agenda e ranking por profissional.[cite:1][cite:2]
- Incluir gestão de comissões com regras por profissional, serviço, pacote ou meta.[cite:1]
- Adicionar relatórios de cancelamento, no-show, recompra, retenção e origem dos clientes.[cite:1][cite:2]
- Criar gestão de permissões por perfil de acesso, limitando visualização de dados financeiros, mensagens e cadastros estratégicos.[cite:1][cite:2]
- Adicionar metas por período para recepção e profissionais, com acompanhamento de conversão e produtividade.[cite:1][cite:2]
- Incluir central de auditoria com logs de ações críticas, como exclusão, cancelamento, alteração de preço e edição de agenda.[cite:2]

### Ajustes de UX/UI

- Dar ao gestor uma navegação claramente diferente da navegação operacional, com visão consolidada e atalhos estratégicos.[cite:1][cite:2]
- Separar indicadores em blocos de operação, financeiro, equipe e clientes para reduzir ruído visual.[cite:1][cite:2]

## Conta do cliente

As telas observadas indicam que existe um portal de agendamentos online, já que o painel do profissional menciona personalização das informações visíveis aos clientes.[cite:1] Isso sugere a necessidade de fortalecer a experiência do cliente final para aumentar conversão e fidelização.[cite:1]

### Alterações recomendadas

- Exibir perfil do profissional com foto, especialidades, bio.
- Mostrar agenda disponível de forma clara, com duração do serviço e confirmação imediata.[cite:1]
- Permitir reagendamento e cancelamento dentro de regras configuráveis do estabelecimento.[cite:1]
- Criar área do cliente com histórico de atendimentos, serviços realizados e preferências salvas.[cite:1]
- Integrar lembretes automáticos por WhatsApp com confirmação de presença. (Isso será feito no módulo de atendimento, o follow up e lembrete de aniversario, feedback)
- Exibir promoções, combos e serviços recomendados com base no histórico do cliente.[cite:1][cite:2]

### Ajustes de UX/UI

- Deixar mais claro o valor diferencial de cada profissional no portal, evitando perfis muito genéricos.[cite:1]
- Garantir consistência entre o que a recepção vê e o que o cliente confirma no agendamento.[cite:1][cite:2]

## Itens transversais para todas as contas

Algumas mudanças não pertencem a apenas um perfil, porque impactam a experiência completa da plataforma e a consistência do produto.[cite:1][cite:2]

### Estrutura de produto

- Padronizar melhor os módulos por papel de usuário, evitando reaproveitamento confuso de layout ou conteúdo entre contas.[cite:1][cite:2]
- Criar trilha clara entre agenda, clientes, mensagens, serviços, financeiro e configurações.[cite:1][cite:2]
- Evoluir o sistema de permissões com RBAC por perfil, ação e unidade.[cite:1][cite:2]

### Dados e inteligência

- Centralizar cadastro único do cliente, conectando agenda, mensagens, atendimentos e financeiro.[cite:2]
- Criar timeline única por cliente com histórico completo de interações.[cite:2]
- Implementar métricas nativas de operação, vendas, retenção e produtividade.[cite:1][cite:2]

### Segurança e governança

- Adicionar trilhas de auditoria e logs de alteração sensíveis.[cite:2]
- Criar gestão de credenciais, troca de senha, sessões e permissões granulares.[cite:1][cite:2]
- Revisar nomenclaturas e segregação de acesso para evitar que telas de um papel apareçam com contexto de outro.[cite:1][cite:2]

## Priorização sugerida

| Prioridade | Conta | Alterações principais |
|---|---|---|
| Alta | Profissional | Grade semanal, serviços vinculados, duração por serviço, modo férias, histórico de comissões.[cite:1] |
| Alta | Recepção | Status da conversa, vínculo com agenda/clientes, respostas rápidas, filtros, transferência e histórico por operador.[cite:2] |
| Alta | Gestor | Dashboard executivo, permissões, relatórios de faturamento, metas e auditoria.[cite:1][cite:2] |
| Média | Cliente | Perfil público robusto, avaliações, reagendamento, histórico e lembretes automáticos.[cite:1][cite:2] |
| Média | Plataforma | Cadastro único do cliente, timeline unificada e padronização de módulos por perfil.[cite:1][cite:2] |

## Direção de evolução do produto

O produto já demonstra uma base funcional relevante, com agenda, operação do profissional e atendimento por WhatsApp integrados ao contexto do salão.[cite:1][cite:2] A próxima fase deve focar menos em telas isoladas e mais em consistência entre papéis, profundidade operacional e inteligência de gestão, porque isso é o que transforma a plataforma de um painel funcional em um sistema realmente robusto para salões, barbearias e estética.[cite:1][cite:2]
