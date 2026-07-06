const express = require("express");
const router = express.Router();
const { loadEnvFile } = require('node:process');
loadEnvFile('./.env');

const db = require("../db");

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
  const id = parseInt(req.params.id);
  try {
    db.prepare('DELETE FROM sales WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
})

module.exports = router;