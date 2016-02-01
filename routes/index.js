'use strict'

const express = require('express');
const router = express.Router();
const co = require('co');
const twitter = require('../lib/twitter');

// トップページ
router.get('/', (request, response) => {
    // cookieにユーザ情報がない場合、認証画面へ飛ばす
    if (!request.session.user) {
        response.send(process.env.PORT);
        //response.redirect('/oauth');
        return;
    }

    const twitterClient = twitter.getInstance(request.session.user.accessToken, request.session.user.accessTokenSecret);
    twitter.getUserInfo(twitterClient, request.session.user.screenName).then((userInfo) => {
        response.render('layout', {
            title: userInfo.screen_name,
            content: JSON.stringify(userInfo, null, '    ')
        })
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: JSON.stringify(error)
        });
    });
});

module.exports = router;
