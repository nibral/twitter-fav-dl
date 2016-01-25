'use strict'

const twitter = require('./twitter');

// 引数チェック
if (process.argv.length != 3) {
    console.log('usage:node app.js screen_name');
    return;
}
const screenName = process.argv[2];

// Likeした画像のURLを取得(最大200件)
twitter.getFavoriteImageURLArray(screenName, (imageURLs) => {
    for(let i = 0; i < imageURLs.length; i++) {
        console.log(imageURLs[i]);
    }
});
