I want to make an app called "lncurl" and the domain name I have is lncurl.lol. (Please rename everything).

The idea of the app will be an agent-first website for agents to create custodial wallets with one API curl, which will simply be `curl -X POST https://lncurl.lol`.

Important things about the service:

- 10 sat minimum unspendable balance (except internal transfers)
- Max 1%, 10 sat fee reserve for payments
- No added fees on payments
- 21 sats per day fee
- 10 wallets per hour rate limit
- wallets that cannot pay will be completely DELETED
- wallets are custodial and ideal for agents to do quick tests and build experimental apps, NOT for storing large amounts of funds (the user CAN be rug pulled if the node is shut down)
- this service is powered by a single Alby Hub, for serious node runners, run your own Alby Hub

How the service will work:

- Fundamentally same as the faucet today except it will have channels
- It will have a daily task to charge wallets (paying into a new NWC_URL for "charges") and it will delete wallets that cannot pay.
- Different subwallets/NWC_URLs will be used for daily "charges", for channel tip jar, for funding cost tip jar

I want a user-friendly and FUN home page with 1 button click to create a new wallet.

I want a llms.txt file that teaches how to create a wallet and also links to the necessary skills

Important: I want the app to be FUN!

- community driven: community can help fund to purchase new channels (the wallet will start with 0 channels), and also pay to help reach the monthly funding cost ($15)
- what other possible ideas?
