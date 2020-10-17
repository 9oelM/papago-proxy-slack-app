import got from 'got';

got.post('https://slack.com/api/chat.update', {
  headers: {
    Authorization: `Bearer ${process.env.SLACK_USER_TOKEN}`,
    'Content-type': `application/json; charset=utf-8`,
  },
  json: {
    channel: process.env.CHANNEL,
    ts: process.env.TS,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "original message"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Transation:",
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "> translated"
        }
      }
    ],
  },
  responseType: 'json'
}).then((a) => {
  console.log(a.body)
});
