const express = require('express');
const line = require('@line/bot-sdk');
const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// LINE設定
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

// Google Vision API クライアント設定（キーは JSONファイルを使う）
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: 'key.json', // Google Cloudのサービスアカウントキー
});

// webhookエンドポイント
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).send('OK'))
    .catch((err) => {
      console.error('エラーにゃ：', err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message') return null;

  // 画像メッセージ
  if (event.message.type === 'image') {
    const messageId = event.message.id;
    const stream = await client.getMessageContent(messageId);
    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const tempPath = path.join(__dirname, 'temp.jpg');
    fs.writeFileSync(tempPath, buffer);

    try {
      const [result] = await visionClient.textDetection(tempPath);
      const detections = result.textAnnotations;
      const text = detections.length ? detections[0].description : '文字が読み取れんかったにゃ…';

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `📄 レシート読み取り結果にゃ：\n${text}`
      });
    } catch (err) {
      console.error('OCRエラー：', err);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '読み取りに失敗したにゃ…ごめんやで。'
      });
    } finally {
      fs.unlinkSync(tempPath); // temp画像削除
    }
  }

  // テキストメッセージ
  if (event.message.type === 'text') {
    const msg = event.message.text;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `にゃ〜ん、「${msg}」って言ったんやな？裏メシくんが聞いたで！`
    });
  }

  return null;
}

// サーバー起動
app.listen(process.env.PORT || 3000, () => {
  console.log('裏メシくん、起動にゃ〜');
});
