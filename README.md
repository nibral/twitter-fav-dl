Install
----

1. `git clone https://github.com/nibral/twitter-fav-dl.git`
1. `npm install`
1. `config.json`をつくる(フォーマットは下を参照)

config.json
----

Webアプリ化に伴ってOAuthを実装したので、アクセストークンは不要になりました

    {
        "TWITTER_CONSUMER_KEY":         "*************************",
        "TWITTER_CONSUMER_SECRET":      "**************************************************"
    }

Usage
----

**現在のところ、OAuthで認証してユーザ情報が見られるだけです**

1. `node app.js`
1. `http://yourdomain.com:3000/oauth`にアクセス

待ち受けるポートを変更する場合、環境変数PORTに待ち受けたいポートを設定してから起動する

Note
----

* **[公式のドキュメント](https://dev.twitter.com/rest/public)をよく読む(重要)**
* `GET /1.1/favorites/list`でlikeの一覧が取れる
    + 1回のリクエストで最大200件(`count`パラメータ、指定がないと5件)
    + 201件目以降は、200件目のidを`max_id`パラメータに指定すればOK
    + likeの件数は`GET /1.1/users/show.json`でユーザ情報を取って`favourites_count`を見る

`GET /1.1/favorites/list`のレスポンス構造

    // postの配列
    [
        // 画像があるとき
        {
            ...
            "id": 1234567,
            "extended_entities": {
                ...
                "media": [
                    {
                        // 画像1枚目
                        // URLの末尾に":orig"をつけると原寸になる
                        "media_url": "http://foo/bar.jpg:orig",
                        "media_url_https": "https://foo/bar.jpg:orig",
                        "type": "photo",
                        ...
                    },
                    {
                        // 2枚目
                    }
                ]
                ...
            }
            ...
        },
        // 画像がないとき
        {
            ...
            "id": 1234560,
            "entities": {
                // mediaがない
            }
        },
    ]

License
----

(c) 2016 nibral
    
Released under MIT License.

[http://opensource.org/licenses/mit-license.php](http://opensource.org/licenses/mit-license.php)

