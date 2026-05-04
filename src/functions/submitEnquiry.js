const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

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
                name, phone, email, service,
                message: message || '',