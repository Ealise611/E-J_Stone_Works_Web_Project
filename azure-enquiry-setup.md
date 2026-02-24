# Azure enquiry form backend setup

The website form submits JSON to `POST /api/enquiries`.
This repository now includes an Azure Function implementation under `api/enquiries` that stores submissions in Azure SQL.

## What is already implemented in this repo

- Frontend form + submit logic in `index.html`.
- Azure Function endpoint in `api/enquiries/index.js`.
- Azure Function bindings in `api/enquiries/function.json`.
- Function app config files in `api/host.json` and `api/package.json`.
- Local env template in `api/local.settings.example.json`.

## 1) Create Azure SQL Database

1. In Azure Portal, create/use a **Resource Group**.
2. Create **Azure SQL Server**.
3. Create **Azure SQL Database**.
4. In SQL server networking:
   - Allow Azure services and resources to access this server.
   - Add your public IP for setup/testing.

## 2) Create `dbo.Enquiries` table

Run this SQL:

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

## 3) Configure function environment variables

In your Function App > **Configuration**, add:

- `AZURE_SQL_SERVER`
- `AZURE_SQL_DATABASE`
- `AZURE_SQL_USER`
- `AZURE_SQL_PASSWORD`
- `CORS_ALLOWED_ORIGIN` (for example `https://www.ejstoneworks.com.au`)

## 4) Deploy the function app

From the `api` folder:

```bash
npm install
```

Then deploy with your preferred method:

- VS Code Azure Functions extension, or
- Azure CLI + zip deploy.

The route exposed by this function is:

- `POST https://<function-app>.azurewebsites.net/api/enquiries`

## 5) Wire frontend to deployed API

If your site and function are different origins, set the endpoint in `index.html` to the full function URL:

```js
const endpoint = "https://<function-app>.azurewebsites.net/api/enquiries";
```

If your static site is hosted on Azure Static Web Apps with linked API, `/api/enquiries` can stay as-is.

## 6) Verify

1. Submit the form from the site.
2. Run:

```sql
SELECT TOP 20 * FROM dbo.Enquiries ORDER BY CreatedUtc DESC;
```

If rows appear, customer data is being captured in Azure SQL.
