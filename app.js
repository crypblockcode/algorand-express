const express = require('express')
const app = express()
const port = 3000

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const transactions = require('./routes/transactions')
const assets = require('./routes/assets')
const accounts = require('./routes/accounts')

app.get('/', (req, res) => {
  res.send('Hello Algorand!')
})

// routes
app.use('/transactions', transactions)
app.use('/assets', assets)
app.use('/accounts', accounts)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
