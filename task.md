# Tarefas: Migração Supabase & Vercel

- `[x]` Configurar conexões do banco de dados no Supabase e aplicar migrations (`prisma migrate`)
- `[x]` Adaptar backend NestJS para deployment Serverless na Vercel:
  - `[x]` Criar `backend/vercel.json`
  - `[x]` Criar `backend/api/index.ts` (Entrypoint Serverless)
  - `[x]` Atualizar `backend/prisma/schema.prisma` com `directUrl`
- `[x]` Implementar tempo real com Supabase Realtime no Frontend (substituindo Socket.io):
  - `[x]` Instalar `@supabase/supabase-js` no frontend
  - `[x]` Criar `frontend/src/lib/supabaseClient.ts`
  - `[x]` Adaptar escutas de notificações e atualizações da agenda no `frontend/src/app/dashboard/page.tsx`
- `[x]` Migrar uploads de fotos locais para Supabase Storage:
  - `[x]` Criar `StorageService` no backend com SDK do Supabase
  - `[x]` Atualizar controladores de upload de fotos de perfil no backend
- `[x]` Executar testes de build do frontend e backend para validação final
