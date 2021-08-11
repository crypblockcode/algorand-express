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
  console.log("Assets router: ", Date.now());
  next();
});

// search for asset by name
router.get("/:name", async function (req, res) {
  const assetSearchName = req.params.name;
  console.log("Searching for asset: ", assetSearchName)

  let assetInfo = await client
    .searchForAssets()
    .name(assetSearchName)
    .do();

  const assets = assetInfo.assets.map(asset => ({
      id: asset.index,
      decimals: asset.params.decimals,
      name: asset.params.name,
      total: asset.params.total,
      frozen: asset.params["default-frozen"]
  }))

  res.send(assets);
});

module.exports = router;
