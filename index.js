const express = require('express');
const line = require('@line/bot-sdk');
const vision = require('@google-cloud/vision');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

// Cloud Visionクライアントを初期化（環境変数からキーを読み込み）
const visionClient = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
});

// webhook受信エンドポイント
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
    // 画像が送られてきた場合
    if (event.message.type === 'image') {
      const messageId = event.message.id;
      const stream = await client.getMessageContent(messageId);

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // OCR処理
      try {
        const [result] = await visionClient.textDetection({ image: { content: buffer } });
        const detections = result.textAnnotations;

        const text = detections.length > 0 ? detections[0].description : null;

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: text
            ? `レシート読み取り結果にゃ：\n${text}`
            : '文字が読み取れんかったにゃ…'
        });
      } catch (error) {
        console.error('OCRエラーにゃ：', error);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'OCR中にエラーが起きたにゃ…'
        });
      }
    }

    // テキストが送られてきたとき
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

// 起動
app.listen(process.env.PORT || 3000, () => {
  console.log('裏メシくん、起動にゃ〜');
});
