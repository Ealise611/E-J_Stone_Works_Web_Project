# Azure enquiry form backend setup

This website now posts enquiry data to `POST /api/enquiries` from the contact form.
Use the following Azure setup to capture the data.

## 1) Create Azure SQL Database

1. In Azure Portal, create a **Resource Group** (or reuse existing).
2. Create **Azure SQL Server** (new logical server) with SQL authentication.
3. Create **Azure SQL Database** (Basic tier is enough to start).
4. In SQL server networking:
   - Allow Azure services and resources to access this server.
   - Add your current public IP temporarily for local testing.

## 2) Create table for enquiries

Run this SQL in Query Editor:

```sql
CREATE TABLE dbo.Enquiries (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(120) NOT NULL,
  Phone NVARCHAR(40) NOT NULL,
  Email NVARCHAR(160) NOT NULL,
  Postcode NVARCHAR(40) NOT NULL,
  ServiceType NVARCHAR(80) NOT NULL,
  Message NVARCHAR(2000) NOT NULL,
  CreatedUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

## 3) Deploy an API endpoint

Because this site is static HTML, you need a small backend API.
Recommended options:

- **Azure Functions (HTTP trigger)**
- **Azure App Service (Node.js/Express)**

The API must implement:

- `POST /api/enquiries`
- Validate required fields.
- Insert one row into `dbo.Enquiries`.
- Return `200` or `201` JSON response.

## 4) Configure secure connection

Use environment variables (never hardcode secrets):

- `AZURE_SQL_SERVER`
- `AZURE_SQL_DATABASE`
- `AZURE_SQL_USER`
- `AZURE_SQL_PASSWORD`

If using Azure Functions/App Service, store these in **Configuration** settings.

## 5) Connect frontend to production API

In `index.html`, change `endpoint` from local path to your deployed URL if needed:

```js
const endpoint = "https://<your-api-host>/api/enquiries";
```

If your website and API are on different domains, enable CORS on the API for your website origin.

## 6) Optional hardening

- Add CAPTCHA (Cloudflare Turnstile or reCAPTCHA) to block spam.
- Add rate limiting in API.
- Add email notifications (SendGrid / Logic Apps) after insert.
