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

// oauthのリクエスト
router.get('/oauth', (request, response) => {
    response.render('layout', {
        title: 'Sign in with Twitter',
        content: 'redirecting...'
    });
});

// oauthから戻ってきた
router.get('/oauth/callback', (request, response) => {
    response.send(request.headers);
    console.log(request.headers);
});

// ユーザページ
router.get('/:screenName', (request, response) => {
    response.render('layout', {
        title: request.params.screenName,
        content: 'welcome, ' + request.params.screenName + '.'
    });
});

module.exports = router;
