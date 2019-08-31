import { LoginMechanism } from '../lib/enums/enums';
import { IEnvironment } from '../lib/interfaces/IEnvironment';

export const environment: IEnvironment = {
  production: true,
  ssrEndpoint: 'https://test01.ars.sbzo.de',
  serverEndpoint: 'https://test01.ars.sbzo.de',
  httpApiEndpoint: 'https://test01.ars.sbzo.de/api/v1',
  httpLibEndpoint: 'https://test01.ars.sbzo.de/lib',
  stompConfig: {
    endpoint: 'wss://test01.ars.sbzo.de/rabbitmq/ws',
    user: 'guest',
    password: 'guest',
    vhost: '/',
  },
  leaderboardAmount: 5,
  readingConfirmationEnabled: false,
  confidenceSliderEnabled: false,
  infoAboutTabEnabled: false,
  infoProjectTabEnabled: false,
  infoBackendApiEnabled: false,
  requireLoginToCreateQuiz: true,
  forceQuizTheme: true,
  loginMechanism: [LoginMechanism.UsernamePassword, LoginMechanism.Token],
};

export enum DEVICE_TYPES {
  XS, SM, MD, LG, XLG
}

export enum LIVE_PREVIEW_ENVIRONMENT {
  ANSWEROPTIONS, QUESTION
}