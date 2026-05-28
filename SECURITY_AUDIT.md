# Auditoria de Seguranca - CRM Da Vinci

Data: 2026-05-28

Escopo: revisao estatica do backend NestJS/Prisma e frontend Next.js, com foco em vazamento de dados sensiveis, rotas de API, autenticacao/autorizacao, multi-tenant, SQL injection, enumeracao e configuracoes inseguras.

## Resumo Executivo

O risco principal do projeto nao esta em SQL injection direto. O acesso ao banco usa Prisma ORM e nao foram encontrados usos de `$queryRaw`, `$executeRaw`, `queryRawUnsafe` ou equivalentes inseguros em `backend/src` e `backend/prisma`.

Os riscos mais relevantes estao em:

- Endpoints destrutivos ou sensiveis expostos com chaves padrao ou protecao opcional.
- Vazamento de hashes de senha em respostas de API.
- Escalada de privilegio por `ADMIN` comum criando/alterando usuarios com roles privilegiadas.
- Login de cliente sem prova forte de posse do telefone.
- Rotas publicas expondo agenda, dados financeiros e dados pessoais.
- WebSocket sem autenticacao e broadcast global.
- Isolamento multi-tenant fragil em rotas publicas.
- Falta de rate limiting em pontos de enumeracao e abuso.

## Achados Criticos

### 1. Endpoint de seed pode apagar dados com chave padrao

Evidencia:

- `backend/src/auth/auth.controller.ts:23`
- `backend/src/auth/auth.controller.ts:32`
- `backend/src/auth/auth.service.ts:142`

`POST /auth/seed-demo?key=davinciseed` usa chave padrao quando `DEMO_SEED_KEY` nao esta definido. O servico chamado executa limpeza ampla de tabelas.

Impacto: perda total de dados em ambiente exposto ou producao mal configurada.

Recomendacao:

- Remover o endpoint do build de producao.
- Exigir autenticacao `SUPER_ADMIN`, chave forte obrigatoria e confirmacao fora de query string.
- Nunca manter fallback como `davinciseed`.

### 2. Hash de senha vaza nas APIs de usuarios

Evidencia:

- `backend/src/users/users.service.ts:29`
- `backend/src/users/users.service.ts:41`
- `backend/src/users/users.service.ts:51`

`findAll` e `findOne` retornam objetos `User` completos, incluindo `senha`, porque nao usam `select` nem removem o campo antes de retornar.

Impacto: qualquer `ADMIN` ou `SUPER_ADMIN` com acesso a `/users` recebe hashes bcrypt dos usuarios do tenant.

Recomendacao:

- Usar `select` explicito sem `senha`.
- Criar DTO de resposta para usuario.
- Adicionar teste garantindo que `senha` nunca aparece em JSON de resposta.

### 3. ADMIN comum pode criar ou editar usuario como SUPER_ADMIN

Evidencia:

- `backend/src/users/users.controller.ts:8`
- `backend/src/users/users.service.ts:59`
- `backend/src/users/users.service.ts:99`

O controller permite `ADMIN` e `SUPER_ADMIN`. O service aceita `role` e `roles` do body sem validar se o ator pode conceder esses papeis.

Impacto: escalada direta de privilegio.

Recomendacao:

- Somente `SUPER_ADMIN` pode conceder/remover `SUPER_ADMIN`.
- Validar roles contra allowlist por ator.
- Impedir usuarios de tenant comum de criar usuarios sem `tenantId`.

### 4. Login de cliente usa nome + telefone e permite takeover por ultimos 8 digitos

Evidencia:

- `backend/src/auth/auth.controller.ts:18`
- `backend/src/auth/auth.service.ts:69`
- `backend/src/auth/auth.service.ts:92`

`POST /auth/client` emite JWT sem senha, OTP ou prova de posse do telefone. A associacao procura clientes pelos ultimos 8 digitos do telefone.

Impacto: enumeracao e tomada de conta de cliente com conhecimento parcial do telefone.

Recomendacao:

- Usar OTP por WhatsApp/SMS ou magic link.
- Buscar por telefone normalizado completo e tenant, nao por sufixo.
- Aplicar rate limit por IP, telefone e tenant.
- Retornar mensagens genericas para evitar enumeracao.

### 5. Webhook do WhatsApp fica publico se segredo nao estiver definido

Evidencia:

- `backend/src/whatsapp/whatsapp.controller.ts:33`
- `backend/src/whatsapp/whatsapp.controller.ts:35`

A validacao so ocorre se `WEBHOOK_SECRET_KEY` existir.

Impacto: atacante pode simular eventos da Evolution API, criar leads, inserir mensagens e acionar fluxos do chatbot.

Recomendacao:

- Tornar `WEBHOOK_SECRET_KEY` obrigatorio em qualquer ambiente exposto.
- Preferir assinatura HMAC do payload em header.
- Adicionar rate limiting e validacao de schema do webhook.

### 6. WebSocket sem autenticacao e broadcast global

Evidencia:

- `backend/src/websocket/websocket.gateway.ts:9`
- `backend/src/websocket/websocket.gateway.ts:22`

O gateway aceita qualquer origem e emite eventos para todos os sockets conectados.

Impacto: vazamento em tempo real de agendamentos, mensagens, clientes e notificacoes entre sessoes e possivelmente tenants.

Recomendacao:

- Autenticar socket com JWT no handshake.
- Associar conexoes a tenant e salas.
- Emitir eventos por sala de tenant/usuario, nunca broadcast global.
- Aplicar allowlist de origem.

## Achados Altos

### 7. CORS aberto com credenciais

Evidencia:

- `backend/src/main.ts:42`
- `backend/src/main.ts:43`
- `backend/src/main.ts:44`

`origin: '*'` com `credentials: true` e politica ampla.

Impacto: aumenta superficie de abuso cross-origin e dificulta controle de clientes autorizados.

Recomendacao:

- Configurar allowlist de dominios por ambiente.
- Remover `credentials: true` se nao houver cookies/autenticacao por credenciais.

### 8. Tenant pode ser controlado por header em rotas publicas

Evidencia:

- `backend/src/auth/tenant.decorator.ts:24`
- `backend/src/auth/tenant.decorator.ts:25`
- `backend/src/auth/tenant.decorator.ts:26`

O fallback aceita `x-tenant-id` ou `x-tenant-subdomain` diretamente da requisicao.

Impacto: em rotas publicas, o cliente escolhe o tenant consultado, facilitando enumeracao e acesso cruzado a dados publicos ou semipublicos.

Recomendacao:

- Resolver tenant por dominio/subdominio validado pelo middleware.
- Aceitar `x-tenant-id` apenas para `SUPER_ADMIN` autenticado.
- Nunca tratar `x-tenant-subdomain` como ID.

### 9. Rotas publicas expoem dashboard de profissional com PII e financeiro

Evidencia:

- `backend/src/barbers/barbers.controller.ts:68`
- `backend/src/barbers/barbers.service.ts:208`
- `backend/src/barbers/barbers.service.ts:241`

`GET /barbers/:id/dashboard` nao exige autenticacao e retorna agenda do dia com cliente, faturamento, comissao e metricas.

Impacto: vazamento de dados pessoais e financeiros.

Recomendacao:

- Exigir `JwtAuthGuard` e role apropriada.
- Para rotas publicas, criar DTO separado sem clientes, faturamento ou comissoes.

### 10. Agenda e bloqueios de profissionais sao publicos

Evidencia:

- `backend/src/barbers/barbers.controller.ts:17`
- `backend/src/barbers/barbers.controller.ts:73`
- `backend/src/barbers/barbers.controller.ts:85`

Rotas de bloqueios e horarios nao exigem autenticacao.

Impacto: exposicao de operacao interna, indisponibilidades, folgas e padroes de agenda.

Recomendacao:

- Separar disponibilidade publica minima de agenda interna.
- Proteger bloqueios administrativos com autenticacao.

### 11. Cliente autenticado consegue editar campos internos do CRM

Evidencia:

- `backend/src/clients/clients.controller.ts:34`
- `backend/src/clients/clients.service.ts:82`
- `backend/src/clients/clients.service.ts:84`
- `backend/src/clients/clients.service.ts:85`
- `backend/src/clients/clients.service.ts:89`

Cliente pode atualizar o proprio registro e o service aceita campos como `observacoes`, `frequency`, `ticketMedio`, `chatStatus`, `tags` e `assignedBarberId`.

Impacto: manipulacao de metricas, status, tags internas e profissional atribuido.

Recomendacao:

- DTO separado para autoatendimento do cliente.
- Permitir ao cliente alterar apenas campos publicos: nome, email, aniversario/preferencias permitidas.
- Restringir campos internos a `ADMIN`/`ATTENDANT`.

### 12. Agendamento permite alteracoes insuficientemente restritas por cliente

Evidencia:

- `backend/src/appointments/appointments.controller.ts:23`
- `backend/src/appointments/appointments.service.ts:162`
- `backend/src/appointments/appointments.service.ts:211`

O cliente e autenticado, mas nao ha `@Roles` nas rotas de create/update. A restricao de cliente so bloqueia mudanca de status diferente de `CANCELLED`; nao bloqueia alteracao de data, profissional ou servico do proprio agendamento.

Impacto: cliente pode modificar agendamento proprio alem do fluxo esperado.

Recomendacao:

- Criar endpoints separados: cliente cria/cancela/remarca com regras explicitas; staff administra.
- Validar transicoes de status por role.
- Validar disponibilidade e conflitos de agenda.

### 13. Servicos e produtos publicos expoem comissoes

Evidencia:

- `backend/src/services/services.service.ts:8`
- `backend/src/services/services.service.ts:22`
- `backend/src/products/products.service.ts:8`
- `backend/src/products/products.service.ts:12`

Listagens publicas retornam `customCommissions`.

Impacto: catalogo publico pode vazar remuneracao/comissao interna.

Recomendacao:

- Criar DTO publico para catalogo sem comissoes.
- Proteger comissoes por role administrativa.

### 14. Upload valida extensao, aceita SVG e serve arquivo publicamente

Evidencia:

- `backend/src/tenants/tenants.controller.ts:27`
- `backend/src/tenants/tenants.controller.ts:28`
- `backend/src/main.ts:38`

O upload valida pelo nome original e permite SVG. Arquivos sao servidos em `/uploads`.

Impacto: risco de XSS via SVG e upload de conteudo disfarçado.

Recomendacao:

- Validar MIME e assinatura real do arquivo.
- Remover SVG ou sanitizar SVG rigorosamente.
- Definir limite de tamanho.
- Servir uploads com headers seguros, como `Content-Disposition` quando aplicavel.

### 15. JWT armazenado em localStorage

Evidencia:

- `frontend/src/store/useStore.ts:62`
- `frontend/src/store/useStore.ts:76`

Tokens sao persistidos em `localStorage`.

Impacto: qualquer XSS no frontend rouba sessao.

Recomendacao:

- Preferir cookie `HttpOnly`, `Secure`, `SameSite`.
- Se continuar com bearer token, reduzir expiracao e endurecer CSP.

## Achados Medios

### 16. JWT tem segredo padrao e expiracao longa

Evidencia:

- `backend/src/auth/auth.module.ts:13`
- `backend/src/auth/auth.module.ts:26`
- `backend/src/auth/jwt.strategy.ts:7`

Existe segredo padrao fora de producao e token expira em 7 dias.

Impacto: ambientes de staging/dev expostos ficam vulneraveis a token forjado se usarem segredo padrao.

Recomendacao:

- Exigir `JWT_SECRET` em qualquer ambiente nao-local.
- Reduzir expiracao do access token.
- Adicionar refresh token rotacionado se necessario.

### 17. Falta rate limiting em pontos de abuso

Evidencia:

- Nao foi encontrado modulo/guard de throttle.
- Rotas afetadas incluem `/auth/login`, `/auth/client`, `/whatsapp/webhook`, `/feedbacks`.

Impacto: brute force, enumeracao, spam e DoS logico.

Recomendacao:

- Adicionar `@nestjs/throttler`.
- Aplicar limites por IP, usuario, telefone e tenant.
- Registrar tentativas suspeitas.

### 18. Feedback publico depende apenas de appointmentId

Evidencia:

- `backend/src/feedbacks/feedbacks.controller.ts:19`
- `backend/src/feedbacks/feedbacks.service.ts:28`
- `backend/src/feedbacks/feedbacks.service.ts:31`

Qualquer pessoa com ID de agendamento pode enviar feedback, sem token assinado ou validade temporal.

Impacto: fraude de avaliacao e alteracao de nota media.

Recomendacao:

- Gerar token assinado por feedback com expiracao.
- Validar que agendamento esta `COMPLETED`.
- Associar token ao appointment e impedir reuso.

### 19. Logs podem conter PII e payloads externos completos

Evidencia:

- `backend/src/whatsapp/whatsapp.service.ts:141`
- `backend/src/whatsapp/whatsapp.service.ts:182`

Webhook loga payload completo e conteudo de mensagens.

Impacto: telefone, mensagens e metadados sensiveis podem ir para logs.

Recomendacao:

- Redigir telefone, mensagens e tokens.
- Usar logs estruturados com niveis e redaction.

### 20. Credencial padrao no Docker Compose

Evidencia:

- `docker-compose.yml:8`
- `docker-compose.yml:10`

Senha `davincisecret` esta versionada no compose.

Impacto: aceitavel apenas para desenvolvimento local; perigoso se reutilizado em deploy.

Recomendacao:

- Usar `.env.example` sem segredo real.
- Parametrizar senha via variavel de ambiente.

## Observacoes Sobre SQL Injection

Nao foram encontrados usos de SQL raw inseguros:

- Sem `$queryRaw`.
- Sem `$executeRaw`.
- Sem `queryRawUnsafe`.
- Sem `executeRawUnsafe`.
- Sem `Prisma.raw`.

O uso de Prisma reduz o risco de SQL injection direto. Ainda assim, ha varios pontos com `any`, `parseFloat`, `parseInt` e IDs recebidos do body sem DTOs ou allowlists. O risco pratico maior e abuso de logica/autorizacao, nao injecao SQL.

## Prioridade de Correcao Recomendada

1. Desabilitar ou proteger fortemente `/auth/seed-demo`.
2. Tornar webhook e WebSocket autenticados e isolados por tenant.
3. Remover `senha` de todas as respostas de usuario.
4. Impedir `ADMIN` comum de conceder `SUPER_ADMIN`.
5. Substituir login de cliente por OTP ou magic link.
6. Proteger rotas de dashboard, agenda e bloqueios internos.
7. Separar DTOs publicos e internos para clientes, servicos, produtos e profissionais.
8. Corrigir resolucao de tenant para nao aceitar headers nao autenticados.
9. Adicionar rate limiting em auth, webhook e feedback.
10. Endurecer CORS, uploads, JWT e armazenamento de sessao.

## Checklist Tecnico de Hardening

- [ ] Criar DTOs com `class-validator` para todos os bodies.
- [ ] Remover `any` em controllers sensiveis.
- [ ] Usar `select` explicito em todas as respostas com `User`.
- [ ] Adicionar testes garantindo ausencia de `senha` em respostas.
- [ ] Criar matriz de permissoes por role.
- [ ] Aplicar guards em endpoints internos de agenda/dashboard.
- [ ] Criar DTO publico de catalogo sem comissoes.
- [ ] Criar DTO publico de profissional sem dados financeiros.
- [ ] Usar salas WebSocket por tenant/usuario.
- [ ] Validar tenant apenas por dominio confiavel ou usuario autenticado.
- [ ] Adicionar `@nestjs/throttler`.
- [ ] Remover segredos padrao fora de ambiente local.
- [ ] Validar upload por MIME, assinatura e tamanho.
- [ ] Remover SVG de uploads ou sanitizar.
- [ ] Redigir PII em logs.
