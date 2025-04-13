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

async function handleEvent(event) {
  if (event.type === 'message') {
    // 画像が送られてきたとき
    if (event.message.type === 'image') {
      const messageId = event.message.id;
      const stream = await client.getMessageContent(messageId);

      // バッファとして受け取る（画像データ）
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // ここにOCR処理を入れていくで（次のステップ）
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'にゃっ！レシート画像を受け取ったで。読み取り準備中や〜'
      });
    }

    // テキストが送られてきたとき（今まで通り）
    if (event.message.type === 'text') {
      const msg = event.message.text;
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `にゃ〜ん、「${msg}」って言ったんやな？裏メシくんが聞いたで！`
      });
    }
  }

  return Promise.resolve(null);
}
