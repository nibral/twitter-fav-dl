'use strict'

const co = require('co');
const qs = require('querystring');
const request = require('request-promise');
const Twitter = require('twitter');

// Twitterアクセス設定
const config = require('../config');
const CONSUMER_KEY = config.TWITTER_CONSUMER_KEY;
const CONSUMER_SECRET = config.TWITTER_CONSUMER_SECRET;
const FAVORITES_PER_REQUEST = 200;
let oauthRequestToken = null;
let client = null;

// OAuthリクエスト
module.exports.OAuth = () => {
    return new Promise((resolve, reject) => {
        co(function* () {
            // CK/CSが設定されていなかったらreject
            if (!CONSUMER_KEY || !CONSUMER_SECRET) {
                reject('Unknown application. Set CK/CS in CONSUMER_KEY and CONSUMER_SECRET in config.json.');
                return;
            }

            // step1 OAuthリクエストを発行
            const oauth = {
                callback: config.TWITTER_OAUTH_CALLBACK_URL || 'http://127.0.0.1:3000/oauth/callback',
                consumer_key: CONSUMER_KEY,
                consumer_secret: CONSUMER_SECRET
            };
            const oauthTokenResponseBody = yield request.post({
                url: 'https://api.twitter.com/oauth/request_token',
                oauth: oauth
            });
            const oauthToken = qs.parse(oauthTokenResponseBody);
            /*  oauthToken
                {
                    oauth_token: '***************************',
                    oauth_token_secret: '********************************',
                    oauth_callback_confirmed: 'true'
                }
            */

            // step2 リダイレクトURL生成
            if (oauthToken.oauth_callback_confirmed) {
                oauthToken['redirectURL'] =
                'https://api.twitter.com/oauth/authenticate' + '?' + qs.stringify({ oauth_token: oauthToken.oauth_token });
                return oauthToken;
            } else {
                // コールバックが承認されていなかったらreject
                reject('OAuth rejected by Twitter.');
                return;
            }
        }).then((oauthToken) => {
            oauthRequestToken = oauthToken;
            resolve(oauthToken);
        }).catch((error) => {
            reject(error);
        });
    });
}

// OAuthコールバック
module.exports.OAuthCallback = (oauthCallbackQuery) => {
    /*  oauthCallbackQuery
        {
            oauth_token: '***************************',
            oauth_verifier: '********************************'
        }            
    */
    return new Promise((resolve, reject) => {
        co(function* () {
            if (!oauthRequestToken) {
                reject('OAuth request token not specified.');
            }
            if (!oauthCallbackQuery.oauth_verifier) {
                reject('OAuth verifier not specified.');
            }
            
            // ユーザのOAuthトークンを取得
            const oauth = {
                consumer_key: CONSUMER_KEY,
                consumer_secret: CONSUMER_SECRET,
                token: oauthCallbackQuery.oauth_token,
                token_secret: oauthRequestToken.oauth_token,
                verifier: oauthCallbackQuery.oauth_verifier
            };
            const userOAuthTokenResponseBody = yield request.post({
                url: 'https://api.twitter.com/oauth/access_token',
                oauth: oauth
            });
            return qs.parse(userOAuthTokenResponseBody);
        }).then((userOAuthToken) => {
            client = new Twitter({
                consumer_key: CONSUMER_KEY,
                consumer_secret: CONSUMER_SECRET,
                access_token_key: userOAuthToken.oauth_token,
                access_token_secret: userOAuthToken.oauth_token_secret
            });
            oauthRequestToken = null;
            resolve(userOAuthToken);
        }).catch((error) => {
            reject(error);
        });
    });
}

// 指定したscreen_nameのユーザの情報を取得する
module.exports.getUserInfo = (screenName) => {
    return new Promise((resolve, reject) => {
        if (!client) {
            reject('Unknown user. This method requires OAuth first.');
        }

        const params = {
            screen_name: screenName
        }
        client.get('users/show', params, (error, info, response) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(info);
        });
    });
}

// tweetの配列からIDと画像のURLを抽出して返す
const parseImageURLs = (tweets) => {
    return new Promise((resolve, reject) => {
        try {
            // "extended_entities.media"が存在する == 画像がある
            // 全画像のオリジナルサイズのURLを配列に追加
            let imageURLs = new Array();
            for (let ti = 0; ti < tweets.length; ti++) {
                if (tweets[ti].extended_entities && tweets[ti].extended_entities.media) {
                    for (let mj = 0; mj < tweets[ti].extended_entities.media.length; mj++) {
                        if (tweets[ti].extended_entities.media[mj].type === 'photo') {
                            const entity = {
                                id: tweets[ti].id_str,
                                url: tweets[ti].extended_entities.media[mj].media_url_https + ':orig'
                            }
                            imageURLs.push(entity);
                        }
                    }
                }
            }
            resolve(imageURLs);
        } catch (error) {
            reject(error);
        }
    });
}

// 指定したscreen_nameのユーザのLikeのうち、IDがMaxIDより小さい(=古い)tweetの配列を返す
module.exports.downloadPartOfFavTweets = (screenName, maxID) => {
    return new Promise((resolve, reject) => {
        if (!client) {
            reject('User unknown. This method requires OAuth first.');
        }
        
        // パラメータ設定
        const params = {
            screen_name: screenName,
            count: FAVORITES_PER_REQUEST
        }
        if (maxID) {
            params['max_id'] = maxID;
        }
        
        // リクエスト発行
        client.get('favorites/list', params, (error, tweets, response) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(tweets);
        });
    });
}

// 指定したscreen_nameのユーザのLikeを取得し、tweetのIDと画像URLの配列を返す
module.exports.downloadFavTweetsAndParseImageURLs = (screenName) => {
    return new Promise((resolve, reject) => {
        if (!client) {
            reject('User unknown. This method requires OAuth first.');
            return;
        }

        co(function* () {
            const numOfLike = yield module.exports.getFavCount(screenName);
            const numOfRequest = Math.ceil(numOfLike / FAVORITES_PER_REQUEST);

            // Likeは1回に200件しか取れないので、max_idを指定して全部取れるまでリクエスト 
            let maxID = null;
            let imageURLs = new Array();
            for (let ri = 0; ri < numOfRequest; ri++) {
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

