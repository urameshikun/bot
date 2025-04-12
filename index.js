const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).send('OK'))
    .catch((err) => {
      console.error('エラーにゃ：', err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const msg = event.message.text;

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `にゃ〜ん、「${msg}」って言ったんやな？裏メシくんが聞いたで！`
  });
}

app.listen(process.env.PORT || 3000, () => {
  console.log('裏メシくん、起動にゃ〜');
});
