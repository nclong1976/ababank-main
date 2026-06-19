let Database; try { Database = require('better-sqlite3'); } catch(e) { console.warn('[db] better-sqlite3 not available:', e.message); }
const path = require('path');
const fs = require('fs');

let db;
let pgPool;
let isPostgres = false;

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (dbUrl) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  isPostgres = true;
  console.log('Database: Using PostgreSQL');
} else {
  if (!Database) { console.error('[db] better-sqlite3 failed to load. Please set DATABASE_URL for PostgreSQL.'); }
  let dbPath = path.join(process.cwd(), 'dev.db');
  // Vercel serverless functions have a read-only filesystem except for /tmp
  if (process.env.VERCEL) {
    dbPath = '/tmp/dev.db';
    if (!fs.existsSync(dbPath)) {
      try {
        const srcDb = path.join(process.cwd(), 'dev.db');
        if (fs.existsSync(srcDb)) {
          fs.copyFileSync(srcDb, dbPath);
          console.log('Successfully copied dev.db to /tmp/dev.db');
        } else {
          console.log('dev.db not found in workspace root, SQLite will initialize via schema.sql');
        }
      } catch (err) {
        console.error('Failed to copy dev.db to /tmp', err);
      }
    }
  }
  if (Database) {
      db = new Database(dbPath);
  console.log('Database: Using SQLite at ' + dbPath);
  }
}

// Function to initialize PostgreSQL tables & seed data
async function initPostgres() {
  try {
    const res = await pgPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    if (!res.rows[0].exists) {
      console.log('Initializing PostgreSQL schema...');
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute the schema
      await pgPool.query(schema);
      console.log('PostgreSQL schema initialized successfully.');
    } else {
      try { await pgPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS current_challenge TEXT"); } catch (e) {}
      try { 
        await pgPool.query(`CREATE TABLE IF NOT EXISTS webauthn_credentials (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id),
          public_key TEXT NOT NULL,
          counter INTEGER NOT NULL,
          device_type TEXT,
          backed_up INTEGER,
          transports TEXT
        )`); 
      } catch (e) {}
    }
    
    // Seed default users (make sure admin-1 exists and is updated)
    console.log('Ensuring admin user exists in PostgreSQL...');
    // Resolve duplicate phone/email constraint errors
    await pgPool.query(`
      UPDATE users 
      SET phone = phone || '_dup_' || CAST(EXTRACT(EPOCH FROM NOW()) AS INTEGER),
          email = 'dup_' || CAST(EXTRACT(EPOCH FROM NOW()) AS INTEGER) || '_' || email
      WHERE (phone = '099999999' OR email = 'admin@bank.com') 
        AND id != 'admin-1'
    `);
    await pgPool.query(`
      INSERT INTO users (id, name, email, pin, role, phone, is_locked) 
      VALUES ('admin-1', 'System Admin', 'admin@bank.com', '8213', 'admin', '099999999', 0)
      ON CONFLICT (id) DO UPDATE SET pin = '8213', role = 'admin', phone = '099999999', email = 'admin@bank.com', is_locked = 0
    `);
    await pgPool.query(`
      INSERT INTO accounts (user_id, currency, balance, account_no)
      VALUES ('admin-1', 'USD', 0, '123456789')
      ON CONFLICT (user_id, currency) DO NOTHING
    `);
    // Update existing accounts to 9 digits if they have 'USD' or 'KHR' prefixes or wrong length
    console.log('Ensuring 9-digit accounts in PostgreSQL...');
    const { rows: pAccounts } = await pgPool.query("SELECT user_id, currency FROM accounts WHERE length(account_no) != 9 OR account_no !~ '^[0-9]+$'");
    if (pAccounts.length > 0) {
      await pgPool.query('BEGIN');
      for (const acc of pAccounts) {
        const random9 = Math.floor(100000000 + Math.random() * 900000000).toString();
        await pgPool.query("UPDATE accounts SET account_no = $1 WHERE user_id = $2 AND currency = $3", [random9, acc.user_id, acc.currency]);
      }
      await pgPool.query('COMMIT');
    }

    console.log('PostgreSQL admin seed completed.');
  } catch (err) {
    console.error('Error initializing PostgreSQL database:', err);
  }
}

// Initialize SQLite schema if active
if (!isPostgres && db) {
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    try {
      db.exec(schema);

      // Seed default users (make sure admin-1 exists and is updated)
      console.log('Ensuring admin user exists in SQLite...');
      // Resolve duplicate phone/email constraint errors
      db.prepare(`
        UPDATE users 
        SET phone = phone || '_dup_' || strftime('%s','now'),
            email = 'dup_' || strftime('%s','now') || '_' || email
        WHERE (phone = '099999999' OR email = 'admin@bank.com') 
          AND id != 'admin-1'
      `).run();
      db.prepare("INSERT OR IGNORE INTO users (id, name, email, pin, role, phone, is_locked) VALUES ('admin-1', 'System Admin', 'admin@bank.com', '8213', 'admin', '099999999', 0)").run();
      db.prepare("UPDATE users SET pin = '8213', role = 'admin', phone = '099999999', email = 'admin@bank.com', is_locked = 0 WHERE id = 'admin-1'").run();
      db.prepare("INSERT OR IGNORE INTO accounts (user_id, currency, balance, account_no) VALUES ('admin-1', 'USD', 0, '123456789')").run();
      console.log('SQLite admin seed completed.');

      // Migration for existing tables
      try {
        const userColumns = db.prepare('PRAGMA table_info(users)').all();
        const hasPin = userColumns.some(c => c.name === 'pin');
        const hasRole = userColumns.some(c => c.name === 'role');
        const hasPhone = userColumns.some(c => c.name === 'phone');
        
        if (!hasPin) {
          db.prepare("ALTER TABLE users ADD COLUMN pin TEXT DEFAULT '111111'").run();
        }
        if (!hasRole) {
          db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
        }
        if (!hasPhone) {
          db.prepare("ALTER TABLE users ADD COLUMN phone TEXT").run();
        }
        const hasCurrentChallenge = userColumns.some(c => c.name === 'current_challenge');
        if (!hasCurrentChallenge) {
          db.prepare("ALTER TABLE users ADD COLUMN current_challenge TEXT").run();
        }
        db.prepare(`CREATE TABLE IF NOT EXISTS webauthn_credentials (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id),
          public_key TEXT NOT NULL,
          counter INTEGER NOT NULL,
          device_type TEXT,
          backed_up INTEGER,
          transports TEXT
        )`).run();

        // Migration logic for adjustments
        const checkTx = (id) => db.prepare('SELECT count(*) as count FROM transactions WHERE id = ?').get(id).count;


        
        if (checkTx('admin-pin-update-8213') === 0) {
          db.prepare("UPDATE users SET pin = ? WHERE role = 'admin'").run('8213');
          const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get();
          if (firstUser) {
             db.prepare('INSERT INTO transactions (id, user_id, amount, type, balance_before, balance_after, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                  .run('admin-pin-update-8213', firstUser.id, 0, 'plus', 0, 0, 'Updated Admin PIN to 8213', 'USD');
          }
        }

        const txColumns = db.prepare('PRAGMA table_info(transactions)').all();
        if (!txColumns.some(c => c.name === 'party_name')) db.prepare("ALTER TABLE transactions ADD COLUMN party_name TEXT").run();
        if (!txColumns.some(c => c.name === 'party_account_no')) db.prepare("ALTER TABLE transactions ADD COLUMN party_account_no TEXT").run();
        if (!txColumns.some(c => c.name === 'currency')) db.prepare("ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'USD'").run();

        const userMeta = db.prepare('PRAGMA table_info(users)').all();
        if (!userMeta.some(c => c.name === 'is_locked')) {
          db.prepare("ALTER TABLE users ADD COLUMN is_locked INTEGER DEFAULT 0").run();
        }
        if (!userMeta.some(c => c.name === 'is_topup_locked')) {
          db.prepare("ALTER TABLE users ADD COLUMN is_topup_locked INTEGER DEFAULT 0").run();
        }
            if (!userMeta.some(c => c.name === 'avatar_url')) {
              db.prepare("ALTER TABLE users ADD COLUMN avatar_url TEXT").run();
            }
            if (!userMeta.some(c => c.name === 'updated_at')) {
              db.prepare("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP").run();
            }

        const accountMeta = db.prepare('PRAGMA table_info(accounts)').all();
        if (!accountMeta.some(c => c.name === 'account_no')) {
          db.prepare("ALTER TABLE accounts ADD COLUMN account_no TEXT").run();
        }
        if (!accountMeta.some(c => c.name === 'updated_at')) {
          db.prepare("ALTER TABLE accounts ADD COLUMN updated_at TIMESTAMP").run();
        }

        if (checkTx('pin-4-digit-enforcement') === 0) {
          // Force all PINs to be 4 digits (truncate if longer)
          db.prepare("UPDATE users SET pin = substr(pin, 1, 4) WHERE length(pin) > 4").run();
          db.prepare("UPDATE users SET pin = '8213' WHERE role = 'admin'").run();
          const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get();
          if (firstUser) {
            db.prepare('INSERT INTO transactions (id, user_id, amount, type, balance_before, balance_after, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                  .run('pin-4-digit-enforcement', firstUser.id, 0, 'plus', 0, 0, 'Enforced 4-digit PINs across system', 'USD');
          }
        }

        if (checkTx('phone-and-pin-enforcement-v2') === 0) {
          db.prepare("UPDATE users SET phone = '099999999', pin = '8213' WHERE id = 'admin-1'").run();
          db.prepare("UPDATE accounts SET account_no = '123456789' WHERE user_id = 'admin-1'").run();
          
          const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get();
          if (firstUser) {
            db.prepare('INSERT INTO transactions (id, user_id, amount, type, balance_before, balance_after, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                  .run('phone-and-pin-enforcement-v2', firstUser.id, 0, 'plus', 0, 0, 'Enforced phone and pin seeds for admin', 'USD');
          }
        }

        if (checkTx('nine-digit-account-migration') === 0) {
          const accounts = db.prepare("SELECT user_id, currency, account_no FROM accounts WHERE length(account_no) != 9 OR account_no GLOB '*[^0-9]*'").all();
          if (accounts.length > 0) {
            const updateStmt = db.prepare("UPDATE accounts SET account_no = ? WHERE user_id = ? AND currency = ?");
            for (const acc of accounts) {
              const random9 = Math.floor(100000000 + Math.random() * 900000000).toString();
              updateStmt.run(random9, acc.user_id, acc.currency);
            }
          }
          
          const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get();
          if (firstUser) {
            db.prepare('INSERT INTO transactions (id, user_id, amount, type, balance_before, balance_after, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                  .run('nine-digit-account-migration', firstUser.id, 0, 'plus', 0, 0, 'Migrated all accounts to 9-digit format', 'USD');
          }
        }
      } catch (err) {
        console.error('Migration error:', err);
      }
      

    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }
}

if (isPostgres) {
  initPostgres();
}

/**
 * Universal Database Reset Function
 */
async function resetDatabase() {
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  if (isPostgres) {
    await pgPool.query('DROP TABLE IF EXISTS transactions CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS accounts CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS users CASCADE');
    await pgPool.query(schema);
    
    // Seed default users in PostgreSQL
    await pgPool.query("INSERT INTO users (id, name, email, pin, role, phone) VALUES ('admin-1', 'System Admin', 'admin@bank.com', '8213', 'admin', '099999999')");
    await pgPool.query("INSERT INTO accounts (user_id, currency, balance, account_no) VALUES ('admin-1', 'USD', 0, '123456789')");
  } else {
    if (!db) throw new Error('Database not initialized');
    db.exec('PRAGMA foreign_keys = OFF');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    tables.forEach(t => db.prepare(`DROP TABLE IF EXISTS ${t.name}`).run());
    db.exec(schema);
    
    // Seed default users in SQLite
    db.prepare('INSERT INTO users (id, name, email, pin, role, phone) VALUES (?, ?, ?, ?, ?, ?)').run('admin-1', 'System Admin', 'admin@bank.com', '8213', 'admin', '099999999');
    db.prepare('INSERT INTO accounts (user_id, currency, balance) VALUES (?, ?, ?)').run('admin-1', 'USD', 0);
  }
}

function prepareSqlAndParams(text, params = []) {
  let sqliteParams = [];
  const placeholderRegex = /\$(\d+)/g;
  let sql = text.replace(placeholderRegex, (m, numStr) => {
    const idx = parseInt(numStr, 10) - 1;
    sqliteParams.push(params[idx]);
    return '?';
  });
  sql = sql.replace(/now\(\)/gi, 'CURRENT_TIMESTAMP');
  return { sql, sqliteParams };
}

/**
 * Universal Query Adapter
 */
module.exports = {
  query: async (text, params = []) => {
    if (isPostgres) {
      try {
        const res = await pgPool.query(text, params);
        return {
          rows: res.rows,
          rowCount: res.rowCount
        };
      } catch (err) {
        console.error('SQL PG error:', text, params, err);
        throw err;
      }
    }

    if (!db) {
       throw new Error('Database not initialized');
    }

    const { sql, sqliteParams } = prepareSqlAndParams(text, params);
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      try {
        const rows = db.prepare(sql).all(...sqliteParams);
        return { rows };
      } catch (err) {
        console.error('SQL SELECT error:', sql, sqliteParams, err);
        throw err;
      }
    } else {
      try {
        const result = db.prepare(sql).run(...sqliteParams);
        return { 
          rows: result.changes > 0 ? [{ id: result.lastInsertRowid }] : [],
          rowCount: result.changes
        };
      } catch (err) {
        console.error('SQL EXEC error:', sql, sqliteParams, err);
        throw err;
      }
    }
  },
  getClient: async () => {
    if (isPostgres) {
      const client = await pgPool.connect();
      return {
        query: async (text, params = []) => {
          const res = await client.query(text, params);
          return {
            rows: res.rows,
            rowCount: res.rowCount
          };
        },
        release: () => client.release(),
        begin: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK')
      };
    }

    // Basic client simulation for SQLite
    return {
      query: async (text, params = []) => {
        const { sql, sqliteParams } = prepareSqlAndParams(text, params);
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
           return { rows: db.prepare(sql).all(...sqliteParams) };
        }
        const result = db.prepare(sql).run(...sqliteParams);
        return { rows: [{ id: result.lastInsertRowid }], rowCount: result.changes };
      },
      release: () => {},
      begin: () => db.prepare('BEGIN').run(),
      commit: () => db.prepare('COMMIT').run(),
      rollback: () => db.prepare('ROLLBACK').run()
    };
  },
  resetDatabase
};
