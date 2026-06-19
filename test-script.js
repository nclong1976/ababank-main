const db = require('./db.js');
const index = require('./index.js');
// wait, index.js runs the server. I can't just require it.

async function test() {
  const q = await db.getClient();
  try {
    await q.begin();
    const newId = 'user-test';
    const randomName = 'Test Name';
    const phone = '1234567890';
    const email = 'test@ababank.com';
    const pin = '1234';
    
    await q.query(
      'INSERT INTO users (id, name, phone, email, pin, role, is_locked) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [newId, randomName, phone, email, pin, 'user', 0]
    );

    await q.query(
      'INSERT INTO accounts (user_id, currency, balance, account_no) VALUES ($1, $2, $3, $4)',
      [newId, 'USD', 0, '111222333']
    );

    await q.commit();
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
