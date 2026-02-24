const sql = require("mssql");

const MAX_LENGTHS = {
  name: 120,
  phone: 40,
  email: 160,
  postcode: 40,
  serviceType: 80,
  message: 2000
};

let poolPromise;

function getSqlConfig() {
  const {
    AZURE_SQL_SERVER,
    AZURE_SQL_DATABASE,
    AZURE_SQL_USER,
    AZURE_SQL_PASSWORD
  } = process.env;

  if (!AZURE_SQL_SERVER || !AZURE_SQL_DATABASE || !AZURE_SQL_USER || !AZURE_SQL_PASSWORD) {
    throw new Error("Missing one or more SQL environment variables.");
  }

  return {
    server: AZURE_SQL_SERVER,
    database: AZURE_SQL_DATABASE,
    user: AZURE_SQL_USER,
    password: AZURE_SQL_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(getSqlConfig());
  }

  return poolPromise;
}

function normalizeBody(body) {
  return {
    name: String(body?.name || "").trim(),
    phone: String(body?.phone || "").trim(),
    email: String(body?.email || "").trim(),
    postcode: String(body?.postcode || "").trim(),
    serviceType: String(body?.serviceType || "").trim(),
    message: String(body?.message || "").trim()
  };
}

function validate(payload) {
  const missing = Object.entries(payload)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(", ")}`;
  }

  if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
    return "Email format is invalid.";
  }

  const overLimit = Object.entries(MAX_LENGTHS)
    .filter(([key, maxLength]) => payload[key].length > maxLength)
    .map(([key, maxLength]) => `${key} (max ${maxLength})`);

  if (overLimit.length > 0) {
    return `Field length exceeded: ${overLimit.join(", ")}`;
  }

  return null;
}

module.exports = async function enquiries(context, req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers: corsHeaders
    };
    return;
  }

  const payload = normalizeBody(req.body);
  const validationError = validate(payload);

  if (validationError) {
    context.res = {
      status: 400,
      headers: corsHeaders,
      body: { error: validationError }
    };
    return;
  }

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("Name", sql.NVarChar(MAX_LENGTHS.name), payload.name)
      .input("Phone", sql.NVarChar(MAX_LENGTHS.phone), payload.phone)
      .input("Email", sql.NVarChar(MAX_LENGTHS.email), payload.email)
      .input("Postcode", sql.NVarChar(MAX_LENGTHS.postcode), payload.postcode)
      .input("ServiceType", sql.NVarChar(MAX_LENGTHS.serviceType), payload.serviceType)
      .input("Message", sql.NVarChar(MAX_LENGTHS.message), payload.message)
      .query(`
        INSERT INTO dbo.Enquiries (Name, Phone, Email, Postcode, ServiceType, Message)
        OUTPUT INSERTED.Id
        VALUES (@Name, @Phone, @Email, @Postcode, @ServiceType, @Message)
      `);

    context.res = {
      status: 201,
      headers: corsHeaders,
      body: {
        id: result.recordset?.[0]?.Id,
        message: "Enquiry captured successfully."
      }
    };
  } catch (error) {
    context.log.error("Failed to save enquiry", error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: { error: "Unable to save enquiry at the moment." }
    };
  }
};
