const express = require("express");
const router = express.Router();

const db = require("../db");

router.get('/get', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM credit').all();
    res.json({ data: items, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
router.get('/get-details', (req, res) => {
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
router.post('/add', (req, res) => {
  const { salesRec, creditData } = req.body;
  try {
    const insert = db.transaction(() => {
      db.prepare(
        'INSERT INTO credit (ts, cidNumber, phoneNumber, name, amount) VALUES (?, ?, ?, ?, ?)'
      ).run(creditData.ts, creditData.cidNumber, creditData.phoneNumber, creditData.name, creditData.amount);
      const stmt = db.prepare(
        'INSERT INTO sales (ts, item, quantity, total, source, payment) VALUES (?, ?, ?, ?, ?, ?)'
      );
      salesRec.forEach(s => {
        stmt.run(s.ts, s.item, s.quantity, s.total, s.source, s.payment)
      });
    });
    insert();
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
router.put('/update', (req, res) => {
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
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

module.exports = router;