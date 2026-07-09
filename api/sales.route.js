const express = require("express");
const router = express.Router();
const { loadEnvFile } = require('node:process');
loadEnvFile('./.env');

const db = require("../db");

router.get('/get', (req, res) => {
  const { start, end } = req.query;
  try {
    const rows = db.prepare(
      'SELECT * FROM sales WHERE ts BETWEEN ? AND ?'
    ).all(start, end);
    res.json({ data: rows, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
})
router.post('/add', (req, res) => {
  let data = req.body;
  const insertMany = db.transaction((data) => {
    const stmt = db.prepare("INSERT INTO sales (ts, item, quantity, total, source, payment) VALUES (?, ?, ?, ?, ?, ?)");
    for (const d of data) {
      stmt.run(d.ts, d.item, d.quantity, d.total, d.source, d.payment);
    }
  });
  try {
    insertMany(data);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
router.delete('/delete/:id', (req, res) => {
  const id = req.params.id.split(',');
  try {
    const del = db.transaction(id => {
      id.forEach(i => {
        db.prepare('DELETE FROM sales WHERE id = ?').run(i);
      })
    })
    del(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
})

module.exports = router;