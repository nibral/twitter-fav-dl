'use strict'

const express = require('express');
const router = express.Router();
const co = require('co');

// トップページ
router.get('/', (request, response) => {
    response.render('layout', {
        title: 'pritty title',
        content: 'very interesting content'
    });
});

// Twitter OAuth
const twitter = require('../lib/twitter');
let twitterClient = null;
let oauthRequestToken = null;

// OAuthリクエスト
router.get('/oauth', (request, response) => {
    twitter.OAuth().then((oauthToken) => {
        oauthRequestToken = oauthToken;
        response.redirect(oauthToken.redirectURL);
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: error
        });
    });
});

// Twitterから呼ばれるOAuthコールバック
router.get('/oauth/callback', (request, response) => {
    twitter.OAuthCallback(oauthRequestToken, request.query).then((userOAuthInfo) => {
        twitterClient = userOAuthInfo.client;
        response.redirect('/' + userOAuthInfo.userAccessToken.screen_name);
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: error
        });
    });
    oauthRequestToken = null;
});

// ユーザページ
router.get('/:screenName', (request, response) => {
    twitter.getUserInfo(twitterClient, request.params.screenName).then((userInfo) => {
        response.render('layout', {
            title: userInfo.screen_name,
            content: JSON.stringify(userInfo, null, '    ')
        })
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: error
        });
    });
});

module.exports = router;
