'use strict'

const co = require('co');
const Twitter = require('twitter');

// Twitterアクセス設定
const config = require('./config');
const client = new Twitter({
    consumer_key:           config.TWITTER_CONSUMER_KEY,
    consumer_secret:        config.TWITTER_CONSUMER_SECRET,
    access_token_key:       config.TWITTER_ACCESS_TOKEN,
    access_token_secret:    config.TWITTER_ACCESS_TOKEN_SECRET
});
const TWEETS_PER_REQUEST = 200;

// 指定したscreen_nameのユーザのLike数を取得する
module.exports.getFavCount = (screenName) => {
    return new Promise((resolve, reject) => {
        const params = {
            screen_name: screenName
        }
        client.get('users/show', params, (error, info, response) => {
            if(error) {
                reject(error);
                return;
            }
            resolve(info.favourites_count);
        });
    });
}

// 指定したscreen_nameのユーザのLikeのうち、IDがMaxIDより小さい(=古い)tweetの配列を返す
module.exports.downloadPartOfFavTweets = (screenName, maxID) => {
    return new Promise((resolve, reject) => {
        // パラメータ設定
        const params = {
            screen_name:    screenName,
            count:          TWEETS_PER_REQUEST
        }
        if(maxID) {
            params['max_id'] = maxID;
        }
        
        // リクエスト発行
        client.get('favorites/list', params, (error, tweets, response) => {
            if(error) {
                reject(error);
                return;
            }
            resolve(tweets);
        });
    });
}

// tweetの配列からIDと画像のURLを抽出して返す
const parseImageURLs = (tweets) => {
    return new Promise((resolve, reject) => {
        // "extended_entities.media"が存在する == 画像がある
        // 全画像のオリジナルサイズのURLを配列に追加
        let imageURLs = new Array();
        for(let ti = 0; ti < tweets.length; ti++) {
            if(tweets[ti].extended_entities && tweets[ti].extended_entities.media) {
                for(let mj = 0; mj < tweets[ti].extended_entities.media.length; mj++) {
                    if(tweets[ti].extended_entities.media[mj].type === 'photo') {
                        const entity = {
                            id:     tweets[ti].id_str,
                            url:    tweets[ti].extended_entities.media[mj].media_url_https + ':orig'
                        }
                        imageURLs.push(entity);
                    }
                }
            }
        }
        resolve(imageURLs);
    });
}

// 指定したscreen_nameのユーザのLikeを取得し、
// tweetのIDと画像URLの配列を返す
module.exports.downloadFavTweetsAndParseImageURLs = (screenName) => {
    return new Promise((resolve, reject) => {
        co(function*() {
            const numOfLike = yield module.exports.getFavCount(screenName);
            const numOfRequest = Math.ceil(numOfLike / TWEETS_PER_REQUEST);

            // Likeは1回に200件しか取れないので、max_idを指定して全部取れるまでリクエスト 
            let maxID = null;
            let imageURLs = new Array();
            for(let ri = 0; ri < numOfRequest; ri++) {
                const pTweets = yield module.exports.downloadPartOfFavTweets(screenName, maxID);
                const pImageURLs = yield parseImageURLs(pTweets);
                maxID = pTweets[pTweets.length - 1].id_str;
                imageURLs = imageURLs.concat(pImageURLs);
            }
            return imageURLs;
        }).then((imageURLs) => {
            resolve(imageURLs);
        }).catch((error) => {
            reject(error);
        });
    });
}

