import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      oidc: [
        {
          name: 'Auth0',
          clientId: secret('AUTH0_CLIENT_ID'),
          clientSecret: secret('AUTH0_CLIENT_SECRET'),
          issuerUrl: 'https://dev-n27lv88dihjzwt0j.us.auth0.com',
          scopes: ['openid', 'profile', 'email'],
        },
      ],
      callbackUrls: ['http://localhost:4200'],
      logoutUrls: ['http://localhost:4200'],
    },
  },
});
