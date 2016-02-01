'use strict'

const express = require('express');
const router = express.Router();
const co = require('co');
const twitter = require('../lib/twitter');

// トップページ
router.get('/', (request, response) => {
    // cookieにユーザ情報がない場合、認証画面へ飛ばす
    if (!request.session.user) {
        response.redirect('/oauth');
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

// Likeの画像URL一覧
router.get('/like', (request, response) => {
    // cookieにユーザ情報がない場合、認証画面へ飛ばす
    if (!request.session.user) {
        response.redirect('/oauth');
        return;
    }

    const twitterClient = twitter.getInstance(request.session.user.accessToken, request.session.user.accessTokenSecret);
    twitter.downloadFavTweetsAndParseImageURLs(twitterClient, request.session.user.screenName).then((imageURLs) => {
        let urlList = '';
        for (let i = 0; i < imageURLs.length; i++) {
            urlList += imageURLs[i].url + '\n';
        }
        response.set('Content-Type', 'text/plain');
        response.send(urlList);
    }).catch((error) => {
        response.render('layout', {
            title: 'Error',
            content: JSON.stringify(error)
        });
    });
});


module.exports = router;
