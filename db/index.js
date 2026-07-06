// db/index.js
const Database = require("better-sqlite3");
const path = require("path");

// create single shared instance
const db = new Database(path.join(__dirname, "../items.db"), {});

console.log("SQLite connected");

// db.exec(`
//   CREATE TABLE IF NOT EXISTS restaurant (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     item TEXT,
//     rate INTEGER,
//     category TEXT
//   );
//   CREATE TABLE IF NOT EXISTS general_shop (
//     code INTEGER UNIQUE,
//     item TEXT,
//     rate INTEGER
//   );
//   CREATE TABLE IF NOT EXISTS sales (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     ts INTEGER,
//     item TEXT,
//     quantity INTEGER,
//     total INTEGER,
//     source TEXT,
//     payment TEXT
//   );
//   CREATE TABLE IF NOT EXISTS orders (
//     id INTEGER PRIMARY KEY,
//     tableNo TEXT,
//     data TEXT,
//     stat TEXT,
//     ts INTEGER
//   );
//   CREATE TABLE IF NOT EXISTS orders (
//     id INTEGER PRIMARY KEY,
//     tableNo TEXT,
//     data TEXT,
//     stat TEXT,
//     ts INTEGER
//   );
//   CREATE TABLE IF NOT EXISTS credit (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     ts INTEGER,
//     cidNumber TEXT,
//     phoneNumber TEXT,
//     name TEXT,
//     amount INTEGER
//   );
//   CREATE TABLE IF NOT EXISTS tokens (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT,
//     token TEXT,
//     role TEXT
//   );
// `);

// export it
module.exports = db;