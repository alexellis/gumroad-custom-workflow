'use strict'

const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const fs = require('fs');
const fsPromises = fs.promises;
const showdown = require('showdown')
const mdConverter = new showdown.Converter()
const textToHTML = require('html-to-text');

const REGION = process.env.region;

var seen = {}

module.exports = async (event, context) => {
  let mdEmail = await fsPromises.readFile("function/emails/message.md", "utf8")

  let sellerID = await fsPromises.readFile("/var/openfaas/secrets/seller-id", "utf8")
  if(event.body.sellerID != sellerID) {
    return context
    .status(403)
    .succeed(`Forbidden`)
  }

  let accessKeyId = await fsPromises.readFile("/var/openfaas/secrets/ses-access-key-id", "utf8")
  process.env.AWS_SECRET_ACCESS_KEY = accessKeyId

  let accessToken = await fsPromises.readFile("/var/openfaas/secrets/ses-access-token", "utf8")
  process.env.AWS_ACCESS_KEY_ID = accessToken

  let secretURL = await fsPromises.readFile("/var/openfaas/secrets/secret-url", "utf8")
  let toEmail = event.body.email

  if(seen[toEmail]) {
    return context
    .status(429)
    .succeed(`Already emailed ${toEmail}, skipping.`)
  }
  seen[toEmail] = 1

  mdEmail = mdEmail.replace("SECRET_URL", secretURL)

  let htmlEmail = mdConverter.makeHtml(mdEmail)
  let textEmail = textToHTML.convert(htmlEmail, {
    wordwrap: 130,
    uppercaseHeadings: false,
    linkBrackets: false})

  // Set the parameters
  const params = {
    Destination: {
      CcAddresses: [
      ],
      ToAddresses: [
        toEmail,
      ],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: htmlEmail,
        },
        Text: {
          Charset: "UTF-8",
          Data: textEmail,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: process.env.subject,
      },
    },
    Source: process.env.sender, // SENDER_ADDRESS
    ReplyToAddresses: [
      process.env.sender
    ],
  };

  // Create SES service object
  const ses = new SESClient({ region: REGION });

  const run = async () => {
    try {
      const data = await ses.send(new SendEmailCommand(params));

      console.log(`Success with ${toEmail}`, data);
    } catch (err) {
      console.log("Error", err);
    }
  };

  await run()

  return context
    .status(200)
    .succeed(`Emailed: ${toEmail}`)
}

