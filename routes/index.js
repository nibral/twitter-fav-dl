'use strict'

const express = require('express');
const router = express.Router();
const co = require('co');
const twitter = require('../lib/twitter');

// トップページ
router.get('/', (request, response) => {
    response.render('layout', {
        title: 'pritty title',
        content: 'very interesting content'
    });
});

// oauthリクエスト
router.get('/oauth', (request, response) => {
    twitter.OAuth().then((oauthResponse) => {
        response.redirect(oauthResponse.redirectURL);
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: error
        });
    });
});

// Twitterから戻ってきた
router.get('/oauth/callback', (request, response) => {
    twitter.OAuthCallback(request.query).then((userOAuthToken) => {
        response.redirect('/' + userOAuthToken.screen_name);
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: error
        });
    });
});

// ユーザページ
router.get('/:screenName', (request, response) => {
    twitter.getUserInfo(request.params.screenName).then((userInfo) => {
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
