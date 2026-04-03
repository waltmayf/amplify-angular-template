import { defineAuth, secret } from '@aws-amplify/backend';
import * as dotenv from 'dotenv';
dotenv.config({ override: true });

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      oidc: [
        {
          name: 'Auth0',
          clientId: secret('AUTH0_CLIENT_ID'),
          clientSecret: secret('AUTH0_CLIENT_SECRET'),
          issuerUrl: process.env['ISSUER_URL'] || '',
          scopes: ['openid', 'profile', 'email'],
        },
      ],
      callbackUrls: [process.env['CALLBACK_URL'] || 'http://localhost:4200'],
      logoutUrls: [process.env['LOGOUT_URL'] || 'http://localhost:4200'],
    },
  },
});
