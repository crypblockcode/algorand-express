var express = require("express");
const router = express.Router();

const algosdk = require("algosdk");
const indexer_token = "";
const indexer_server = "http://localhost";
const indexer_port = 8980;

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

module.exports = router;
