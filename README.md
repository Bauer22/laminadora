# Laminadora — Sistema de Gestão Industrial

Sistema completo para laminadora com Supabase + Vercel.

## Setup Supabase

1. Crie um projeto em supabase.com
2. SQL Editor → cole o conteúdo de `supabase/schema.sql` → Run
3. Authentication → Users → crie os usuários

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

## Deploy Vercel

1. Suba o projeto no GitHub
2. Importe no vercel.com
3. Configure as variáveis de ambiente no painel do Vercel
4. Deploy automático a cada push

## Rodar localmente

```bash
npm install
npm run dev
```
