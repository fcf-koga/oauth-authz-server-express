const express = require("express");
const router = express.Router();
const randomstring = require("randomstring");
const _ = require("underscore");
const nosql = require("nosql").load("database.nosql");
const { authzServer, clients } = require("../config");
const {
  getClient,
  buildUrl,
  decodeClientCredentials,
  getScopesFromForm,
} = require("../utils");

// トップページを返す
router.get("/", function (req, res, next) {
  res.render("index", {
    clients: clients,
    authzServer: authzServer,
  });
});

// 認可エンドポイント
router.get("/authorize", function (req, res, next) {
  /*
  必須パラメータチェック
  */

  // リクエストで渡されたclient_idが存在するかチェック
  const client = getClient(req.query.client_id);
  if (!client) {
    // 存在しない場合エラーページを返す
    res.render("warn", { message: "Unknown client" });
    return;
  }
  // リクエストで渡されたredirect_urlが登録されたuriと一致するかチェック
  else if (!client.redirect_uris.includes(req.query.redirect_url)) {
    // 一致しない場合エラーページを返す
    res.render("warn", { message: "Invalid redirect URI" });
    return;
  }
  // リクエストにresponse_typeが指定されているかチェック
  else {
    const responseType = req.query.response_type
      ? req.query.response_type.split(" ")
      : undefined;

    // リクエストにrespons_typeが指定されているかチェック
    if (!responseType) {
      const parsedUrl = buildUrl(req.query.redirect_url, {
        error: "invalid_response_type",
      });
      res.redirect(parsedUrl);
      return;
    }
    // リクエストで渡されたrespons_typeについて対応しているかチェック
    else if (
      _.difference(authzServer.responseType, responseType).length ===
      authzServer.responseType.length
    ) {
      // 1つも対応していない場合、リダイレクトエンドポインへエラーを返す
      console.log(_.difference(authzServer.responseType, responseType).length);
      console.log(authzServer.responseType.length);

      const parsedUrl = buildUrl(req.query.redirect_url, {
        error: "unsupported_response_type",
      });
      res.redirect(parsedUrl);
      return;
    }
  }

  /*
  任意パラメータチェック
  */

  const scope = req.query.scope ? req.query.scope.split(" ") : undefined;
  // リクエストにscopeが指定されているかチェック
  if (scope) {
    // リクエストで渡されたscopeについて対応しているかチェック
    if (_.difference(client.scope, scope).length === client.scope.length) {
      // 1つも対応していない場合、リダイレクトエンドポインへエラーを返す
      const urlParsed = buildUrl(req.query.redirect_url, {
        error: "invalid_scope",
      });
      res.redirect(urlParsed);
      return;
    }
  }

  const reqid = randomstring.generate(8);
  // ランダムに生成した文字列をキーとしてリクエストのクエリパラメータを格納
  req.session.requests = {};
  req.session.requests[reqid] = req.query;
  console.log(reqid);

  res.render("approve", {
    requests: req.session.requests[reqid],
    reqid: reqid,
    scope: scope,
  });
  return;
});

router.post("/approve", function (req, res, next) {
  const requests = req.session.requests[req.body.reqid];
  delete req.session.requests[req.body.reqid];
  // reqidに紐づいたリクエストが見つからない場合エラーを返す
  if (!requests) {
    res.render("warn", { message: "No matching authorization request" });
    return;
  }
  // ユーザーが許可した場合
  if (req.body.action === "approve") {
    if (requests.response_type === "code") {
      const scope = getScopesFromForm(req.body);
      const client = getClient(requests.client_id);

      if (_.difference(scope, client.scope).length === client.scope.length) {
        const urlParsed = buildUrl(requests.redirect_uri, {
          error: "invalid_scope",
        });
        res.redirect(urlParsed);
        return;
      }
      // 認可コードの生成
      const code = randomstring.generate(16);

      const urlParams = {
        code: code,
      };

      if (requests.state) {
        urlParams.state = requests.state;
      }

      req.session.requests = {};
      req.session.requests[code] = requests;
      req.session.requests[code].scope = scope;

      const urlParsed = buildUrl(requests.redirect_url, urlParams);

      res.redirect(urlParsed);
      return;
    } else {
      const urlParsed = buildUrl(requests.redirect_url, {
        error: "unsupported_response_type",
      });
      res.redirect(urlParsed);
      return;
    }
  }
  // ユーザーが拒否した場合
  else {
    const urlParsed = buildUrl(requests.redirect_url, {
      error: "accsess_denied",
    });
    res.redirect(urlParsed);
    return;
  }
});

// トークンエンドポイント
router.post("/token", function (req, res, next) {
  // クライアント情報をAuthorizationヘッダーに登録してきた場合
  const auth = req.headers["authorization"];
  let clientId;
  let clientSecret;

  if (auth) {
    const clientCredentials = decodeClientCredentials(auth);
    clientId = clientCredentials.id;
    clientSecret = clientCredentials.secret;
  }

  // クライアント情報をformパラメーターに登録してきた場合
  if (req.body.client_id) {
    // Authorizationヘッダーとボディ両方に含めている場合はエラーを返す
    if (clientId) {
      res.status(401).json({ error: "invalid_client" });
      return;
    }
    clientId = req.body.client_id;
    clientSecret = req.body.client_secret;
  }

  // クライアント認証処理
  const client = getClient(clientId);

  if (!client) {
    res.status(401).json({ error: "invalid_client" });
    return;
  }

  if (client.client_secret !== clientSecret) {
    res.status(401).json({ error: "invalid_clientsecret" });
    return;
  }

  /*
  必須パラメータチェック
  */

  // 認可コードグラントの場合
  if (req.body.grant_type === "authorization_code") {
    const requests = req.session.requests[req.body.code];
    delete req.session.requests[req.body.code];
    // 前回のセッションで使用した認可コードと同じ場合
    if (requests) {
      // 前回のセッションで渡されたclient_idと同じかチェック
      if (requests.client_id === clientId) {
        // トークンの生成
        const access_token = randomstring.generate();
        const refresh_token = randomstring.generate();

        nosql.insert({
          access_token: access_token,
          client_id: clientId,
          scope: requests.scope,
        });
        nosql.insert({
          refresh_token: refresh_token,
          client_id: clientId,
          scope: requests.scope,
        });

        res.status(200).json({
          access_token: access_token,
          refresh_token: refresh_token,
          token_type: "Bearer",
          scope: requests.scope.join(" "),
        });
        return;
      }
      // 異なる場合
      else {
        // エラーを返す
        res.status(400).json({ error: "invalid_grant" });
        return;
      }
    }
    // 前回のセッションで使用した認可コードと異なる場合
    else {
      // エラーを返す
      res.status(400).json({ error: "invalid_grant" });
      return;
    }
  }
  // リフレッシュトークンの場合
  else if (res.body.grant_type === "refresh_token") {
    nosql.one().make(function (builder) {
      builder.where("refresh_token", req.body.refresh_token);
      builder.callback(function (err, token) {
        if (token) {
          if (token.client_id != clientId) {
            nosql.remove().make(function (builder) {
              builder.where("refresh_token", req.body.refresh_token);
            });
            res.status(400).json({ error: "invalid_grant" });
            return;
          }

          const access_token = randomstring.generate();
          nosql.insert({ access_token: access_token, client_id: clientId });
          const token_response = {
            access_token: access_token,
            token_type: "Bearer",
            refresh_token: token.refresh_token,
          };
          res.status(200).json(token_response);
          return;
        } else {
          res.status(400).json({ error: "invalid_grant" });
          return;
        }
      });
    });
  }
  // それ以外の付与法新規の場合
  else {
    // エラーを返す
    res.status(400).json({ error: "unsupported_grant_type" });
    return;
  }
});

module.exports = router;
