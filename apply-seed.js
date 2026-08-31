// Aplica database/seed-cadastros.sql no banco configurado em .env (SQLITE_FILENAME).
// Uso: node apply-seed.js
// Rode só uma vez, num banco vazio (recém migrado) — os IDs são fixos e
// colidem se os cadastros já existirem.

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

function readEnvVar(name, fallback) {
  try {
    const envText = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const m = envText.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return m ? m[1].trim() : fallback;
  } catch {
    return fallback;
  }
}

const dbFile = readEnvVar('SQLITE_FILENAME', 'kover_manutencao.sqlite3');
const dbPath = path.join(__dirname, 'database', dbFile);
const seedPath = path.join(__dirname, 'database', 'seed-cadastros.sql');

if (!fs.existsSync(seedPath)) {
  console.error('Não encontrei database/seed-cadastros.sql');
  process.exit(1);
}
if (!fs.existsSync(dbPath)) {
  console.error(`Não encontrei o banco em ${dbPath}. Rode as migrations primeiro (node ace migration:run).`);
  process.exit(1);
}

const sql = fs.readFileSync(seedPath, 'utf8');
const statements = sql.split('\n').filter(l => l.trim().startsWith('INSERT'));

const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run('BEGIN TRANSACTION');
  let ok = 0, fail = 0;
  for (const stmt of statements) {
    db.run(stmt, (err) => {
      if (err) { fail++; console.error('ERRO:', err.message, '\n  em:', stmt.slice(0, 120)); }
      else ok++;
    });
  }
  db.run('COMMIT', () => {
    console.log(`Concluído: ${statements.length} comandos processados.`);
    db.close();
  });
});
