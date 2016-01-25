Install
----

1. `git clone https://github.com/nibral/twitter-fav-dl.git`
1. `npm install`
1. `config.json`をつくる(フォーマットは下を参照)

config.json
----

    {
        "TWITTER_CONSUMER_KEY":         "*************************",
        "TWITTER_CONSUMER_SECRET":      "**************************************************",
        "TWITTER_ACCESS_TOKEN":         "**************************************************",
        "TWITTER_ACCESS_TOKEN_SECRET":  "*********************************************"
    }

Usage
----

`node app.js screen_name [noid]`

1. `node app.js screen_name noid > list.txt`(screen_nameは@なしで入力)
1. `list.txt`を適当なディレクトリに移動
1. 移動先で`xargs -P 10 -n 1 wget -nv < list.txt`
1. 拡張子に`orig`がついたままなので`rename jpg:orig jpg ./*;rename png:orig png ./*`

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

