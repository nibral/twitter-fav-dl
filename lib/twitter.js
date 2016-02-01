'use strict'

const co = require('co');
const qs = require('querystring');
const request = require('request-promise');
const Twitter = require('twitter');

// Twitterアクセス設定
const CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
const CONSUMER_KEY_SECRET = process.env.TWITTER_CONSUMER_KEY_SECRET;
const FAVORITES_PER_REQUEST = 200;

/*
    OAuthリクエスト
    OAuthトークンと認証用のURLを返す
    呼び出し元はこのURLにリダイレクトして、Twitterにログインしてもらう

    oauthToken
    {
        oauth_token: '***************************',
        oauth_token_secret: '********************************',
        oauth_callback_confirmed: 'true'
    }
*/
module.exports.OAuth = () => {
    return new Promise((resolve, reject) => {
        co(function* () {
            // CK/CSが設定されていなかったらreject
            if (!CONSUMER_KEY || !CONSUMER_KEY_SECRET) {
                reject('Unknown application. Set CK/CS in CONSUMER_KEY and CONSUMER_SECRET in config.json.');
                return;
            }

            // step1 OAuthリクエストを発行
            const callbackDomain = process.env.TWITTER_OAUTH_CALLBACK_DOMAIN || '127.0.0.1:3000';
            const oauth = {
                callback: 'http://' + callbackDomain + '/oauth/callback',
                consumer_key: CONSUMER_KEY,
                consumer_secret: CONSUMER_KEY_SECRET
            };
            const oauthTokenReplyBody = yield request.post({
                url: 'https://api.twitter.com/oauth/request_token',
                oauth: oauth
            });
            const oauthToken = qs.parse(oauthTokenReplyBody);

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
            resolve(oauthToken);
        }).catch((error) => {
            reject(error);
        });
    });
}

/*
    OAuthコールバック
    OAuthトークンとコールバックで帰ってきたトークンから
    ユーザのアクセストークンを取得して返す

    oauthCallbackQuery
    {
        oauth_token: '***************************',
        oauth_verifier: '********************************'
    }
*/
module.exports.OAuthCallback = (oauthToken, oauthCallbackQuery) => {
    return new Promise((resolve, reject) => {
        co(function* () {
            if (!oauthToken) {
                reject('OAuth request token not specified.');
                return;
            }
            if (!oauthCallbackQuery.oauth_verifier) {
                reject('OAuth verifier not specified.');
                return;
            }
            
            // step3 ユーザのOAuthトークンを取得
            const oauth = {
                consumer_key: CONSUMER_KEY,
                consumer_secret: CONSUMER_KEY_SECRET,
                token: oauthCallbackQuery.oauth_token,
                token_secret: oauthToken.oauth_token,
                verifier: oauthCallbackQuery.oauth_verifier
            };
            const userAccessTokenReplyBody = yield request.post({
                url: 'https://api.twitter.com/oauth/access_token',
                oauth: oauth
            });
            return qs.parse(userAccessTokenReplyBody);
        }).then((userAccessToken) => {
            resolve({
                userID: userAccessToken.user_id,
                screenName: userAccessToken.screen_name,
                accessToken: userAccessToken.oauth_token,
                accessTokenSecret: userAccessToken.oauth_token_secret
            });
        }).catch((error) => {
            reject(error);
        });
    });
}

// OAuthで取得したアクセストークンからユーザのインスタンスを生成して返す
module.exports.getInstance = (accessToken, accessTokenSecret) => {
    return new Twitter({
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_KEY_SECRET,
        access_token_key: accessToken,
        access_token_secret: accessTokenSecret
    });
}

// 指定したscreen_nameのユーザの情報を取得する
module.exports.getUserInfo = (client, screenName) => {
    return new Promise((resolve, reject) => {
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
const extractImageURLsFromTweets = (tweets) => {
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
module.exports.downloadPartOfFavTweets = (client, screenName, maxID) => {
    return new Promise((resolve, reject) => {
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
module.exports.downloadFavTweetsAndParseImageURLs = (client, screenName) => {
    return new Promise((resolve, reject) => {
        co(function* () {
            const numOfLike = yield module.exports.getFavCount(screenName);
            const numOfRequest = Math.ceil(numOfLike / FAVORITES_PER_REQUEST);

            // Likeは1回に200件しか取れないので、max_idを指定して全部取れるまでリクエスト 
            let maxID = null;
            let imageURLs = new Array();
            for (let ri = 0; ri < numOfRequest; ri++) {
                const pTweets = yield module.exports.downloadPartOfFavTweets(screenName, maxID);
                const pImageURLs = yield extractImageURLsFromTweets(pTweets);
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

