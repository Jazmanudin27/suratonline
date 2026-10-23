import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '31.97.109.165',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'portal',
  password: process.env.DB_PASSWORD || 'Jazman@271998',
  database: process.env.DB_NAME || 'portal',
  connectTimeout: 10000
});

async function main() {
  const [rows] = await pool.query('SELECT id, letter_number, title, attachments, field_values FROM letters WHERE letter_number LIKE ? LIMIT 1', ['%002%']);
  console.log('LETTER_DATA:');
  console.log(JSON.stringify(rows[0], null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
