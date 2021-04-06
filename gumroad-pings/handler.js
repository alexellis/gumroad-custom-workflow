'use strict'

const axios = require("axios")
const fs = require('fs')
const moment = require("moment")
const fsPromises = fs.promises

module.exports = async (event, context) => {
  let d = new Date().getTime()
  let payload = event.body.toString('utf-8')

  let uri = await fsPromises.readFile("/var/openfaas/secrets/slack-url", "utf8")
  let sellerID = await fsPromises.readFile("/var/openfaas/secrets/seller-id", "utf8")

  let endDate = process.env.promotion_end_date

  var qs = require('querystring');
  var parts = qs.parse(payload)

  if(parts["seller_id"] == sellerID) {
    let m = {"text": `:moneybag: ${parts["product_name"]} (${parts["short_product_id"]}) (${parts["variants[]"]}) - ${parts.price/100}${parts.currency.toUpperCase()} by email ${parts.email} in ${parts["ip_country"]}`}
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

  // 50 USD is the qualifying tier for the offer, but 40 USD is
  // for when people use a 20% off discount code.
  let upgrades = [40, 50]

  // Don't apply the promotion email to every product of this price.
  var desiredShortProductID = process.env.short_product_id;
  var shortProductID = parts["short_product_id"]
  if(desiredShortProductID == shortProductID && upgrades.includes(paid)) {
    if(moment().isBefore(moment(endDate))) {
      console.log(`Sending email to: ${parts.email}`)

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
    } else {
      console.log(`Skipped email to: ${parts.email}, reason: end-date`)
    }
  }

  return context
    .status(200)
    .succeed("OK")
}

