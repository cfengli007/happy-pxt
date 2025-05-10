# Birthday Email Scheduler - Cloudflare Worker

This Cloudflare Worker schedules and sends emails at a future date, intended for a "write a message to your future self" feature for a birthday website.

It uses:
- Cloudflare Workers for serverless compute.
- Cloudflare KV for storing scheduled email data.
- Cloudflare Cron Triggers for periodically checking and sending emails.
- Resend (or a similar email service) for actual email delivery.
- Basic data encryption for messages stored in KV (placeholder, **needs robust implementation**).

## Project Structure

```
cloudflare-worker/
├── .gitignore
├── package.json
├── README.md
├── wrangler.toml         # Wrangler configuration file
└── src/
    └── index.js          # Main Worker script
```

## Prerequisites

1.  **Cloudflare Account**: Sign up at [Cloudflare](https://cloudflare.com).
2.  **Node.js and npm**: Install from [nodejs.org](https://nodejs.org/).
3.  **Wrangler CLI**: Cloudflare's command-line tool for Workers. Install globally:
    ```bash
    npm install -g wrangler
    ```
4.  **Resend Account**: Sign up at [Resend.com](https://resend.com) and get an API key. You'll also need a verified sending domain.

## Setup Instructions

1.  **Clone the repository (or create these files in your existing project).**

2.  **Navigate to the `cloudflare-worker` directory:**
    ```bash
    cd path/to/your/project/cloudflare-worker
    ```

3.  **Install dependencies (Wrangler for local development/deployment):**
    ```bash
    npm install
    ```

4.  **Configure `wrangler.toml`:**
    *   Open `wrangler.toml`.
    *   Replace `YOUR_ACCOUNT_ID` with your actual Cloudflare Account ID. You can find this in your Cloudflare dashboard.
    *   The `name` field (`birthday-email-scheduler`) will be the name of your Worker service.

5.  **Create a KV Namespace:**
    *   Run the following command. Replace `SCHEDULED_EMAILS_KV` if you used a different binding name in `wrangler.toml`.
        ```bash
        npx wrangler kv:namespace create SCHEDULED_EMAILS_KV
        ```
    *   Wrangler will output an `id` for the namespace. Copy this ID.
    *   Paste the copied `id` into `wrangler.toml` for the `SCHEDULED_EMAILS_KV` binding, replacing `YOUR_KV_NAMESPACE_ID`.

6.  **Set up Secrets for Resend API Key and Encryption:**
    *   **RESEND_API_KEY**: Your API key from Resend.
        ```bash
        npx wrangler secret put RESEND_API_KEY
        ```
        (Wrangler will prompt you to enter the secret value.)
    *   **ENCRYPTION_SECRET**: A strong, unique secret string for encrypting/decrypting data in KV. Generate a secure random string for this.
        ```bash
        npx wrangler secret put ENCRYPTION_SECRET
        ```
        **Important**: The current encryption in `src/index.js` is a placeholder. For production, you MUST implement robust encryption using the Web Crypto API or a library like `encrypt-workers-kv`.

7.  **Update Email `from` Address:**
    *   In `src/index.js`, find the line:
        `from: 'Birthday Wishes <onboarding@resend.dev>', // TODO: Replace with your verified Resend domain/email`
    *   Replace `'onboarding@resend.dev'` with an email address from a domain you have verified with Resend.

## Local Development

To run the Worker locally for testing the `/schedule-email` endpoint:

```bash
npm start
# or
npx wrangler dev
```

This will start a local server, typically at `http://localhost:8787`.

*   **KV in local dev**: Wrangler will use a local emulation for KV. Data stored locally will not persist to the deployed KV namespace unless you explicitly publish it.
*   **Secrets in local dev**: Wrangler will prompt you to enter secrets for local development if they are not already in a `.dev.vars` file (which is gitignored).
*   **Cron Triggers**: Local testing of cron triggers can be done by manually hitting the `/__scheduled` endpoint that `wrangler dev` exposes, or by deploying and observing logs.

## Deployment

To deploy your Worker to Cloudflare:

```bash
npm run deploy
# or
npx wrangler deploy
```

After deployment, your Worker will be live at `https://birthday-email-scheduler.<YOUR_SUBDOMAIN>.workers.dev` (or your custom domain if configured).

The cron trigger defined in `wrangler.toml` (`0 * * * *` - every hour) will automatically start running on the deployed Worker.

## API Endpoint

*   **`POST /schedule-email`**: Schedules an email.
    *   **Request Body (JSON):**
        ```json
        {
          "email": "recipient@example.com",
          "message": "Your message to your future self!",
          "sendDate": "YYYY-MM-DDTHH:mm:ss.sssZ" // ISO 8601 date string for the future send time
        }
        ```
    *   **Success Response (200 OK):**
        ```json
        {
          "success": true,
          "emailId": "generated-unique-id",
          "message": "Email scheduled successfully."
        }
        ```
    *   **Error Responses (400 or 500):**
        ```json
        {
          "error": "Error message describing the issue."
        }
        ```

## Data Encryption

**CRITICAL**: The current encryption/decryption functions in `src/index.js` are **placeholders and NOT secure for production**. You MUST replace them with a robust implementation using the Web Crypto API directly or a library designed for this purpose, such as `encrypt-workers-kv` ([GitHub](https://github.com/bradyjoslin/encrypt-workers-kv)).

Ensure your `ENCRYPTION_SECRET` is strong and kept confidential.

## GitHub Actions for CI/CD (Optional)

To automate deployment with GitHub Actions:

1.  Create a `.github/workflows` directory in your main project root (not inside `cloudflare-worker` if it's a sub-directory).
2.  Add a workflow YAML file (e.g., `deploy-worker.yml`) to this directory.
3.  Configure Cloudflare API Token as a secret in your GitHub repository settings (e.g., `CF_API_TOKEN`).
4.  The workflow would typically run `npm install` and `npx wrangler deploy` in the `cloudflare-worker` directory.

Example `deploy-worker.yml`:

```yaml
name: Deploy Cloudflare Worker

on:
  push:
    branches:
      - main # Or your deployment branch
    paths:
      - 'cloudflare-worker/**' # Only run if worker code changes

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy Worker
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18' # Or your preferred Node.js version

      - name: Install Wrangler
        run: npm install --save-dev wrangler
        working-directory: ./cloudflare-worker # Adjust if your worker is in a different subdir

      - name: Deploy Worker
        run: npx wrangler deploy
        working-directory: ./cloudflare-worker # Adjust path
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }} # Also add your account ID as a secret
```

Remember to add `CF_ACCOUNT_ID` as a secret in your GitHub repository as well.

## Further Considerations

*   **Error Handling & Retries**: Enhance the cron job to handle Resend API failures more gracefully (e.g., retry logic, dead-letter queue).
*   **Logging**: Add more detailed logging, potentially integrating with Cloudflare Logpush.
*   **Scalability**: KV is highly scalable for reads. For very high write volumes to `/schedule-email`, consider potential rate limiting or batching if it becomes an issue.
*   **Security**: Beyond encryption, ensure proper input validation and consider other security best practices for your Worker.
*   **Idempotency**: Ensure that if a cron job runs multiple times for the same email (e.g., due to an error and retry), it doesn't send the email multiple times. The current status check helps with this.