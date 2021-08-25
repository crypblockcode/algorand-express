var express = require("express");
const router = express.Router();

const algosdk = require("algosdk");
const indexer_token = "";
const indexer_server = "http://localhost";
const indexer_port = 8980;

const kmdtoken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const kmdserver = 'http://localhost';
const kmdport = 4002;

const kmdclient = new algosdk.Kmd(kmdtoken, kmdserver, kmdport);

// Instantiate the indexer client wrapper
let client = new algosdk.Indexer(indexer_token, indexer_server, indexer_port);

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log("Account router: ", Date.now())
  next()
});

// create new account - not a best practice to return the wallet password via the API
// hardcoded wallet name and password -> therefore only works once - better to use AIKON Ore ID alternative for managing wallets
router.get("/create", async function (req, res) {
    console.log('Creating new wallet')
    let walletid = (await kmdclient.createWallet("MyTestWallet", "testpassword", "", "sqlite")).wallet.id;
    console.log("Created wallet:", walletid);

    let wallethandle = (await kmdclient.initWalletHandle(walletid, "testpassword")).wallet_handle_token;
    console.log("Got wallet handle:", wallethandle);

    let address1 = (await kmdclient.generateKey(wallethandle)).address;
    console.log("Created new account:", address1);
    
  res.send('account')
});

// get account info
// @query {string} /:address?extended -- Return detailed asset information
router.get("/:address", async function(req, res) {
    let acc = req.params.address
    let accountInfo = await client.lookupAccountByID(acc).do()

    const account = {
        address: req.params.address,
        amount: accountInfo.account.amount,
        algo: (accountInfo.account.amount / 1000000),
        assets: accountInfo.account.assets.map(asset => ({ id: asset['asset-id'], amount: asset.amount })),
        status: accountInfo.account.status
    }

    if (typeof req.query.extended !== 'undefined' && account.assets.length > 0) {
        const assetsDetails = await Promise.all(account.assets.map(asset => client.lookupAssetByID(asset.id).do()))

        account.assets.map(asset => {
            const assetDetail = assetsDetails.find(assetDetail => asset.id === assetDetail.asset.index)

            asset.decimals = assetDetail.asset.params.decimals
            asset.name = assetDetail.asset.params.name || ''
            asset['unit-name'] = assetDetail.asset.params['unit-name'] || ''
            asset.url = assetDetail.asset.params.url
            return asset
        })
    }

    res.send(account)
});

// get transactions for account
router.get("/:address/transactions", async function(req, res) {
    let acc = req.params.address
    let accountInfo = await client.lookupAccountTransactions(acc).do()

    const transactions = accountInfo.transactions.map(tx => {
        const enc = new TextEncoder();
        let note = enc.encode(tx.note);
        const s = Buffer.from(note).toString("utf8");

        const transaction = {
            id: tx.id,
            fee: tx.fee,
            note: tx.note,
            notex: s,
            from: tx.sender,
            type: tx['tx-type']
        }

        if (tx['tx-type'] === 'pay') {
            transaction.receiver = tx['payment-transaction'].receiver
            transaction.amount = tx['payment-transaction'].amount
        }

        return transaction
    })

    res.send(transactions)
});

module.exports = router;
