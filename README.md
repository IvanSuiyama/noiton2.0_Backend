# noiton2.0_Backend

Backend Node.js + TypeScript + PostgreSQL (Neon)

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/IvanSuiyama/noiton2.0_Backend.git
   cd noiton2.0_Backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

## Configuração

- Crie um arquivo `.env` (opcional) para variáveis de ambiente, como porta ou segredos JWT.
- Configure a URL do banco de dados em `src/config/databaseConfig.ts`.

## Rodando o projeto

- Para iniciar o backend em modo desenvolvimento:
  ```bash
  npm start
  ```
  O servidor será iniciado na porta definida em `src/config/index.ts` (padrão: 3000).

## Scripts úteis

- Iniciar: `npm start`
- Instalar dependências: `npm install`

## Estrutura

- `src/index.ts` — Arquivo principal
- `src/routes/` — Rotas da API
- `src/controllers/` — Controllers
- `src/services/` — Lógica de negócio
- `src/models/` — Modelos e scripts do banco
- `src/config/` — Configurações
- `src/middlewares/` — Middlewares

## Banco de dados

- O projeto utiliza PostgreSQL. Veja `src/config/databaseConfig.ts` para configurar a conexão.

## Autenticação

- Login via email e senha, com JWT.
- Proteja rotas usando o middleware de autenticação JWT.

---

Se tiver dúvidas, abra uma issue ou entre em contato!
