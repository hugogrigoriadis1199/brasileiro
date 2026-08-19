# Meu Campeonato Cartola

## Configurar o Neon

1. No painel do Neon, abra o **SQL Editor**.
2. Execute todo o conteúdo de [`schema.sql`](schema.sql).
3. Copie a connection string do banco em **Connect**.
4. Configure essa string como `DATABASE_URL` no ambiente do deploy. Não coloque a senha dentro do HTML nem a comite no Git.
5. Instale as dependências com `npm install` e publique o projeto em uma plataforma que suporte funções Node na pasta `api` (por exemplo, Vercel).

O frontend chama `/api/caregar` para carregar os dados e `/api/salvar` para salvar participantes, rodadas e pontos. A view `general_ranking` calcula a soma geral diretamente no PostgreSQL.

Para testar localmente, defina `DATABASE_URL` no ambiente antes de iniciar um servidor compatível com as funções da pasta `api`.