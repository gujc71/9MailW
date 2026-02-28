const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Ensure db directory exists
if (!fs.existsSync(config.dbdir)) {
  fs.mkdirSync(config.dbdir, { recursive: true });
}

const dbPath = path.join(config.dbdir, 'mailserver.db');
let _db = null;

// Wrapper providing the same API surface used throughout the app
const wrapper = {
  prepare(sql) {
    const stmt = _db.prepare(sql);
    return {
      get(...params) {
        return stmt.get(...params);
      },
      all(...params) {
        return stmt.all(...params);
      },
      run(...params) {
        return stmt.run(...params);
      },
    };
  },
  exec(sql) {
    _db.exec(sql);
  },
  /** Run a function inside a SQLite transaction (atomic, all-or-nothing) */
  transaction(fn) {
    return _db.transaction(fn);
  },
};

async function init() {
  _db = new Database(dbPath);

  // WAL mode for better concurrent read/write performance
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  // Reduce lock contention: return SQLITE_BUSY after 5 s instead of immediately
  _db.pragma('busy_timeout = 5000');

  // Initialize schema
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  _db.exec(schema);
}

module.exports = wrapper;
module.exports.init = init;
