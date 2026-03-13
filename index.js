const express = require("express");
const fetch = require("node-fetch");
const app = express();
const serverless = require("serverless-http");

// Route khusus manifest (*.mpd) → wajib token
app.get("/:id/linear/*.mpd", async (req, res) => {
  const id = req.params.id;
  const path = req.params[0];
  const token = req.query.token;

  try {
    // Ambil token valid dari GitHub
    const tokenResp = await fetch("http://iptv.flyin.my.id/sooka/token.txt");
    const validToken = (await tokenResp.text()).trim();

    // Validasi token hanya di manifest
    if (!token) {
      return res.status(403).send("Silahkan gunakan token yang diberikan oleh admin.");
    }
    if (token !== validToken) {
      return res.status(403).send("Token tidak valid, Daripada nyolong playlist orang lebih baik bekerjasama, berlangganan skrip IPTV hubungi Admin di 085259606767.");
    }

    // Ambil bearer
    const bearerResp = await fetch(`https://flytv.my.id/sooka/bearer/${id}.php`);
    const bearer = (await bearerResp.text()).trim();
    if (!bearer) throw new Error("Bearer kosong");

    // Proxy manifest ke origin (tanpa token query)
    const url = `https://l81.dp.sooka.my/${id}/linear/${path}.mpd`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15; SM-S931B Build/AP3A.240905.015.A2; wv)",
        "Accept": "*/*",
        "Authorization": `Bearer ${bearer}`,
        "Origin": "https://sooka.my",
        "Referer": "https://sooka.my/"
      }
    });

    res.set(Object.fromEntries(response.headers));
    response.body.pipe(res);

  } catch (err) {
    console.error("Manifest proxy error:", err);
    res.status(500).send("Manifest proxy failed.");
  }
});

// Route untuk segmen video / objek lain → tanpa token, hanya bearer
app.get("/:id/linear/*", async (req, res) => {
  const id = req.params.id;
  const path = req.params[0];

  try {
    // Ambil bearer
    const bearerResp = await fetch(`https://flytv.my.id/sooka/bearer/${id}.php`);
    const bearer = (await bearerResp.text()).trim();
    if (!bearer) throw new Error("Bearer kosong");

    // Proxy segmen ke origin (tanpa token query)
    const url = `https://l81.dp.sooka.my/${id}/linear/${path}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15; SM-S931B Build/AP3A.240905.015.A2; wv)",
        "Accept": "*/*",
        "Authorization": `Bearer ${bearer}`,
        "Origin": "https://sooka.my",
        "Referer": "https://sooka.my/"
      }
    });

    res.set(Object.fromEntries(response.headers));
    response.body.pipe(res);

  } catch (err) {
    console.error("Segment proxy error:", err);
    res.status(500).send("Segment proxy failed.");
  }
});

module.exports = app;
module.exports.handler = serverless(app);
