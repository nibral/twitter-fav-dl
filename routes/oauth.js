'use strict'

const express = require('express');
const router = express.Router();

// Twitter OAuth
const twitter = require('../lib/twitter');
let oauthRequestToken = null;

// OAuthリクエスト
router.get('/', (request, response) => {
    twitter.OAuth().then((oauthToken) => {
        oauthRequestToken = oauthToken;
        response.redirect(oauthToken.redirectURL);
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: JSON.stringify(error)
        });
    });
});

// Twitterから呼ばれるOAuthコールバック
router.get('/callback', (request, response) => {
    twitter.OAuthCallback(oauthRequestToken, request.query).then((userAccessToken) => {
        // cookieにユーザ情報を保存
        request.session.user = userAccessToken;
        response.redirect('/');
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: JSON.stringify(error)
        });
    });
    oauthRequestToken = null;
});

module.exports = router;
