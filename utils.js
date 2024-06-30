const clients = require("./config");

function getClient(client_id) {
  return clients.find((client) => client.client_id === client_id);
}

module.exports = getClient;
