import pino from 'pino'
import { createWriteStream } from 'pino-logflare'
import got from 'got';
import { promiseHandler } from '../util/error-handler';
import { API } from '../util/api';

export default async (request: API.SlackEventRequest, response: API.SlackEventResponse) => {
  const { body } = request;
  const stream = process.env.LOGFLARE_API_KEY === undefined || process.env.LOGFLARE_SOURCE_TOKEN === undefined ? undefined : createWriteStream({
    apiKey: process.env.LOGFLARE_API_KEY,
    sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
  });

  const logger = pino(stream);

  logger.info(`Received incoming request: ${JSON.stringify(body)}`)
  if (request.headers['x-slack-retry-num']) {
    logger.info(`Closing immediately due to x-slack-retry-num`)
    response.status(200).json({ ok: true });
    
    return;
  }

  logger.info(`Request headers: ${JSON.stringify(request.headers)}`)
  logger.info(`No x-slack-retry-num found`)

  if (!body) {
    response.status(200).json({ error: "Invalid request. Body is undefined or null" });

    return;
  }

  switch (body.type) {
    case API.CUSTOM_EVENT_TYPE.URL_VERIFICATION:
      if (body.challenge === undefined || body.challenge === null) {
        response.status(200).json({ error: "Invalid challenge. Challenge is undefined or null" });
        return;
      }

      response.status(200).json({ challenge: body.challenge })
      return;
    case API.EVENT_CALLBACK:
      if (body.event?.text?.trim().length === 0 || body.event?.text === undefined || body.event?.text === null) {
        response.status(200).json({ error: "Invalid text. Text is empty, undefined, or null" });
        return;
      }

      const [translation, translationError] = 
        await promiseHandler(got<Readonly<{ text: string }>>(
          API.TRANSLATE_API_URL, { 
            searchParams: { text: body.event.text },
		        responseType: 'json'
          }));

      if (translationError) {
        response.status(200).json({ error: "Something went wrong while translating.", stackTrace: translationError.stack });  

        return;
      } else if (!translation) {
        response.status(200).json({ error: "Translation received from Papago proxy API is undefinde or null" });  

        return;
      } else if (translation?.body.text === undefined) {
        response.status(200).json({ error: "Translation text is undefined" });  

        return;
      }

      logger.info(`Papago translation result
from: ${body.event.text} 
to: ${translation.body.text} 
      `)

      const [updateMessageResponse, updateMessageError] = 
        await promiseHandler(got.post<Readonly<API.SlackChatUpdateResponse>>(
          API.SLACK_API_UPDATE_URL, { 
            headers: {
              Authorization: `Bearer ${process.env.SLACK_USER_OAUTH_TOKEN}`,
              'Content-type': `application/json; charset=utf-8`,
            },
            json: {
              channel: body.event.channel,
              ts: body.event.ts,
              blocks: [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": body.event.text,
                  }
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": `> ${translation.body.text}`
                  }
                }
              ],
              as_user: true,
            },
            responseType: 'json'
          }));

      if (updateMessageError) {
        response.status(200).json({ error: "Something went wrong while editing original Slack message"})

        return;
      } else if (!updateMessageResponse) {
        response.status(200).json({ error: "Editing original Slack message might not have been successful" })

        return;
      }

      logger.info(`Slack message updated:
${JSON.stringify(updateMessageResponse.body)}
      `)

      response.status(200).json({ ok: true });

      return;
    default:
      response.status(200).json(({ error: `Invalid request event type: ${body.type}` }))
  }
}
