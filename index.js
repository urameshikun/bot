const express = require('express');
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');
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
    // 📷 画像が送られてきたとき
    if (event.message.type === 'image') {
      const messageId = event.message.id;
      const stream = await client.getMessageContent(messageId);

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // 📄 OCR処理開始！
      const formData = new URLSearchParams();
      formData.append('apikey', 'YOUR_OCR_API_KEY'); // ←★ここに自分のAPIキー入れてね！
      formData.append('language', 'jpn');
      formData.append('isOverlayRequired', 'false');
      formData.append('base64Image', `data:image/jpeg;base64,${buffer.toString('base64')}`);

      const ocrRes = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const ocrJson = await ocrRes.json();
      const resultText = ocrJson.ParsedResults?.[0]?.ParsedText || '文字が読み取れんかったにゃ…';

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `🧾 レシート読み取り結果にゃ：\n\n${resultText}`
      });
    }

    // 💬 テキストが送られたとき
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

app.listen(process.env.PORT || 3000, () => {
  console.log('裏メシくん、起動にゃ〜');
});
