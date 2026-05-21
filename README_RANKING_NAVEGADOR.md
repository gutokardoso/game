# Ranking no navegador

Esta versão voltou para o ranking local no navegador usando `localStorage`.

## Como funciona

- O ranking fica salvo no próprio navegador/dispositivo.
- Não precisa configurar Supabase, MySQL, API ou variáveis de ambiente.
- Funciona imediatamente ao publicar na Vercel.

## Importante

Como é ranking local:
- cada celular/TV terá seu próprio ranking;
- se limpar o cache do navegador, o ranking é apagado;
- não sincroniza automaticamente entre dispositivos diferentes.

Para eventos com ranking compartilhado entre TV e celulares, use uma versão com banco online.
