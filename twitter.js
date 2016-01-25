'use strict'

// Twitterアクセス設定
const Twitter = require('twitter');
const config = require('./config');
const client = new Twitter({
    consumer_key:           config.TWITTER_CONSUMER_KEY,
    consumer_secret:        config.TWITTER_CONSUMER_SECRET,
    access_token_key:       config.TWITTER_ACCESS_TOKEN,
    access_token_secret:    config.TWITTER_ACCESS_TOKEN_SECRET
});

// 指定したscreen_nameのユーザのLike数を取得する
module.exports.getFavoriteCount = (screenName, callback) {
    const params = {
        screen_name: screenName
    }    
    client.get('users/show', params, (error, info, response) => {
        if(error) {
            throw error;
        }
        callback(info.favourites_count);
    });
}

// 指定したscreen_nameのユーザのLikeを取得し、画像URLの配列を返す
module.exports.getFavoriteImageURLArray = (screenName, callback) {
    const numOfTweetsPerRequest = 200;
    
    // パラメータ設定
    const params = {
        screen_name: screenName,
        count: numOfTweetsPerRequest
    };
    
    // リクエスト発行
    client.get('favorites/list', params, (error, tweets, response) => {
        if(error) {
            throw error;
        }
        
        // 画像が含まれる場合のみURLを取得して配列に追加
        let imageURLs = new Array();
        for(let tj = 0; tj < tweets.length; tj++) {
            const tweet = tweets[tj];
            const tweetID = tweet.id_str;
            if(tweet.extended_entities) {
                const medias = tweet.extended_entities.media;
                if(medias) {
                    for(let mk = 0; mk < medias.length; mk++) {
                        if(medias[mk].type === 'photo') {
                            imageURLs.push(medias[mk].media_url_https + ':orig');
                        }
                    }
                }
            }
        }
        callback(imageURLs);
    });
}

