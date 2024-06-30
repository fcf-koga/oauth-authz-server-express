const express = require("express");
const router = express.Router();
const getClient = require("../utils");
const randomstring = require("randomstring");

router.get("/", function (req, res, next) {
  const client = getClient(req.query.client_id);
  if (!client) {
    res.render("error", { message: "Unknown client", error: { status: 400 } });
    return;
  } else if (!client.redirect_uris.includes(req.query.redirect_uri)) {
    res.render("error", {
      message: "Invalid redirect URI",
      error: { status: 400 },
    });
    return;
  }

  const reqid = randomstring.generate(8);
  const request = {};
  message = "ID: " + client.client_id;
  request[reqid] = reqid;
  res.render("approve", {
    title: "Approve this client?",
    message: message,
    reqid: reqid,
  });
});

module.exports = router;
