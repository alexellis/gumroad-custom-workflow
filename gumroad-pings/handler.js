'use strict'

const axios = require("axios")
const fs = require('fs');
const fsPromises = fs.promises;

module.exports = async (event, context) => {
  let d = new Date().getTime()
  let payload = event.body.toString('utf-8')

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

  let paid = parts.price/100
  let upgrades = [40, 50]
  if(upgrades.includes(paid)) {
    console.log(`Sending email to ${parts.email}`)

    try {
      let res = await axios({
        method: 'post',
        url: process.env.gateway_url +"function/gumroad-upgrade",
        data: JSON.stringify({"email": parts.email, "sellerID": parts["seller_id"]}),
        headers: {"Content-Type": "application/json"}
      })
    } catch (error) {
      console.error(parts.email, Object.keys(error), error.message, error.response.status, error.response.data);
    }
  }

  return context
    .status(200)
    .succeed("OK")
}

