var express = require("express");
const router = express.Router();

const algosdk = require("algosdk");
const indexer_token = "";
const indexer_server = "http://localhost";
const indexer_port = 8980;

const transactionsHelper = require("../helpers/transactions")

const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const algodServer = "http://localhost";
const algodPort = 4001;

let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

const FAUCET_PASSPHRASE = "boss enemy gift student resource spend garment regret master across gun culture bag sauce pride grace steak general school wheel kiwi cannon upon abstract aisle"

// Instantiate the indexer client wrapper
let client = new algosdk.Indexer(indexer_token, indexer_server, indexer_port);

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log("Transaction router: ", Date.now());
  next();
});

// get latest 10 transactions
router.get("/", async function (req, res) {
  let limit = 10;
  let transactionInfo = await client.searchForTransactions().limit(limit).do();

  const transactions = transactionInfo.transactions.map((tx) => ({
    id: tx.id,
    fee: tx.fee,
    confirmed: tx['confrimed-round'],
    from: tx.sender,
    to: tx['payment-transaction'].receiver,
    amount: tx['payment-transaction'].amount,
    algo: (tx['payment-transaction'].amount / 1000000)
  }));

  res.send(transactions);
});

// faucet: send 1234 microALGO tokens to a specific account
router.post("/faucet", async function (req, res) {
  const receiver = req.body.receiver
  const faucetAccount = algosdk.mnemonicToSecretKey(FAUCET_PASSPHRASE);

  let params = await algodClient.getTransactionParams().do();
  params.flatFee = true;
  params.fee = 1000;

  let note = algosdk.encodeObj("Faucet");
  let txn = algosdk.makePaymentTxnWithSuggestedParams(
    faucetAccount.addr,
    receiver,
    1234,
    undefined,
    note,
    params
  );

  let signedTxn = txn.signTxn(faucetAccount.sk);
  let txId = txn.txID().toString();
  console.log("Signed transaction with txID: %s", txId);

  await algodClient.sendRawTransaction(signedTxn).do();
  await transactionsHelper.waitForConfirmation(algodClient, txId, 5);

  res.send({
    status: 200,
    id: txId,
    from: faucetAccount.addr,
    to: receiver,
    amount: 1234
  })
})

module.exports = router;
