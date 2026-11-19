const { mkdirSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { DatabaseSync } = require('node:sqlite')
const { Pool } = require('pg')
const { generateVAPIDKeys } = require('web-push')

const schema = [
  'CREATE TABLE IF NOT EXISTS devices (endpoint TEXT PRIMARY KEY, channel TEXT NOT NULL, subscription TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS deliveries (channel TEXT NOT NULL, event TEXT NOT NULL, created BIGINT NOT NULL, PRIMARY KEY (channel, event))',
  'CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS devices_channel ON devices (channel)',
  'CREATE INDEX IF NOT EXISTS deliveries_created ON deliveries (created)',
]

async function openStore({ databaseUrl, stateDir }) {
  let query
  if (databaseUrl) {
    const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 3500 })
    pool.on('error', error => console.error('Notification database connection error:', error.code || error.name))
    query = (statement, ...values) => {
      let index = 0
      return pool.query(statement.replace(/\?/g, () => '$' + ++index), values)
    }
  } else {
    mkdirSync(stateDir, { recursive: true })
    const db = new DatabaseSync(join(stateDir, 'push.sqlite'))
    query = async (statement, ...values) => {
      const prepared = db.prepare(statement)
      if (/^SELECT\b/i.test(statement)) return { rows: prepared.all(...values) }
      return { rowCount: Number(prepared.run(...values).changes) }
    }
  }

  for (const statement of schema) await query(statement)
  const get = async (statement, ...values) => (await query(statement, ...values)).rows[0]
  let saved = await get("SELECT value FROM settings WHERE name = 'vapid'")
  if (!saved) {
    let keys
    if (!databaseUrl) {
      try {
        keys = JSON.parse(readFileSync(join(stateDir, 'vapid.json'), 'utf8'))
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    await query("INSERT INTO settings VALUES ('vapid', ?) ON CONFLICT (name) DO NOTHING", JSON.stringify(keys || generateVAPIDKeys()))
    saved = await get("SELECT value FROM settings WHERE name = 'vapid'")
  }
  return { query, get, keys: JSON.parse(saved.value) }
}

module.exports = openStore
