# Oil & Gas Maintenance Explorer — AWS Amplify Demo

A demo application showcasing how AWS Amplify Gen 2 can model complex hierarchical data relationships backed by Amazon DynamoDB, and federate authentication with Auth0 via OpenID Connect.

Built with Angular 17, AWS AppSync (GraphQL), and Amplify Gen 2.

## What This Demo Shows

### Hierarchical Data Modeling with DynamoDB

The core of this demo is a deeply nested data model representing an oil & gas maintenance domain:

```
Facility
  └─ Area (hazard-classified zones)
       └─ System (process systems with criticality ratings)
            └─ Equipment (tagged assets with health status)
                 ├─ Component (sub-parts with condition tracking)
                 ├─ WorkOrder → MaintenanceTask (sequenced procedures)
                 └─ InspectionRecord (NDT results, sensor readings)
  └─ Personnel (certified workers linked to work orders & inspections)
```

This 6-level hierarchy uses Amplify's `hasMany` / `belongsTo` relationships to enable graph-style traversal queries — all resolved by AppSync against DynamoDB tables. No relational database required.

For details on how Amplify models these relationships, see the official documentation:
[Modeling relationships — AWS Amplify Gen 2](https://docs.amplify.aws/angular/build-a-backend/data/data-modeling/relationships/)

### Complex GraphQL Queries

The app includes a query runner with five pre-built queries that demonstrate deep cross-entity joins:

- **Full Hierarchy Traversal** — 6 levels deep in a single query
- **Critical Equipment with Open Work Orders** — filters degraded equipment and joins personnel, tasks
- **Inspection Failure Analysis** — cross-references failed inspections with equipment and work orders
- **Personnel Workload** — shows each worker's assigned work orders and inspection history
- **Maintenance Task Deep Dive** — traces tasks back up through the full facility hierarchy

### Auth0 Authentication (OIDC Federation)

The app integrates Auth0 as an external OIDC identity provider through Amazon Cognito. After login, a user profile dropdown displays the authenticated user's details including the identity provider payload, proving the Auth0 federation is working.

## Prerequisites

- Node.js v18+
- An AWS account with credentials configured
- An Auth0 account with a Regular Web Application configured

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file in the project root:
   ```
   ISSUER_URL=https://<your-auth0-domain>
   CALLBACK_URL=http://localhost:4200
   LOGOUT_URL=http://localhost:4200
   ```

3. Set Auth0 secrets for the Amplify sandbox:
   ```bash
   npx ampx sandbox secret set AUTH0_CLIENT_ID
   npx ampx sandbox secret set AUTH0_CLIENT_SECRET
   ```

4. Deploy the sandbox:
   ```bash
   npx ampx sandbox
   ```

5. Add the Cognito callback URL to your Auth0 application's Allowed Callback URLs:
   ```
   https://<cognito-domain>/oauth2/idpresponse
   ```
   (Find the Cognito domain in `amplify_outputs.json` after deployment.)

6. Load sample data:
   ```bash
   pnpm tsx scripts/loadSampleData.ts
   ```

7. Start the app:
   ```bash
   npx ng serve
   ```

## Production Deployment (Amplify Hosting CI/CD)

Amplify Hosting deploys automatically when you push to a linked Git branch. There is a chicken-and-egg situation with the first deployment since you need the Amplify app domain for the callback URLs, but you don't have it until the app is created.

### Step 1: Initial Push (will fail — that's expected)

Push your code to the linked branch. The first deployment will fail on the auth stack because the environment variables aren't set yet. The data stack (AppSync, DynamoDB) may partially deploy.

### Step 2: Set Secrets

In the Amplify Console, go to **Hosting > Secrets** and add:

| Secret | Value |
|--------|-------|
| `AUTH0_CLIENT_ID` | Your Auth0 application Client ID |
| `AUTH0_CLIENT_SECRET` | Your Auth0 application Client Secret |

Note: Sandbox secrets (`npx ampx sandbox secret set`) and branch deployment secrets are stored separately. You need to set them in both places, even if the values are identical.

### Step 3: Set Environment Variables

In the Amplify Console, go to **Hosting > Environment variables** and add:

| Variable | Value |
|----------|-------|
| `ISSUER_URL` | `https://<your-auth0-domain>` |
| `CALLBACK_URL` | `https://<branch>.<app-id>.amplifyapp.com` |
| `LOGOUT_URL` | `https://<branch>.<app-id>.amplifyapp.com` |

Get the app domain from the Amplify Console overview page (e.g., `https://main.d1a2b3c4d5e6f7.amplifyapp.com`).

### Step 4: Redeploy

Trigger a redeploy from the Amplify Console (or push a new commit). This deployment should succeed.

### Step 5: Configure Auth0 for Production

After the deployment succeeds:

1. Download `amplify_outputs.json` from the Amplify Console (Deployments tab) to find the production Cognito domain
2. In your Auth0 application settings, add to **Allowed Callback URLs**:
   - `https://<production-cognito-domain>/oauth2/idpresponse`
   - `https://<branch>.<app-id>.amplifyapp.com`
3. Add to **Allowed Logout URLs**:
   - `https://<branch>.<app-id>.amplifyapp.com`

### Step 6: Load Sample Data

Point the data loader at the production endpoint by copying the deployed `amplify_outputs.json` locally, then run:

```bash
pnpm tsx scripts/loadSampleData.ts
```

## Project Structure

```
amplify/
  auth/resource.ts        # Auth config with Auth0 OIDC federation
  data/resource.ts        # Hierarchical data schema (8 models)
  backend.ts              # Backend definition
scripts/
  loadSampleData.ts       # Loads 55 sample records across the hierarchy
  runGraphql.ts           # CLI tool for running ad-hoc GraphQL queries
  verifyData.ts           # Verification script with deep hierarchy query
src/app/
  explorer/               # Main explorer component (hierarchy browser + query runner)
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
