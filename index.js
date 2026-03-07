const express = require("express");
const request = require("request");
const app = express();

app.get("/:stream(*)", (req, res) => {
  const stream = req.params.stream;
  const url = `https://live1-814bffb9b389f652-cf.foxtelgroupcdn.net.au/${stream}`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "Accept": "*/*"
  };

  req.pipe(request({ url, headers })).on("response", response => {
    res.set(response.headers);
  }).on("error", err => {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy request failed.");
  }).pipe(res);
});

// Export handler Vercel can use
module.exports = app;
module.exports.handler = require("serverless-http")(app);
