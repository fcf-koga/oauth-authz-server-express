const { clients } = require("./config");
const _ = require("underscore");
const querystring = require("querystring");

function getClient(client_id) {
  return _.find(clients, (client) => client.client_id === client_id);
}

function buildUrl(url, params) {
  const urlParsed = new URL(url);
  urlParsed.search = new URLSearchParams(params).toString();
  return urlParsed.toString();
}

function decodeClientCredentials(auth) {
  const clientCredentials = Buffer.from(auth.slice("basic ".length), "base64")
    .toString()
    .split(":");
  const clientId = querystring.unescape(clientCredentials[0]);
  const clientSecret = querystring.unescape(clientCredentials[1]);
  return { id: clientId, secret: clientSecret };
}

function getScopesFromForm(body) {
  return _.filter(_.keys(body), function (s) {
    return s.startsWith("scope_");
  }).map(function (s) {
    return s.slice("scope_".length);
  });
}
module.exports = {
  getClient,
  buildUrl,
  decodeClientCredentials,
  getScopesFromForm,
};
