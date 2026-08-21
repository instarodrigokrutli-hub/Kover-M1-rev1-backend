'use strict'

/*
|--------------------------------------------------------------------------
| config/database.js
|--------------------------------------------------------------------------
|
| Configuração de conexão com o banco, usada pelo Lucid (o ORM do Adonis).
| A conexão padrão é "pg" (PostgreSQL), igual ao que o projeto já usa
| via Supabase — mas fica fácil trocar por mysql/sqlite se precisar.
|
*/

const Env = use('Adonis/Core/Env')
const Application = use('Adonis/Core/Application')

module.exports = {
  connection: Env.get('DB_CONNECTION', 'pg'),

  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: Env.get('PG_HOST', '127.0.0.1'),
        port: Env.get('PG_PORT', 5432),
        user: Env.get('PG_USER', 'postgres'),
        password: Env.get('PG_PASSWORD', ''),
        database: Env.get('PG_DB_NAME', 'kover_manutencao'),
        ssl: Env.get('PG_SSL', false),
      },
      healthCheck: false,
      debug: false,
    },

    // Banco local usado enquanto o Postgres definitivo não é configurado
    // (ver README) — troque DB_CONNECTION para "pg" quando migrar.
    sqlite: {
      client: 'sqlite3',
      connection: {
        filename: Application.databasePath(Env.get('SQLITE_FILENAME', 'kover_manutencao.sqlite3')),
      },
      useNullAsDefault: true,
      healthCheck: false,
      debug: false,
    },
  },
}
