'use strict'

const axios = require("axios")
const fs = require('fs');
const fsPromises = fs.promises;

module.exports = async (event, context) => {
  let d = new Date().getTime()
  let payload = event.body.toString('utf-8')
  // console.log(d, event.headers)
  // console.log(d, event.query)
  // console.log(d, payload)

  let uri = await fsPromises.readFile("/var/openfaas/secrets/slack-url", "utf8")
  let sellerID = await fsPromises.readFile("/var/openfaas/secrets/seller-id", "utf8")

  var qs = require('querystring');
  var parts = qs.parse(payload)
  if(parts["seller_id"] == sellerID) {
    let m = {"text": `:moneybag: ${parts["product_name"]} (${parts["variants[]"]}) - ${parts.price/100}${parts.currency.toUpperCase()} by email ${parts.email} in ${parts["ip_country"]}`}
    let res = await axios({
      method: 'post',
      url: uri.toString(),
      data: JSON.stringify(m),
      headers: {"Content-Type": "application/json"}
    })

    console.log(d, `Slack status: ${res.status}`)
  } else {
    console.log(d, `Incorrect seller ID`)
  }
  return context
    .status(200)
    .succeed("OK")
}

