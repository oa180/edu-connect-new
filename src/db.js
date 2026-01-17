const mysql = require('mysql2/promise')
const url = require('url')
require('dotenv').config()

function createPoolFromEnv() {
  const connStr = process.env.DATABASE_URL
  if (connStr) {
    const parsed = new URL(connStr)
    const params = parsed.searchParams
    const sslMode = params.get('ssl-mode') || params.get('sslmode')
    const useSsl = sslMode && sslMode.toLowerCase() !== 'disable'
    return mysql.createPool({
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      connectionLimit: 10,
      waitForConnections: true
    })
  }
  const host = process.env.DB_HOST || '127.0.0.1'
  const port = parseInt(process.env.DB_PORT || '3306', 10)
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  return mysql.createPool({ host, port, user, password, database, ssl, connectionLimit: 10, waitForConnections: true })
}

const pool = createPoolFromEnv()

async function query(sqlText, params) {
  const [rows] = await pool.execute(sqlText, params)
  return rows
}

module.exports = { pool, query }
