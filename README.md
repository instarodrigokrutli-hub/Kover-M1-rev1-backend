# Backend Kover Manutenção — Node.js + AdonisJS (JavaScript)

Estrutura de referência de uma API AdonisJS em **JavaScript puro** (sem TypeScript),
pra você usar como ponto de partida e ir replicando o padrão pros outros módulos
do sistema (Ativos, Materiais, Preventivas, Compras, Indicadores, etc).

## Sobre a versão escolhida

O AdonisJS atual (v6) passou a ser **TypeScript-only** — não dá mais pra criar um
projeto novo 100% em JavaScript com ele. Como você pediu explicitamente "em JS" e
a estrutura clássica com `controllers`, `start` e `resources`, esse scaffold segue
o padrão do **AdonisJS 5** (última versão que suporta JavaScript puro oficialmente).
É uma versão estável e madura, mas não é mais a que recebe novidades do time do
Adonis — se em algum momento quiser migrar pra v6, o conceito (controllers, rotas,
migrations, validators) é o mesmo, muda a sintaxe (ESM + TypeScript).

## Como rodar

```bash
npm install
cp .env.example .env
node ace generate:key        # imprime uma chave — cole ela em APP_KEY= no .env
node ace migration:run       # cria as tabelas no banco configurado no .env
npm run dev                  # sobe a API em http://localhost:3333 com reload automático
```

Por padrão (`DB_CONNECTION=sqlite` no `.env.example`) o banco é um arquivo SQLite
em `database/kover_manutencao.sqlite3` — não precisa instalar nada. Pra usar
Postgres de verdade, troque `DB_CONNECTION` pra `pg` e preencha as variáveis
`PG_*` (ver `config/database.js`).

## Estrutura de pastas — o que é cada coisa

```
backend/
├── ace                     # CLI do Adonis (node ace <comando>)
├── server.js               # sobe o servidor HTTP (npm start)
├── .adonisrc.json          # config raiz: providers, preloads, pastas
├── .env / .env.example     # variáveis de ambiente (porta, banco, chave)
│
├── app/
│   ├── Controllers/Http/   # recebem a requisição HTTP e devolvem a resposta
│   ├── Models/             # 1 classe = 1 tabela do banco (via Lucid ORM)
│   ├── Validators/         # regras de validação do body de cada request
│   ├── Middleware/         # código que roda antes/depois do controller
│   └── Exceptions/         # tratamento centralizado de erros
│
├── config/                 # configuração de cada peça do framework
│   ├── app.js               # chave, http, logger
│   ├── database.js          # conexão com o Postgres
│   ├── bodyparser.js        # como ler JSON/form/upload do body
│   └── cors.js              # quem pode chamar essa API (o frontend)
│
├── database/
│   └── migrations/         # histórico versionado da estrutura das tabelas
│
├── providers/               # registra serviços/bindings customizados
├── resources/
│   └── views/               # templates .edge (HTML), quando precisar
├── public/                  # arquivos estáticos servidos direto
└── start/
    ├── routes.js             # TODAS as rotas da API ficam listadas aqui
    └── kernel.js              # registro dos middlewares (global/nomeado)
```

### Sobre o `.adonisrc.json`

É o arquivo de configuração raiz do Adonis (por isso não pode ter comentários,
é JSON puro). Os campos principais:

- `"typescript": false` — é essa linha que faz o Adonis rodar os `.js`
  diretamente, sem precisar de `ts-node`.
- `"providers"` — pacotes/arquivos que o Adonis carrega na inicialização
  (o próprio framework, o Lucid/banco, o CORS, e o seu `AppProvider`).
- `"preloads"` — arquivos que rodam assim que o app sobe; é por isso que
  `start/routes.js` e `start/kernel.js` funcionam sem você importar eles
  em lugar nenhum.
- `"directories"` — mapeia nomes lógicos ("migrations", "views"...) pras
  pastas reais do projeto; é o que os comandos `node ace make:*` usam pra
  saber onde criar cada arquivo novo.

### O fluxo de uma requisição

```
requisição HTTP
   → start/kernel.js (middlewares: CORS, body parser, auth...)
   → start/routes.js (decide qual controller/método chamar)
   → app/Validators/*.js (valida o body, se a rota pedir)
   → app/Controllers/Http/*.js (orquestra a resposta)
   → app/Models/*.js (lê/grava no banco via Lucid)
   → resposta em JSON
```

## Os dois exemplos completos: Técnicos e Ordens de Serviço

Foram implementados de ponta a ponta (migration → model → validator → controller →
rota) pra servir de modelo:

- **Técnicos** (`/api/v1/tecnicos`): CRUD simples, sem relacionamento.
- **Ordens de Serviço** (`/api/v1/ordens-servico`): CRUD com relacionamento
  (`tecnico_id`), enum de status/prioridade e uma rota de ação extra
  (`PATCH /ordens-servico/:id/concluir`), pra mostrar como sair do CRUD padrão.

## Como adicionar um novo módulo (ex: Máquinas)

Repetindo o padrão dos dois exemplos:

1. **Migration**: `node ace make:migration maquinas --create=maquinas`, define as
   colunas em `up()`.
2. **Model**: `app/Models/Maquina.js`, extends `Model` (não precisa declarar as
   colunas, o Lucid lê da tabela).
3. **Validator**: `app/Validators/CreateMaquina.js`, com as `rules()`.
4. **Controller**: `app/Controllers/Http/MaquinasController.js`, com os métodos
   `index/store/show/update/destroy` (copie um dos dois exemplos e ajuste).
5. **Rota**: uma linha em `start/routes.js`:
   ```js
   Route.resource('maquinas', 'MaquinasController').apiOnly()
   ```

Isso cobre praticamente todos os módulos que já existem hoje em `src/server`
(ativos, materiais, fornecedores, preventivas, setores, unidades, técnicos,
indicadores, etc) — cada um vira um par migration + model + controller + rota
seguindo exatamente esse mesmo padrão.

## Comandos úteis do `ace`

```bash
node ace make:controller Maquinas   # cria um controller vazio
node ace make:model Maquina          # cria um model vazio
node ace make:migration maquinas     # cria uma migration vazia
node ace make:validator CreateMaquina
node ace migration:rollback          # desfaz a última migration
node ace list                        # lista todos os comandos disponíveis
```
