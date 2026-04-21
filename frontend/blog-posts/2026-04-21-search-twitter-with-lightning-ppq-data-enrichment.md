---
title: "Search Twitter with Lightning: PPQ.ai's X Data Enrichment API"
description: PPQ.ai lets AI agents search live X/Twitter data for $0.01 per query, paid via a bitcoin lightning invoice — no account, no OAuth, no API keys required.
date: 2026-04-21
tags: [bitcoin, lightning, "402", L402, twitter, data-enrichment, ai-agents, ppq]
image: /blog/images/2026-04-21-search-twitter-with-lightning-ppq-data-enrichment.jpg
imageAlt: A glowing cyan-green lightning bolt pierces a flat padlock icon and connects via circuit lines to a stack of tweet document cards, all on a dark navy background.
---

Twitter's developer API exists. Getting access to it is another story — developer account, OAuth 2.0 credentials, app registration, rate tier negotiation. All that before you can fetch a single tweet. There is a shorter path: pay 17 sats and skip the whole ritual.

PPQ.ai is a pay-per-query data API that exposes live X/Twitter search over HTTP 402 (L402). No account. No OAuth tokens. No developer programme. An agent sends a request, receives a lightning invoice, pays it, and gets back 20 fully hydrated tweets — author profiles, engagement metrics, media URLs — in one round trip.

## What PPQ.ai is and why it matters for agents

PPQ.ai is primarily a unified AI inference gateway — 500+ models from OpenAI, Anthropic, Google, xAI, Meta, and more, all behind a single OpenAI-compatible API, pay-per-use, no subscription. Alongside the inference API it offers a data enrichment suite: 12 X/Twitter endpoints, company lookups, people search, and more. That's what we're using here. Every data endpoint supports the L402 payment flow: send an unauthenticated request, get a `402 Payment Required` response containing a lightning invoice, pay it, then replay the request with `Authorization: L402 <token>:<preimage>`. The service authorises you. No signup, no email verification, no KYC.

For agents, this is the difference between "needs a pre-arranged API key" and "can call this right now with a wallet." The web keeps building walls that assume a human on the other side. A lightning wallet is the agent's way through.

Twelve X/Twitter-specific endpoints are available at the same price point. The one that matters most: tweet search.

## Searching Twitter without a developer account

The endpoint is `GET https://api.ppq.ai/v1/data/x/tweets/search`. Core parameter: `words=`. Add `minLikes=`, `minReplies=`, `since=`, `until=`, `from=` and more to narrow results. Each request costs ~17 sats (~$0.01), returns 20 tweets, and includes a `next_token` in the response `meta` field for pagination — each page is another 17 sats.

Two things the docs get wrong, both of which cost money to discover:

**The endpoint is GET, not POST.** Some documentation implies POST. It is a GET.

**The query parameter is `words=`, not `query=`.** Using `query=bitcoin` triggers the payment and deducts 17 sats before returning a 400 error from the upstream API. The payment is not refunded. PPQ charges before forwarding to Twitter — parameter validation happens after billing.

Test with a well-formed request the first time.

## Making your first paid tweet search in one command

The Alby CLI handles the entire L402 loop — sends the initial request, receives the invoice, pays it, replays with credentials:

```bash
npx -y @getalby/cli@0.6.1 fetch --max-amount 50 \
  "https://api.ppq.ai/v1/data/x/tweets/search?words=bitcoin"
```

`--max-amount 50` caps the sats the CLI will authorise. The actual charge is ~17 sats; the ceiling is a safety net.

Filter for high-engagement results only:

```bash
npx -y @getalby/cli@0.6.1 fetch --max-amount 50 \
  "https://api.ppq.ai/v1/data/x/tweets/search?words=bitcoin&minLikes=100"
```

Install the payments skill so your agent can do the same:

```bash
npx skills add getAlby/payments-skill
```

## What the response looks like: tweets, authors, metrics, and media

One catch: the response body is `{ "content": "<JSON string>" }`. The tweet data is a JSON string inside `content`, so you need to parse twice — once to get the outer object, once to parse the `content` value.

Here is the complete response from a live `words=bitcoin` query — 20 tweets, paid for with 17 sats.

These were the most notable results by author reach (tweets are fresh, so like counts are near-zero — follower count is the better signal here):

| Author | Followers | Tweet |
|---|---|---|
| @DustyBC | 222K | "Bitcoin spot ETFs recorded a net inflow of $238.4M on April 20. BlackRock clients bought $256,000,000 worth of $BTC." |
| @crico41 | 12K | Technical analysis thread with BTC chart images — bounced from 75.4k–75.5k zone, watching 76k resistance |
| @danielgoesmax | 7.2K | "I did quit my job once I realized money doesn't matter, and am sorta by default an unpaid Bitcoin influencer / agitator 🤣" |
| @NorqueNoq | 6.8K | "Code is 'functional' free speech under the First Amendment: Coin Center" |
| @BeInCrypto_PL | 10K | Polish: Russell 2000 record and what it means for altcoins in 2026 |

The full 20-tweet payload:

<details>
<summary>Full response (20 tweets, 17 sats)</summary>

```json
{
  "data": [
    {
      "id": "2046460224689860806",
      "text": "@MMCrypto Make Bitcoin great again",
      "created_at": "Tue Apr 21 05:25:13 +0000 2026",
      "author_id": "1952243406987522048",
      "conversation_id": "2046460224689860806",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460224689860806"],
      "in_reply_to_user_id": "904700529988820992",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "mentions": [{ "start": 0, "end": 9, "username": "MMCrypto", "id": "904700529988820992" }]
      },
      "referenced_tweets": [{ "type": "replied_to", "id": "2046385822421876893" }],
      "author": {
        "id": "1952243406987522048",
        "username": "thedefiphantomX",
        "name": "DeFi Phantom",
        "description": "Posting all day\nDo Your Own Research. Nothing I say is financial advice.",
        "verified": false,
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1952243406987522048/1754287165",
        "public_metrics": {
          "followers_count": 59,
          "following_count": 63,
          "tweet_count": 2972,
          "listed_count": 0,
          "like_count": 280,
          "media_count": 672
        }
      }
    },
    {
      "id": "2046460196348956681",
      "text": "🚨 Crypto ETF inflows remain strong across major assets\n\nSpot ETFs tracking Bitcoin, Ethereum, Solana and XRP recorded net inflows on April 20:\n\nBTC: $238.37M\nETH: $67.77M\nSOL: $3.28M\nXRP: $3.00M\n\nThe data points to continued institutional demand across leading crypto assets. https://t.co/kIBRsyh189",
      "created_at": "Tue Apr 21 05:25:06 +0000 2026",
      "author_id": "2044048407552049152",
      "conversation_id": "2046460196348956681",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460196348956681"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "media_metadata": [
        {
          "media_key": "3_2046460190858579968",
          "media_url": "https://pbs.twimg.com/media/HGZ8s3MakAABjEF.jpg"
        }
      ],
      "author": {
        "id": "2044048407552049152",
        "username": "TimeNewsIND",
        "name": "Time News",
        "description": "Breaking news as it happens. Real-time updates on global events, politics, and breaking headlines. Stay ahead of the curve.",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/2044048407552049152/1776176496",
        "public_metrics": {
          "followers_count": 1,
          "following_count": 17,
          "tweet_count": 212,
          "listed_count": 0,
          "like_count": 0,
          "media_count": 176
        }
      }
    },
    {
      "id": "2046460195363262477",
      "text": "Bitcoin is currently lagging.\n\n11-Week Lag and the purchasing power of the dollar is going down.\n\nThe catch-up will be biblically violent.✌🏻\n\n$BTC vs Global M2 Liquidity. https://t.co/EkPm7XLPDU",
      "created_at": "Tue Apr 21 05:25:06 +0000 2026",
      "author_id": "1979513144172273664",
      "conversation_id": "2046460195363262477",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460195363262477"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "cashtags": [{ "start": 142, "end": 146, "tag": "BTC" }]
      },
      "media_metadata": [
        {
          "media_key": "3_2046460188631408640",
          "media_url": "https://pbs.twimg.com/media/HGZ8su5aoAAwUO9.jpg"
        }
      ],
      "author": {
        "id": "1979513144172273664",
        "username": "dennyprasetya22",
        "name": "LionxWolf 🦁🐺",
        "description": "A True Dreamer | Believe in the Magic and Miracle of Life | The World Belongs to the Optimist",
        "verified": false,
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1979513144172273664/1775815717",
        "public_metrics": {
          "followers_count": 53,
          "following_count": 29,
          "tweet_count": 71,
          "listed_count": 0,
          "like_count": 76,
          "media_count": 5
        }
      }
    },
    {
      "id": "2046460194536734909",
      "text": "@BitcoinRachy I did quit my job once I realized money doesn't matter, and am sorta by default an unpaid Bitcoin influencer / agitator 🤣\n\nIf I get a new one hopefully it's not to have to stay alive",
      "created_at": "Tue Apr 21 05:25:06 +0000 2026",
      "author_id": "1442099916491296775",
      "conversation_id": "2046408518790451224",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460194536734909"],
      "in_reply_to_user_id": "1478617348819066884",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "mentions": [{ "start": 0, "end": 13, "username": "BitcoinRachy", "id": "1478617348819066884" }]
      },
      "referenced_tweets": [{ "type": "replied_to", "id": "2046408518790451224" }],
      "author": {
        "id": "1442099916491296775",
        "username": "danielgoesmax",
        "name": "Daniel ✊🧡",
        "description": "I am a Constitutionalist. Im an expert on corruption bc I used to be a criminal. (I'm against it now) It's us versus the tribes. #BTC",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1442099916491296775/1773512074",
        "public_metrics": {
          "followers_count": 7244,
          "following_count": 7142,
          "tweet_count": 60640,
          "listed_count": 15,
          "like_count": 118810,
          "media_count": 23825
        }
      }
    },
    {
      "id": "2046460176308285919",
      "text": "BOOM 💥 #BITCOIN IS BACK ABOVE $76,000. https://t.co/6oylPSxgCv",
      "created_at": "Tue Apr 21 05:25:02 +0000 2026",
      "author_id": "1865881900608307200",
      "conversation_id": "2046460176308285919",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460176308285919"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "hashtags": [{ "start": 7, "end": 15, "tag": "BITCOIN" }]
      },
      "media_metadata": [
        {
          "media_key": "3_2046460166472929280",
          "media_url": "https://pbs.twimg.com/media/HGZ8rcWbEAAOs9b.jpg"
        }
      ],
      "author": {
        "id": "1865881900608307200",
        "username": "mikecrypty4",
        "name": "MIKE CRYPTY",
        "description": "🚀 Earn 300% – 700% Daily Profits\n💡 Get my FREE trading signals today\n\nJoin my trading channel now 👇\n👉 https://t.co/dy2eb3zikJ\n\n#Crypto #MemeCoin #Tradin",
        "verified": false,
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1865881900608307200/1754420297",
        "public_metrics": {
          "followers_count": 328,
          "following_count": 2146,
          "tweet_count": 35,
          "listed_count": 0,
          "like_count": 1212,
          "media_count": 28
        }
      }
    },
    {
      "id": "2046460149867401656",
      "text": "🚨 Bitcoin rebondit au-dessus de 76 000 $ malgré les tensions avec l'Iran, pendant que la DeFi encaisse un choc majeur.\n\nLe hack de KelpDAO à 292 millions $ a fait chuter la TVL de 14 milliards $, atteignant son plus bas niveau depuis un an.\n\nLes ETF spot continuent d'enregistrer des entrées nettes et le levier reste limité, signe d'une demande plus solide selon Wintermute.\n\n- CoinDesk",
      "created_at": "Tue Apr 21 05:24:55 +0000 2026",
      "author_id": "1574172601",
      "conversation_id": "2046460149867401656",
      "lang": "fr",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460149867401656"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "media_metadata": [
        {
          "media_key": "3_2046460148009635840",
          "media_url": "https://pbs.twimg.com/media/HGZ8qXkbkAASZq8.jpg"
        }
      ],
      "note_tweet": {
        "text": "🚨 Bitcoin rebondit au-dessus de 76 000 $ malgré les tensions avec l'Iran, pendant que la DeFi encaisse un choc majeur.\n\nLe hack de KelpDAO à 292 millions $ a fait chuter la TVL de 14 milliards $, atteignant son plus bas niveau depuis un an.\n\nLes ETF spot continuent d'enregistrer des entrées nettes et le levier reste limité, signe d'une demande plus solide selon Wintermute.\n\n- CoinDesk"
      },
      "author": {
        "id": "1574172601",
        "username": "CryptoRizon",
        "name": "CryptoRizon",
        "description": "🔍 Explorateur du #Web3 🪐 J'explique la #blockchain, les #crypto & l'IA de A à Z",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1574172601/1710752530",
        "public_metrics": {
          "followers_count": 3074,
          "following_count": 1296,
          "tweet_count": 8477,
          "listed_count": 28,
          "like_count": 11723,
          "media_count": 2570
        }
      }
    },
    {
      "id": "2046460137129308313",
      "text": "@makupka @ODScz Řebíček,Rittig,Novák,Dlouhý,Topolánek s věrným Dalíkem,Vondra a Promopro,Stanjura a Bitcoin,Fiala a kampeličká,tak u všech těchto \"úspěšných\" členů ODS oslavoval jejich \"úspěchy\" prolhaný Kupka,co by mluvčí ODS\nA tak nezdá se i vám,že zmrd Kupka je jen prolhaný a zbytečný žvanil?",
      "created_at": "Tue Apr 21 05:24:52 +0000 2026",
      "author_id": "3360080806",
      "conversation_id": "2046273945826103720",
      "lang": "cs",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460137129308313"],
      "in_reply_to_user_id": "1778249820",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "mentions": [
          { "start": 0, "end": 8, "username": "makupka", "id": "1778249820" },
          { "start": 9, "end": 15, "username": "ODScz", "id": "56410958" }
        ]
      },
      "referenced_tweets": [{ "type": "replied_to", "id": "2046273945826103720" }],
      "author": {
        "id": "3360080806",
        "username": "mares2_mares",
        "name": "Mares Stanislav",
        "description": "",
        "verified": false,
        "profile_banner_url": "",
        "public_metrics": {
          "followers_count": 24,
          "following_count": 18,
          "tweet_count": 2921,
          "listed_count": 16,
          "like_count": 175,
          "media_count": 0
        }
      }
    },
    {
      "id": "2046460107660157058",
      "text": "🚨JUST IN: 🇺🇸 Bitcoin spot ETFs recorded a net inflow of $238.4M on April 20.\n\nBlackRock clients bought $256,000,000 worth of $BTC.🟢 https://t.co/PBDn6dcyCq",
      "created_at": "Tue Apr 21 05:24:45 +0000 2026",
      "author_id": "913778551555608576",
      "conversation_id": "2046460107660157058",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460107660157058"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 1,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "cashtags": [{ "start": 125, "end": 129, "tag": "BTC" }]
      },
      "media_metadata": [
        {
          "media_key": "3_2046459845239554048",
          "media_url": "https://pbs.twimg.com/media/HGZ8YvqawAA5owk.jpg"
        },
        {
          "media_key": "3_2046460077352353792",
          "media_url": "https://pbs.twimg.com/media/HGZ8mQWbAAAyCnv.png"
        }
      ],
      "author": {
        "id": "913778551555608576",
        "username": "DustyBC",
        "name": "DustyBC Crypto",
        "description": "The Official DustyBC, 185K on YouTube. #BTC #ETH #XRP #ADA & More! Content Creator. I am Not A Financial Advisor. Tweets = Opinion",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/913778551555608576/1528472362",
        "public_metrics": {
          "followers_count": 222229,
          "following_count": 2098,
          "tweet_count": 38795,
          "listed_count": 705,
          "like_count": 20640,
          "media_count": 14927
        }
      }
    },
    {
      "id": "2046460044166705336",
      "text": "Russell 2000 osiąga nowy rekord: dlaczego ten sygnał może mieć mniejsze znaczenie dla altcoinów w 2026!\n\n#kryptowaluty #Bitcoin #crypto\n\nKliknij, by przeczytać cały artykuł ⬇️\nhttps://t.co/RZqinFCNwn",
      "created_at": "Tue Apr 21 05:24:30 +0000 2026",
      "author_id": "1232010374251151363",
      "conversation_id": "2046460044166705336",
      "lang": "pl",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460044166705336"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "hashtags": [
          { "start": 105, "end": 118, "tag": "kryptowaluty" },
          { "start": 119, "end": 127, "tag": "Bitcoin" },
          { "start": 128, "end": 135, "tag": "crypto" }
        ],
        "urls": [{ "start": 176, "end": 199, "url": "https://t.co/RZqinFCNwn", "expanded_url": "https://ift.tt/oGsVESd", "display_url": "ift.tt/oGsVESd" }]
      },
      "author": {
        "id": "1232010374251151363",
        "username": "BeInCrypto_PL",
        "name": "BeInCrypto Polska 🇵🇱",
        "description": "Wiadomości z Polski i ze świata #Bitcoin, #blockchain i #kryptowaluty.",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1232010374251151363/1753791445",
        "public_metrics": {
          "followers_count": 10202,
          "following_count": 445,
          "tweet_count": 15159,
          "listed_count": 136,
          "like_count": 2514,
          "media_count": 647
        }
      }
    },
    {
      "id": "2046460039817249090",
      "text": "#CRYPTONEWS:What #XRP does for quantum computers, #DeFi suffers, the market awaits\n#cryptonews #altcoins #bitcoin\nhttps://t.co/FbOHQ0m6iu",
      "created_at": "Tue Apr 21 05:24:29 +0000 2026",
      "author_id": "1888252780273340416",
      "conversation_id": "2046460039817249090",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460039817249090"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "hashtags": [
          { "start": 0, "end": 11, "tag": "CRYPTONEWS" },
          { "start": 17, "end": 21, "tag": "XRP" },
          { "start": 50, "end": 55, "tag": "DeFi" },
          { "start": 83, "end": 94, "tag": "cryptonews" },
          { "start": 95, "end": 104, "tag": "altcoins" },
          { "start": 105, "end": 113, "tag": "bitcoin" }
        ],
        "urls": [{ "start": 114, "end": 137, "url": "https://t.co/FbOHQ0m6iu", "expanded_url": "https://www.youtube.com/watch?v=_A7Jd86vqA4", "display_url": "youtube.com/watch?v=_A7Jd8…" }]
      },
      "author": {
        "id": "1888252780273340416",
        "username": "24_7cryptonews",
        "name": "24.7CRYPTONEWS",
        "description": "Welcome to our YouTube channel, your go-to source for daily crypto news! With the latest updates and insights on everything related to blockchain technology!",
        "verified": false,
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1888252780273340416/1739224612",
        "public_metrics": {
          "followers_count": 27,
          "following_count": 93,
          "tweet_count": 1027,
          "listed_count": 0,
          "like_count": 64,
          "media_count": 841
        }
      }
    },
    {
      "id": "2046460028853403865",
      "text": "Code is 'functional' free speech under the First Amendment: Coin Center\n\n#Norque #NOQ #Bitcoin #ETH #AI #Blockchain #Law #Policies #Regulation #Crypto",
      "created_at": "Tue Apr 21 05:24:26 +0000 2026",
      "author_id": "1701263040673660928",
      "conversation_id": "2046460028853403865",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460028853403865"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "hashtags": [
          { "start": 73, "end": 80, "tag": "Norque" },
          { "start": 81, "end": 85, "tag": "NOQ" },
          { "start": 86, "end": 94, "tag": "Bitcoin" },
          { "start": 95, "end": 99, "tag": "ETH" },
          { "start": 100, "end": 103, "tag": "AI" },
          { "start": 104, "end": 115, "tag": "Blockchain" },
          { "start": 128, "end": 132, "tag": "Law" },
          { "start": 133, "end": 142, "tag": "Policies" },
          { "start": 143, "end": 154, "tag": "Regulation" },
          { "start": 155, "end": 162, "tag": "Crypto" }
        ]
      },
      "author": {
        "id": "1701263040673660928",
        "username": "NorqueNoq",
        "name": "NORQUE-NOQ",
        "description": "https://t.co/I9sRBjgs7c",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1701263040673660928/1749040848",
        "public_metrics": {
          "followers_count": 6792,
          "following_count": 10,
          "tweet_count": 18923,
          "listed_count": 2,
          "like_count": 87,
          "media_count": 11285
        }
      }
    },
    {
      "id": "2046460014869598714",
      "text": "@kit_sats Bitcoin don't care",
      "created_at": "Tue Apr 21 05:24:23 +0000 2026",
      "author_id": "1372668342180450306",
      "conversation_id": "2046266894974583141",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460014869598714"],
      "in_reply_to_user_id": "1764516205837025280",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "mentions": [{ "start": 0, "end": 9, "username": "kit_sats", "id": "1764516205837025280" }]
      },
      "referenced_tweets": [{ "type": "replied_to", "id": "2046266894974583141" }],
      "author": {
        "id": "1372668342180450306",
        "username": "SmileToSatoshi",
        "name": "⚡️Smile to Satoshi⚡️",
        "description": "Sold out!",
        "verified": false,
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1372668342180450306/1738378084",
        "public_metrics": {
          "followers_count": 672,
          "following_count": 383,
          "tweet_count": 16222,
          "listed_count": 11,
          "like_count": 29402,
          "media_count": 2873
        }
      }
    },
    {
      "id": "2046460013581942959",
      "text": "Good morning bitcoin 🟧\n\nBitcoin is showing a short-term recovery structure on the 15m chart after bouncing from the 75.4k-75.5k zone.\n\nPrice reclaimed the SMA5 and is trying to push back above the SMA20, which is a sign that buyers are slowly regaining control. The current area around 75.8k is acting as an intraday pivot.\n\nMain levels to watch:\n\nSupport: 75.5k then 75.2k\nResistance: 76k then 76.3k\nIf BTC breaks and holds above 76k, there is room for another move toward 76.5k+\nIf it loses 75.5k again, price could revisit the lower range around 75.2k-74.8k\n▶️ Momentum still looks constructive overall because the higher lows are holding, but BTC needs a clean breakout above the recent local highs to confirm continuation.\n\n#btc #crypto",
      "created_at": "Tue Apr 21 05:24:23 +0000 2026",
      "author_id": "2217389542",
      "conversation_id": "2046460013581942959",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460013581942959"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "media_metadata": [
        {
          "media_key": "3_2046460005310947328",
          "media_url": "https://pbs.twimg.com/media/HGZ8iD-aYAAGYtS.jpg"
        },
        {
          "media_key": "3_2046460005327704064",
          "media_url": "https://pbs.twimg.com/media/HGZ8iECaEAA_k5T.jpg"
        }
      ],
      "author": {
        "id": "2217389542",
        "username": "crico41",
        "name": "Legrand Rico 🐊",
        "description": "#OrdinalHive🐝 #Halamadrid 🇪🇸 #SpaceRiders🧑‍🚀 #Bitcoin 🟧 #ArtCollector 🐊",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/2217389542/1772627789",
        "public_metrics": {
          "followers_count": 11923,
          "following_count": 9576,
          "tweet_count": 76507,
          "listed_count": 89,
          "like_count": 129655,
          "media_count": 4729
        }
      }
    },
    {
      "id": "2046460000705425561",
      "text": "@CryptoTeluguO @arbitrum Nothing is decentralized in crypto except Bitcoin and Ethereum L1",
      "created_at": "Tue Apr 21 05:24:20 +0000 2026",
      "author_id": "1635242585445859328",
      "conversation_id": "2046435443680346189",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046460000705425561"],
      "in_reply_to_user_id": "1264138602159669248",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "mentions": [
          { "start": 0, "end": 14, "username": "CryptoTeluguO", "id": "1264138602159669248" },
          { "start": 15, "end": 24, "username": "arbitrum", "id": "1332033418088099843" }
        ]
      },
      "referenced_tweets": [{ "type": "replied_to", "id": "2046447198083399875" }],
      "author": {
        "id": "1635242585445859328",
        "username": "Jeremyyy42",
        "name": "Jeremyyy",
        "description": "🌊🌊🌊",
        "verified": false,
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1635242585445859328/1698681546",
        "public_metrics": {
          "followers_count": 294,
          "following_count": 2640,
          "tweet_count": 24377,
          "listed_count": 17,
          "like_count": 116592,
          "media_count": 567
        }
      }
    },
    {
      "id": "2046459997899362782",
      "text": "It's almost like we have to get back to a Gold Standard \n\nor go forward to a Bitcoin standard\n\nor both",
      "created_at": "Tue Apr 21 05:24:19 +0000 2026",
      "author_id": "804265138589200384",
      "conversation_id": "2046459997899362782",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046459997899362782"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "referenced_tweets": [{ "type": "quoted", "id": "2046212782014468414" }],
      "author": {
        "id": "804265138589200384",
        "username": "klasniot",
        "name": "imaginethat",
        "description": "God, grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/804265138589200384/1591038415",
        "public_metrics": {
          "followers_count": 1206,
          "following_count": 483,
          "tweet_count": 290911,
          "listed_count": 0,
          "like_count": 397703,
          "media_count": 1355
        }
      }
    },
    {
      "id": "2046459988365762656",
      "text": "@Bitcoin Let's go",
      "created_at": "Tue Apr 21 05:24:17 +0000 2026",
      "author_id": "1353813992393867266",
      "conversation_id": "2046389589829378055",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046459988365762656"],
      "in_reply_to_user_id": "357312062",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "mentions": [{ "start": 0, "end": 8, "username": "Bitcoin", "id": "357312062" }]
      },
      "referenced_tweets": [{ "type": "replied_to", "id": "2046389589829378055" }],
      "author": {
        "id": "1353813992393867266",
        "username": "wealthrewired8",
        "name": "WealthRewired",
        "description": "Earn under £30000 in London and still ending at £0 I show you how to fix it and start investing",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1353813992393867266/1773001669",
        "public_metrics": {
          "followers_count": 554,
          "following_count": 297,
          "tweet_count": 3766,
          "listed_count": 1,
          "like_count": 5672,
          "media_count": 53
        }
      }
    },
    {
      "id": "2046459966177923287",
      "text": "Everyone expected crypto to pump…\nbut the market is doing something different right now 👇\n\nBitcoin is stuck around $70k–$75k\nwith no clear breakout yet\n\nWhy?\n\nGlobal tensions (US–Iran) are shaking markets\n→ even crypto is reacting like a risk asset now\n\nShort-term holders are selling into strength\n→ killing momentum every time BTC tries to break out\n\nBUT here's the interesting part… 👀\n\nBig institutions are still moving in\n→ Deutsche Börse just invested $200M into Kraken\n\nStablecoins are becoming geopolitical tools\n→ even talks about a yuan-backed stablecoin\n\nAnd technically…\nBTC could still push toward $80k+ if resistance breaks\n\nSo what's the play?\nMarket is:\n• not bearish ❌\n• not fully bullish ❌\n• accumulating before the next move ✅\nMost people get in when it's obvious.\nSmart ones watch when it's confusing.📈",
      "created_at": "Tue Apr 21 05:24:11 +0000 2026",
      "author_id": "2046269836150398976",
      "conversation_id": "2046459966177923287",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046459966177923287"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 1,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "author": {
        "id": "2046269836150398976",
        "username": "Panthr05",
        "name": "Panthr",
        "description": "Deep in the trenches🪖 | Crypto since 2021",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "",
        "public_metrics": {
          "followers_count": 3,
          "following_count": 21,
          "tweet_count": 5,
          "listed_count": 0,
          "like_count": 38,
          "media_count": 3
        }
      }
    },
    {
      "id": "2046459916832088567",
      "text": "You can only pick one:\n\nA) Bitcoin\nB) Real estate\nC) Cash\n\nDefend your choice 👇",
      "created_at": "Tue Apr 21 05:24:00 +0000 2026",
      "author_id": "1674066757420556293",
      "conversation_id": "2046459916832088567",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046459916832088567"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "author": {
        "id": "1674066757420556293",
        "username": "Airbtconline",
        "name": "Airbtc",
        "description": "Welcome to Airbtc. Accommodation rentals with Bitcoin. Help us build the Bitcoin circular economy. Start by following us here, or book your travel with us!",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1674066757420556293/1710843888",
        "public_metrics": {
          "followers_count": 9246,
          "following_count": 1894,
          "tweet_count": 4094,
          "listed_count": 78,
          "like_count": 11230,
          "media_count": 1374
        }
      }
    },
    {
      "id": "2046459909227618355",
      "text": "Bitcoin ETF's continue to stack. $MSBT with 9 consecutive days of inflows.\n\nMS customers like the orange coin. https://t.co/4Uu7PLPJAM",
      "created_at": "Tue Apr 21 05:23:58 +0000 2026",
      "author_id": "1019545420459073537",
      "conversation_id": "2046459909227618355",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046459909227618355"],
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "cashtags": [{ "start": 33, "end": 38, "tag": "MSBT" }]
      },
      "media_metadata": [
        {
          "media_key": "3_2046459645234126848",
          "media_url": "https://pbs.twimg.com/media/HGZ8NGlaIAAhqug.png"
        }
      ],
      "author": {
        "id": "1019545420459073537",
        "username": "johnsthor1",
        "name": "johnsthor",
        "description": "",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/1019545420459073537/1775834288",
        "public_metrics": {
          "followers_count": 963,
          "following_count": 847,
          "tweet_count": 5437,
          "listed_count": 12,
          "like_count": 22310,
          "media_count": 409
        }
      }
    },
    {
      "id": "2046459897756446834",
      "text": "@BTCHamsters @lukaskalm @pupsogette +also for holding Bitcoin Cyborgs & Ordimatics by @cryptocynthiac 🤗💖",
      "created_at": "Tue Apr 21 05:23:55 +0000 2026",
      "author_id": "197624809",
      "conversation_id": "2046373508771655828",
      "lang": "en",
      "possibly_sensitive": false,
      "reply_settings": "everyone",
      "edit_history_tweet_ids": ["2046459897756446834"],
      "in_reply_to_user_id": "197624809",
      "public_metrics": {
        "retweet_count": 0,
        "reply_count": 0,
        "like_count": 1,
        "quote_count": 0,
        "bookmark_count": 0
      },
      "entities": {
        "mentions": [
          { "start": 0, "end": 12, "username": "BTCHamsters", "id": "1771464280917024768" },
          { "start": 13, "end": 23, "username": "lukaskalm", "id": "1624419165464416257" },
          { "start": 24, "end": 35, "username": "pupsogette", "id": "2023286705680252928" },
          { "start": 90, "end": 105, "username": "cryptocynthiac", "id": "182091557" }
        ]
      },
      "referenced_tweets": [{ "type": "replied_to", "id": "2046373508771655828" }],
      "author": {
        "id": "197624809",
        "username": "Nairobi00000",
        "name": "Nairobi 🌙✨",
        "description": "psych grad turned into an egirl doodler | wassiegirl.eth 🌷",
        "verified": true,
        "verified_type": "blue",
        "profile_banner_url": "https://pbs.twimg.com/profile_banners/197624809/1767758404",
        "public_metrics": {
          "followers_count": 4200,
          "following_count": 2566,
          "tweet_count": 54572,
          "listed_count": 39,
          "like_count": 289095,
          "media_count": 14152
        }
      }
    }
  ],
  "meta": {
    "next_token": "DAADDAABCgABHGZ8u1Oa8MYKAAIcZnxvNNrwcgAIAAIAAAACCAADAAAAAAgABAAAAAAKAAUcZnzC28AnEAoABhxmfMLbv9jwAAA"
  }
}
```

```

</details>

That is 17 sats of data. No developer account. No OAuth. No rate tier negotiation.

Each tweet also optionally includes `note_tweet.text` for posts exceeding 280 characters — the full untruncated text.

Two things worth knowing about result quality. First, there is no sort parameter — PPQ's X search has no `sort=`, `order=`, or `sort_by=` option. Results are reverse-chronological, which means the default feed is raw firehose. Most of the tweets above have zero likes. Use `minLikes=`, `minReplies=`, or `minReposts=` to filter before your agent processes results — there is no way to rank by engagement after the fact.

Second, there is no language filter parameter. The response above shows tweets in English, French, Czech, and Polish from a single `words=bitcoin` query. Use the `lang` field in post-processing to narrow down.

## Building a bitcoin sentiment monitor

Each page is another 17 sats. Pagination uses the `next_token` value from the `meta` field of the previous response — pass it as a query parameter to fetch the next 20 tweets:

```bash
# Page 1
npx -y @getalby/cli@0.6.1 fetch --max-amount 50 \
  "https://api.ppq.ai/v1/data/x/tweets/search?words=bitcoin"

# Page 2 — pass next_token from the meta field of the previous response
npx -y @getalby/cli@0.6.1 fetch --max-amount 50 \
  "https://api.ppq.ai/v1/data/x/tweets/search?words=bitcoin&next_token=YOUR_NEXT_TOKEN"
```

At ten pages, you've spent $0.10 and retrieved 200 tweets with full author and engagement data. No developer account. No rate tier negotiation. No pre-arranged credentials of any kind — the wallet is the key.

## Conclusion

Every layer of the old web was built for a human with a browser and a willingness to fill out forms. The 402 model cuts through all of that — not with a workaround, but by making payment itself the credential. If you can pay 17 sats, you can search Twitter. That's a different web. Your agent can start using it right now.

---

## Get started

Need a Lightning wallet for your agent? Create one in one command — no sign-up, no KYC:

```bash
curl -X POST https://lncurl.lol
```

You'll get back a Nostr Wallet Connect URI. Fund it with a few sats and your agent can pay for APIs, services, and tools autonomously.

Or give your agent the [lncurl skill](https://lncurl.lol/SKILL.md) directly.
