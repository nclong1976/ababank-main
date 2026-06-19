const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.prepare('CREATE TABLE users (id INTEGER, name TEXT)').run();
db.prepare('INSERT INTO users VALUES (?, ?)').run([1, 'Alice']);
const rows = db.prepare('SELECT * FROM users WHERE id = ?').all([1]);
console.log(rows);
