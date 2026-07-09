const express = require("express");
const router = express.Router();
const { loadEnvFile } = require('node:process');
loadEnvFile('./.env');

const db = require("../db");

router.get('/get', (req, res) => {
  try {
    const generalShopItems = db.prepare('SELECT * FROM general_shop').all();
    res.json({ data: generalShopItems, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
})
router.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { item, rate, purchaseRate, storeStock, shopStock } = req.body;
  try {
    db.prepare('UPDATE general_shop SET item = ?, rate = ?, purchaseRate = ?, storeStock = ?, shopStock = ? WHERE id = ?').run(item, rate, purchaseRate, storeStock, shopStock, id);
    res.json({ success: true });
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
router.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  try {
    db.prepare('DELETE FROM general_shop WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, success: false });
  }
})

module.exports = router;