// db/connection.js
require('dotenv').config()
const mysql = require('mysql2/promise')

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_DATABASE = '',
  DB_CONNECTION_LIMIT = 10
} = process.env

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE || undefined,
  waitForConnections: true,
  connectionLimit: Number(DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  namedPlaceholders: true
})

// helper: query(sql, params)
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params)
  return rows
}

// optional: get connection (untuk transaksi nanti)
async function getConnection() {
  return pool.getConnection()
}

module.exports = { pool, query, getConnection }
