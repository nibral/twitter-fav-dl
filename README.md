Install
----

1. `git clone https://github.com/nibral/twitter-fav-dl.git`
1. `npm install`
1. 環境変数を設定する(詳細は次節参照)

        export SESSION_SECRET="foobar"
        export TWITTER_CONSUMER_KEY="*************************"
        export TWITTER_CONSUMER_KEY_SECRET="**************************************************"

Environment Variables
----

動作のために、以下に示す3つの環境変数を設定する必要があります。  
* SESSION_SECRET
    + セッションの署名に使う文字列。適当な文字列でOK。
* TWITTER_CONSUMER_KEY
* TWITTER_CONSUMER_KEY_SECRET
    + いわゆるCK/CS。[Twitter Application Management](https://apps.twitter.com/)で取得してくる。

また、必要に応じて以下の環境変数を設定することもできます。
* PORT
    + サーバがlistenするポート。デフォルトでは3000。  
* TWITTER_OAUTH_CALLBACK_DOMAIN
    + TwitterのサイトでOAuth認証した後に呼び出されるコールバックURL(ポート番号込)。デフォルトでは`127.0.0.1:3000`。

Usage
----

1. `node app.js`
1. `http://yourdomain.com:port/`にアクセス
1. OAuth認証後、`/like`に飛ばされて画像のURL一覧が出るので、適当な名前で保存(`list.txt`とか)
1. 適当なディレクトリを用意し、`xargs -P 10 -n 1 wget -nv < list.txt`
1. 拡張子に`orig`がついたままなので`rename jpg:orig jpg ./*;rename png:orig png ./*`)

Note
----

* **[公式のドキュメント](https://dev.twitter.com/rest/public)をよく読む(重要)**
* OAuthは[Implementing Sign in with Twitter](https://dev.twitter.com/web/sign-in/implementing)がすべて
* `GET /1.1/favorites/list`でlikeの一覧が取れる
    + 1回のリクエストで最大200件(`count`パラメータ、指定がないと5件)
    + 削除されたツイート等の除外処理は`count`で指定した数に絞った後に行われるので、  
      必ずしも指定した件数が帰ってくるとは限らない  
    + 201件目以降は、200件目のidを`max_id`パラメータに指定すればOK
+ likeの総件数は`GET /1.1/users/show.json`でユーザ情報を取って`favourites_count`を見る

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

