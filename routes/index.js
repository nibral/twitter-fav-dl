'use strict';

const express = require('express');
const router = express.Router();
const co = require('co');
const twitter = require('../lib/twitter');

// トップページ
router.get('/', (request, response) => {
    // cookieにユーザ情報がない場合はログイン画面を表示
    if (!request.session.user) {
        response.render('login', {
            title: 'twitter-fav-dl',
        })
        return;
    }

    // ユーザ情報がある(=ログイン済み)の場合はユーザ情報を表示
    const twitterClient = twitter.getInstance(request.session.user.accessToken, request.session.user.accessTokenSecret);
    twitter.getUserInfo(twitterClient, request.session.user.screenName).then((userInfo) => {
        response.render('user', {
            screenName: userInfo.screen_name,
            favCounts: userInfo.favourites_count,
            userImageUrl: userInfo.profile_image_url_https,
            rawResponse: JSON.stringify(userInfo, null, '    ')
        })
    }).catch((error) => {
        response.render('jsonlist', {
            title: 'Error',
            content: JSON.stringify(error)
        });
    });
});

// Likeの画像URL一覧
router.get('/like', (request, response) => {
    // cookieにユーザ情報がない場合、トップ画面へ飛ばす
    if (!request.session.user) {
        response.redirect('/');
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
        response.render('jsonlist', {
            title: 'Error',
            content: JSON.stringify(error)
        });
    });
});

module.exports = router;
