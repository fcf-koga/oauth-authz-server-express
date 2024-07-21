const serverAddress = "http://localhost:3000";
const clientAddress = "http://localhost:9000";

const authzServer = {
  authorizationEndpoint: serverAddress + "/authorize",
  tokenEndpoint: serverAddress + "/token",
  responseType: ["code", "token"],
};

// クライアントの情報を格納する配列
const clients = [
  {
    client_id: "client_id",
    client_secret: "client_secret",
    redirect_uris: [clientAddress + "/callback"],
    scope: ["foo", "bar"],
  },
];

module.exports = { authzServer, clients };
