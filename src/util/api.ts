import { NowRequest, NowResponse } from '@vercel/node';
import { SlackEventMiddlewareArgs } from '@slack/bolt';

export namespace API {
  type ChallengeBody = Readonly<{
    token?: string;
    challenge?: string;
    type?: CUSTOM_EVENT_TYPE;
  }>

  type SlackEvent = SlackEventMiddlewareArgs<'message'>['body'];
  export const EVENT_CALLBACK = 'event_callback'
  export interface SlackEventRequest extends NowRequest {
    body: ChallengeBody | SlackEvent;
  }

  export interface SlackEventResponse extends NowResponse {
    send: (body: any) => SlackEventResponse;
    json: (jsonBody: any | { error: string }) => SlackEventResponse;
    status: (statusCode: number) => SlackEventResponse;
    redirect: (statusOrUrl: string | number, url?: string) => SlackEventResponse;
  }
  
  export const enum CUSTOM_EVENT_TYPE {
    URL_VERIFICATION = `url_verification`,
  }

  export interface SlackChatUpdateResponse {
    ok: boolean;
    channel: string;
    ts: number,
    text: string;
    message: {
      text: string;
      user: string;
    }
  }

  export const TRANSLATE_API_URL = process.env.TRANSLATE_API_URL ?? `https://papago-proxy.vercel.app/api/translate`
  
  const SLACK_API_BASE_URL = `https://slack.com/api/chat`
  export const SLACK_API_POSTMESSAGE_URL = `${SLACK_API_BASE_URL}.postMessage`
  export const SLACK_API_UPDATE_URL = `${SLACK_API_BASE_URL}.update`
}  
