'use strict'

const co = require('co');
const twitter = require('./twitter');

// 引数チェック
if (process.argv.length < 3) {
    console.log('usage:node app.js screen_name [noid]');
    process.exit(1);
}
const screenName = process.argv[2];
const isPrintID = (process.argv[3] === 'noid') ? false : true;

// LikeしたtweetのIDと画像のURLを取得
co(function*() {
    return yield twitter.downloadFavTweetsAndParseImageURLs(screenName);
}).then((imageURLs) => {
    if(isPrintID) {
        for(let i = 0; i < imageURLs.length; i++) {
            console.log(imageURLs[i].id + ' ' + imageURLs[i].url);
        }
    } else {
        for(let i = 0; i < imageURLs.length; i++) {
            console.log(imageURLs[i].url);
        }
    }
}).catch((error) => {
    console.log(error);
});;

