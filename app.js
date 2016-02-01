'use strict'

const express = require('express');
const app = express();

// Express設定
app.set('view engine', 'jade');

// ミドルウェア設定
const config = require('./config');
const cookieParser = require('cookie-parser');
const session = require('express-session');
app.use(session({                   // セッション設定
    secret: config.SESSION_SECRET,  // ・シークレット
    resave: false,                  // ・リクエストごとにセッションを書き直さない                       
    saveUninitialized: false,       // ・未初期化のセッションは書き込まない
    cookie: {
        maxAge: null                // ・有効期限設定なし(=ブラウザを閉じたら破棄)
    }
}));

// ルーティング
const router = require('./routes');
const oauth = require('./routes/oauth');
app.use('/oauth', oauth);
app.use('/', router);

// サーバ起動
const listenPort = process.env.PORT || 3000;
app.listen(listenPort, () => {
    console.log('start listening on port %d', listenPort);
});
