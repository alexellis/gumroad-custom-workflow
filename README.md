# gumroad-pings

Get webhooks into Slack every time you sell a product on Gumroad

## Deployment

First of all, set up OpenFaaS using the open-source [faasd](http://github.com/openfaas/faasd) project.

> My new eBook has step-by-step instructions on how to setup and configure faasd and may save you some time with configuration and setting up TLS: [Serverless For Everyone Else](https://gumroad.com/l/serverless-for-everyone-else).

Then create an incoming webhook URL via [Slack's docs](https://api.slack.com/messaging/webhooks).

Then clone this repo, and create the two secrets.

```bash
faas-cli secret create seller-id --from-literal "GUMROAD_SELLER_ID"
faas-cli secret create slack-url --from-literal "https://hooks.slack.com/services/X/Y/Z"
```

You can get the slack-url by creating an "incoming webhook" and creating a new channel for the messages, or using an existing one.

Deploy the function after creating the secrets:

```bash
faas-cli deploy
```

Now enter your function's URL on the Advanced tab in Gumroad's settings page, in the "Ping" field.

Your URL will be something like: `https://faasd.domain.com/function/gumroad-pings`

![Pings](docs/pings.png)

This is what you'll receive.

![Example](docs/example.png)

Feel free to customise the code in the [handler.js](https://github.com/alexellis/gumroad-sales-forwarder/blob/main/gumroad-pings/handler.js) file.

Why not?
* Send new customers an email using SES or Sendgrid
* Tweet a message to say thanks
* Customise the message into the Slack channel
* Send them an automated invite to your Slack community
* [Flash an LED on your Raspberry Pi](https://levelup.gitconnected.com/add-a-status-led-to-your-raspberry-pi-d3718846d66b)

If you'd like to chat, you can reach out on [OpenFaaS Slack](https://slack.openfaas.io/)
