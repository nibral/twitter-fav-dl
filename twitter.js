'use strict'

// Twitterアクセス設定
var Twitter = require('twitter');
var config = require('./config');
var client = new Twitter({
    consumer_key:           config.TWITTER_CONSUMER_KEY,
    consumer_secret:        config.TWITTER_CONSUMER_SECRET,
    access_token_key:       config.TWITTER_ACCESS_TOKEN,
    access_token_secret:    config.TWITTER_ACCESS_TOKEN_SECRET
});

// 指定したscreen_nameのユーザのLike数を取得する
var getFavoriteCount = function(screenName, callback) {
    var params = {
        screen_name: screenName
    }    
    client.get('users/show', params, function(error, info, response){
        if(error) {
            throw error;
        }
        callback(info.favourites_count);
    });
}

// 指定したscreen_nameのユーザのLikeを取得し、画像URLの配列を返す
module.exports.getFavoriteImageURLArray = function(screenName, numOfMaxTweets, callback) {
    var numOfTweetsPerRequest = (numOfMaxTweets > 200) ? 200 : numOfMaxTweets;
    
    // パラメータ設定
    var params = {
        screen_name: screenName,
        count: numOfTweetsPerRequest
    };
    
    // リクエスト発行
    client.get('favorites/list', params, function(error, tweets, response) {
        if(error) {
            throw error;
        }
        
        // 画像が含まれる場合のみURLを取得して配列に追加
        var imageURLs = new Array();
        for(var tj = 0; tj < tweets.length; tj++) {
            var tweet = tweets[tj];
            // var tweetID = tweet.id_str;
            if(tweet.extended_entities) {
                var medias = tweet.extended_entities.media;
                if(medias) {
                    for(var mk = 0; mk < medias.length; mk++) {
                        if(medias[mk].type === 'photo') {
                            imageURLs.push(medias[mk].media_url_https);
                        }
                    }
                }
            }
        }
        callback(imageURLs);
    });
}

