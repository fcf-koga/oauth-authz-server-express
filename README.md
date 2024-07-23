<div id="top"></div>

## 使用技術一覧

<!-- シールド一覧 -->
<!-- 該当するプロジェクトの中から任意のものを選ぶ-->
<p style="display: inline">
  <!-- フロントエンドのフレームワーク一覧 -->
  <img src="https://img.shields.io/badge/-Node.js-000000.svg?logo=node.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-express-000000.svg?logo=express.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-javascript-F7DF1E.svg?logo=javascript&style=for-the-badge">
</p>

## 目次

1. [リポジトリについて](#リポジトリについて)
2. [環境](#環境)
3. [ディレクトリ構成](#ディレクトリ構成)
4. [開発環境構築](#開発環境構築)

## リポジトリについて

簡易の OAuth 認可サーバの実装

## 環境

<!-- 言語、フレームワーク、ミドルウェア、インフラの一覧とバージョンを記載 -->

| 言語・フレームワーク | バージョン |
| -------------------- | ---------- |
| Node.js              | 20.14.0    |
| Express.js           | 4.16.1     |

その他のパッケージのバージョンは package.json を参照してください

<p align="right">(<a href="#top">トップへ</a>)</p>

## ディレクトリ構成

<!-- Treeコマンドを使ってディレクトリ構成を記載 -->

❯ tree -a -I "node_modules|.next|.git|.pytest_cache|static" -L 2
.
├── .gitignore
├── README.md
├── app.js
├── bin
│ └── www
├── config.js
├── database.nosql
├── eslint.config.js
├── package-lock.json
├── package.json
├── public
│ ├── images
│ ├── javascripts
│ └── stylesheets
├── routes
│ └── index.js
├── test
│ └── oauth-authz-server-express.postman_collection.json
├── utils.js
└── views
├── approve.pug
├── error.pug
├── index.pug
├── layout.pug
└── warn.pug

<p align="right">(<a href="#top">トップへ</a>)</p>

## 開発環境構築

### change directory

```
cd oauth-authz-server-express
```

### install dependencies

```
npm install
```

### run the app

```
DEBUG=oauth-authz-server-express:* npm start
```

### 動作確認

http://localhost:3000 にアクセスできるか確認
アクセスできたら成功

## Setup

### change directory

```
cd oauth-authz-server-express
```

### install dependencies

```
npm install
```

### run the app

```
DEBUG=oauth-authz-server-express:* npm start
```
