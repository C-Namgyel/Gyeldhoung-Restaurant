const express = require("express");
const router = express.Router();

const db = require("../db");

router.get('/get', (req, res) => {
  if (req.headers['key'] != "gyeldhoung") {
    res.status(401).send("401: Unauthorized");
    return;
  }
  try {
    const data = db.prepare('SELECT * FROM general_shop').all();
    res.json({ data, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});
router.post('/add', (req, res) => {
  let { id, item, rate, purchaseRate, storeStock, shopStock } = req.body;
  try {
    db.prepare('INSERT INTO general_shop (id, item, rate, purchaseRate, storeStock, shopStock) VALUES (?, ?, ?, ?, ?, ?)').run(id, item, rate, purchaseRate, storeStock, shopStock);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
});

module.exports = router;