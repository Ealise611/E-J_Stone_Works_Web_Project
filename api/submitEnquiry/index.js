const { CosmosClient } = require("@azure/cosmos");
const nodemailer = require("nodemailer");

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database("ejstoneworks");
const container = database.container("enquiries");

module.exports = async function (context, req) {
  // CORS headers — always set these first
  context.res = {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    },
    body: {}
  };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    context.res.status = 204;
    return;
  }

  try {
    const { name, phone, email, service, message } = req.body;

    if (!name || !phone || !email || !service) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return;
    }

    const enquiry = {
      id: Date.now().toString(),
      name,
      phone,
      email,
      service,
      message: message || "",
      submittedAt: new Date().toISOString(),
    };

    await container.items.create(enquiry);
    context.log("Enquiry saved:", name, service);

    // // Email notification - uncomment when ready
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });
    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: process.env.EMAIL_USER,
    //   subject: `New quote request from ${name}`,
    //   html: `
    //     <h2>New Quote Request</h2>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Phone:</strong> ${phone}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Service:</strong> ${service}</p>
    //     <p><strong>Message:</strong> ${message || "—"}</p>
    //     <p><strong>Submitted:</strong> ${new Date().toLocaleString("en-AU")}</p>
    //   `,
    // });

    context.res.status = 200;
    context.res.body = { success: true };

  } catch (err) {
    context.log.error("Error:", err);
    context.res.status = 500;
    context.res.body = { error: "Server error" };
  }
};