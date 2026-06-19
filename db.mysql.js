const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

/**
 * Universal Query Adapter for MySQL
 */
const query = async (text, params = []) => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  // Convert SQLite style ? to MySQL style ? (already ? in this codebase)
  // Convert $1, $2 style to ? for MySQL
  let mysqlText = text.replace(/\$(\d+)/g, '?').replace(/now\(\)/gi, 'NOW()');
  
  try {
    const [rows, fields] = await pool.execute(mysqlText, params);
    return { rows: Array.isArray(rows) ? rows : [rows], rowCount: rows.affectedRows || rows.length };
  } catch (err) {
    console.error('MySQL Query Error:', mysqlText, params, err);
    throw err;
  }
};

module.exports = {
  query,
  getClient: async () => {
    const connection = await pool.getConnection();
    return {
      query: async (text, params = []) => {
        let mysqlText = text.replace(/\$(\d+)/g, '?').replace(/now\(\)/gi, 'NOW()');
        const [rows] = await connection.execute(mysqlText, params);
        return { rows: Array.isArray(rows) ? rows : [rows], rowCount: rows.affectedRows || rows.length };
      },
      release: () => connection.release(),
      begin: () => connection.beginTransaction(),
      commit: () => connection.commit(),
      rollback: () => connection.rollback()
    };
  }
};
