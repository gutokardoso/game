# Ranking online com Supabase

## 1. Criar tabela
No Supabase, abra **SQL Editor** e execute o arquivo:

`supabase-ranking.sql`

## 2. Configurar variáveis na Vercel
Em **Vercel > Project > Settings > Environment Variables**, crie:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Esses valores ficam no Supabase em:

**Project Settings > API**

Use:
- Project URL
- anon public key

## 3. Rodar localmente
Crie um arquivo `.env` com base no `.env.example`.

Depois rode:

```bash
npm install
npm run dev
```

## 4. Publicar
Depois de configurar as variáveis na Vercel, publique normalmente.

O ranking será salvo online e compartilhado entre TV touch, celular e qualquer navegador.
