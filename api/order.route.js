const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const webpush = require("web-push");
const { loadEnvFile } = require('node:process');
loadEnvFile('./.env');

// Router
const router = express.Router();

// Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);   // ".png", ".jpg", ".webp"
        cb(null, crypto.randomUUID() + ext);
    }
});
const upload = multer({ storage });

// Database
const db = require("../db");

// Push Notification
webpush.setVapidDetails(
    "mailto:chenchoghalley@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Functions
function notifyAdmins(order) {
    const rows = db.prepare("SELECT * FROM subscriptions").all();

    const payload = JSON.stringify({
        title: "New Gyeldhoung Order 🔔",
        body: `${order.name} ordered a ${order.order}`,
        url: "https://dashboard.gyeldhoung.com"
    });

    for (const row of rows) {
        const subscription = {
            endpoint: row.endpoint,
            keys: {
                p256dh: row.p256dh,
                auth: row.auth
            }
        };
        webpush.sendNotification(subscription, payload)
            .catch(err => {
                console.error("Push failed for subscription:", err.message);

                // optional: remove invalid subscriptions
                if (err.statusCode === 410 || err.statusCode === 404) {
                    db.prepare("DELETE FROM subscriptions WHERE endpoint = ?")
                        .run(row.endpoint);
                }
            });
    }
}

// APIS
router.post("/add", upload.fields([
    { name: "payment", maxCount: 1 },
    { name: "sample", maxCount: 1 }
]), (req, res) => {
    const data = req.body;
    const payment = req.files?.payment?.[0];
    const sample = req.files?.sample?.[0];
    try {
        db.prepare("INSERT INTO orders (ts, name, phone, type, takeaway, payment, instructions, size, flavor, message, sample, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(new Date().getTime(), data.name, data.phone, data.order, data.takeaway == 'true' ? 1 : 0, payment ? payment.filename : undefined, data.instruction, data.size, data.flavor, data.message, sample ? sample.filename : undefined, "Pending");
        notifyAdmins({ name: data.name, order: data.order });
        res.json({ success: true });
    } catch (err) {
        console.error(err.message)
        res.status(500).json({ success: false, error: err.message })
    }
}
);
router.get("/get", (req, res) => {
    try {
        const rows = db.prepare("SELECT id, name, type, ts, status FROM orders ORDER BY id DESC LIMIT 20").all();
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
});

router.get("/get/:id", (req, res) => {
    try {
        const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
        res.json({ success: true, data: row });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
});

router.put("/update/:id", (req, res) => {
    try {
        db.prepare("UPDATE orders SET status = 'Done' WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
});

module.exports = router;