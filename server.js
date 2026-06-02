import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import Database from "better-sqlite3";

// __dirname fix (ES module safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
const server = http.createServer(app);

// Socket.io CORS configuration
const io = new Server(server);

const PORT = 3000;

let db;
try {
  db = new Database('items.db');
  console.log('Connected to SQLite DB');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS restaurant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT,
    rate INTEGER,
    category TEXT
  );
  CREATE TABLE IF NOT EXISTS general_shop (
    code INTEGER UNIQUE,
    item TEXT,
    rate INTEGER
  );
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER,
    item TEXT,
    quantity INTEGER,
    total INTEGER,
    source TEXT,
    payment TEXT
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    tableNo TEXT,
    data TEXT,
    stat TEXT,
    ts INTEGER
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    tableNo TEXT,
    data TEXT,
    stat TEXT,
    ts INTEGER
  );
  CREATE TABLE IF NOT EXISTS credit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER,
    cidNumber TEXT,
    phoneNumber TEXT,
    name TEXT,
    amount INTEGER
  );
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    token TEXT,
    role TEXT
  );
`);

/**********
APIs
**********/
// Get APIs
app.get('/api/getTokens', (req, res) => {
  try {
    const tokens = db.prepare('SELECT * FROM tokens').all();
    res.json({ data: tokens, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.get('/api/getData', (req, res) => {
  try {
    const restaurantItems = db.prepare('SELECT * FROM restaurant').all();
    const generalShopItems = db.prepare('SELECT * FROM general_shop').all();
    const credits = db.prepare('SELECT * FROM credit').all();
    res.json({ data: { restaurantItems, generalShopItems, credits }, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.get('/api/getGroceryItems', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM general_shop').all();
    res.json({ data: items, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.get('/api/getCredits', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM credit').all();
    res.json({ data: items, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.get('/api/getSales', (req, res) => {
  const { start, end } = req.query;
  try {
    const rows = db.prepare(
      'SELECT * FROM sales WHERE ts BETWEEN ? AND ?'
    ).all(start, end);
    res.json({ data: rows, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
});
app.get('/api/getCreditSales', (req, res) => {
  const { ts } = req.query;
  try {
    const rows = db.prepare(
      'SELECT * FROM sales WHERE ts = ?'
    ).all(ts);
    res.json({ data: rows, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
});
// Post APIs
app.post('/api/addToken', (req, res) => {
  let { token } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO tokens (name, token, role) VALUES (?, ?, ?)');
    stmt.run("", token, "Pending");
    const ret = db.prepare('SELECT * FROM tokens WHERE token = ?').get(token);
    res.json({ data: ret, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.post('/api/addGroceryItem', (req, res) => {
  let { id, item, rate, purchaseRate, storeStock, shopStock } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO general_shop (id, item, rate, purchaseRate, storeStock, shopStock) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, item, rate, purchaseRate, storeStock, shopStock);
    const ret = db.prepare('SELECT * FROM general_shop WHERE id = ?').get(id);
    io.emit("groceryAdd", ret);
    res.json({ data: ret, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.post('/api/addSales', (req, res) => {
  let data = req.body;
  const insertMany = db.transaction((data) => {
    const stmt = db.prepare('INSERT INTO sales (ts, item, quantity, total, source, payment) VALUES (?, ?, ?, ?, ?, ?)');
    for (const d of data) {
      stmt.run(d.ts, d.item, d.quantity, d.total, d.source, d.payment);
    }
  });
  try {
    insertMany(data);
    res.json({ data: [], success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.post('/api/addCredit', (req, res) => {
  const { salesRec, creditData } = req.body;
  try {
    const insert = db.transaction(() => {
      db.prepare(
        'INSERT INTO credit (ts, cidNumber, phoneNumber, name, amount) VALUES (?, ?, ?, ?, ?)'
      ).run(creditData.ts, creditData.cidNumber, creditData.phoneNumber, creditData.name, creditData.amount);
      db.prepare(
        'INSERT INTO sales (ts, item, quantity, total, source, payment) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(salesRec.ts, salesRec.item, salesRec.quantity, salesRec.total, salesRec.source, salesRec.payment
      );
    });
    insert();
    const ret1 = db.prepare('SELECT * FROM credit WHERE id = ?').get(db.prepare('SELECT last_insert_rowid() AS id').get().id);
    const ret2 = db.prepare('SELECT * FROM sales WHERE id = ?').get(db.prepare('SELECT last_insert_rowid() AS id').get().id);
    res.json({ data: { credit: ret1, sales: ret2 }, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
// Put APIs
app.put('/api/updateToken/:id', (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;
  try {
    const stmt = db.prepare('UPDATE tokens SET name = ?, role = ? WHERE id = ?');
    stmt.run(name, role, id);
    const ret = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
    res.json({ data: ret, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.put('/api/updateGroceryItem/:id', (req, res) => {
  const { id } = req.params;
  const { item, rate, purchaseRate, storeStock, shopStock } = req.body;
  try {
    const stmt = db.prepare('UPDATE general_shop SET item = ?, rate = ?, purchaseRate = ?, storeStock = ?, shopStock = ? WHERE id = ?');
    stmt.run(item, rate, purchaseRate, storeStock, shopStock, id);
    const ret = db.prepare('SELECT * FROM general_shop WHERE id = ?').get(id);
    io.emit("groceryUpdate", ret);
    res.json({ data: ret, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
app.post('/api/updateCredit', (req, res) => {
  const { ts, payment, newTs } = req.body;
  try {
    const insert = db.transaction(() => {
      db.prepare(
        'UPDATE sales SET payment = ?, ts = ? WHERE ts = ?'
      ).run(payment, newTs, ts);
      db.prepare(
        'DELETE FROM credit WHERE ts = ?'
      ).run(ts);
    });
    insert();
    const ret = db.prepare('SELECT * FROM credit WHERE ts = ?').get(ts);
    res.json({ data: ret, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
// Delete APIs
app.delete('/api/general_shop/:id', (req, res) => {
  const id = req.params.id;
  try {
    db.prepare('DELETE FROM general_shop WHERE id = ?').run(id);
    io.emit("groceryDelete", {id: id})
    res.json({ data: {id: id}, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
})
app.delete('/api/sales/:id', (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const stmt = db.prepare('DELETE FROM sales WHERE id = ?');
    stmt.run(id);
    res.json({ data: {id: id}, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
})
app.delete('/api/tokens/:id', (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const stmt = db.prepare('DELETE FROM tokens WHERE id = ?');
    stmt.run(id);
    res.json({ data: {id: id}, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
})

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}
App running at http://localhost:${PORT}/App`));