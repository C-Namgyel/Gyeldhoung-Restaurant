const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors')
const db = require("./db");

const app = express();
const PORT = 8080;

const allowedOrigins = [
  "https://generalshop.gyeldhoung.com",
  "https://credits.gyeldhoung.com"
];

app.use(express.json());
// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no Origin (Postman, curl, server-to-server)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     callback(new Error("Not allowed by CORS"));
//   },
//   credentials: true
// }));
app.use(cors({
  origin: "*",
}));

app.use("/api/general_shop", require("./api/general_shop.route"));
app.use("/api/sales", require("./api/sales.route"));
app.use("/api/credits", require("./api/credits.route"));
app.use("/api/order", require("./api/order.route"));
app.get("/", (req, res) => {
  res.status(403).send("API access not allowed via browser");
});
app.get("/vapidPublicKey", (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
});
app.post("/subscribe", (req, res) => {
  const sub = req.body;

  try {
    db.prepare(
      `INSERT INTO subscriptions (endpoint, p256dh, auth)
          VALUES (?, ?, ?)`
    ).run(sub.endpoint, sub.keys.p256dh, sub.keys.auth);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message })
  }

});
app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  try {
    db.prepare("DELETE FROM subscriptions WHERE endpoint = ?")
      .run(endpoint);

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((req, res) => {
  if (req.accepts("html")) {
    return res.status(404).send("404: Not Found");
  }

  res.status(404).json({
    success: false,
    error: "404: Not Found"
  });
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));