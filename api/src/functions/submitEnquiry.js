const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const nodemailer = require('nodemailer');

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database('ejstoneworks');
const container = database.container('enquiries');

app.http('submitEnquiry', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return { status: 204, headers: corsHeaders };
        }

        try {
            const body = await request.json();
            const { name, phone, email, service, message } = body;

            if (!name || !phone || !email || !service) {
                return {
                    status: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            const enquiry = {
                id: Date.now().toString(),
                name,
                phone,
                email,
                service,
                message: message || '',
                submittedAt: new Date().toISOString()
            };

            await container.items.create(enquiry);
            context.log('Enquiry saved:', name, service);

            // // Email - uncomment when ready
            // const transporter = nodemailer.createTransport({
            //     service: 'gmail',
            //     auth: {
            //         user: process.env.EMAIL_USER,
            //         pass: process.env.EMAIL_PASS
            //     }
            // });
            // await transporter.sendMail({
            //     from: process.env.EMAIL_USER,
            //     to: process.env.EMAIL_USER,
            //     subject: `New quote request from ${name}`,
            //     html: `
            //         <h2>New Quote Request</h2>
            //         <p><strong>Name:</strong> ${name}</p>
            //         <p><strong>Phone:</strong> ${phone}</p>
            //         <p><strong>Email:</strong> ${email}</p>
            //         <p><strong>Service:</strong> ${service}</p>
            //         <p><strong>Message:</strong> ${message || '—'}</p>
            //     `
            // });

            return {
                status: 200,
                headers: corsHeaders,
                body: JSON.stringify({ success: true })
            };

        } catch (err) {
            context.log('Error:', err);
            return {
                status: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Server error' })
            };
        }
    }
});