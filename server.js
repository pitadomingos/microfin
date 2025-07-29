
const express = require('express');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');

const app = express();
const port = process.env.PORT || 8080;

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("FATAL ERROR: The API_KEY environment variable is not set. The AI services will not work.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Enums needed for the schema, must be consistent with public/types.js
const DocumentType = {
    REQUISITION: 'Requisition',
    QUOTE: 'Quote',
    PO: 'Purchase Order',
    INVOICE: 'Invoice'
};
const Status = {
    WAITING_FOR_QUOTE: 'Waiting for Quote',
    WAITING_FOR_PO: 'Waiting for PO',
    WAITING_FOR_INVOICE: 'Waiting for Invoice',
    WAITING_FOR_PAYMENT: 'Waiting for Payment',
    PAID: 'Paid',
};

// Schema for document parsing, now defined on the server.
const docParseSchema = {
  type: Type.OBJECT,
  properties: {
    supplierName: { type: Type.STRING, description: 'The name of the supplier, vendor, or client.' },
    documentType: { type: Type.STRING, description: 'The type of the document.', enum: Object.values(DocumentType) },
    documentNumber: { type: Type.STRING, description: 'The unique identifier for the document (e.g., INV-123, Q-001).' },
    status: { type: Type.STRING, description: 'The current status of the document.', enum: Object.values(Status) },
    dateIssued: { type: Type.STRING, description: 'The date the document was issued, in YYYY-MM-DD format.' },
    dueDate: { type: Type.STRING, description: 'The date payment is due, in YYYY-MM-DD format. Infer this from text like "Net 30". If not specified, leave blank.'},
    amount: { type: Type.NUMBER, description: 'The total monetary value of the document, if specified. Extract only the number.'},
    notes: { type: Type.STRING, description: 'Any relevant notes or summary from the text.' },
  },
  required: ['supplierName', 'documentType', 'documentNumber', 'status', 'dateIssued'],
};


// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// --- API PROXY ENDPOINTS ---

// Gemini Chat Streaming Endpoint
app.post('/api/gemini/chat/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        if (!API_KEY) throw new Error('API_KEY is not configured on the server.');
        const { message, documents } = req.body;
        
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are JacBot, a helpful assistant for an application called 'DocTrac'.
                Your purpose is to assist users with navigating the app and answering questions about their documents.
                The user can be a 'User' or an 'Admin'.
                The app has the following pages:
                - Dashboard: A summary view with charts and cash flow forecast.
                - Documents: A table of all documents with advanced filtering and export options.
                - Analytics: A performance dashboard with supplier spend and client revenue.
                - AI Reports: A page to generate an AI analysis of all documents.
                - Activity Log: Shows a history of actions.
                - User Manual: Explains how to use the app.
                - Admin Console: For admins to manage users, suppliers, clients, and company branding.
                When asked a question about the documents, use the provided JSON data to answer accurately.
                Be concise and friendly. Today's date is ${new Date().toLocaleDateString()}.`,
            },
        });
        
        const contextMessage = `Here is the current list of documents in JSON format. Use this to answer any questions about the data: ${JSON.stringify(documents)}`;
        const stream = await chat.sendMessageStream({ message: `${message}\n\nCONTEXT:\n${contextMessage}`});

        for await (const chunk of stream) {
            // SSE format: data: { ...JSON... } \n\n
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
    } catch (error) {
        console.error('Server-side chat stream error:', error);
        res.write(`data: ${JSON.stringify({ error: { message: 'Failed to get response from AI service on the server.' } })}\n\n`);
    } finally {
        res.end();
    }
});

// Gemini Text Parsing Endpoint
app.post('/api/gemini/parsetext', async (req, res) => {
    try {
        if (!API_KEY) throw new Error('API_KEY is not configured on the server.');
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required.' });
        }

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Parse the following text and extract the document details according to the provided schema. The current date is ${new Date().toISOString().split('T')[0]}. Infer dates and statuses where possible. Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: docParseSchema,
            }
        });
        const jsonResponse = JSON.parse(result.text.trim());
        res.json(jsonResponse);
    } catch(error) {
        console.error('Server-side text parsing error:', error);
        res.status(500).json({ error: "Failed to parse document text. The AI service may be unavailable or the input text is ambiguous." });
    }
});

// Gemini Report Generation Endpoint
app.post('/api/gemini/generatereport', async (req, res) => {
    try {
        if (!API_KEY) throw new Error('API_KEY is not configured on the server.');
        const { documents } = req.body;
        if (!documents) {
            return res.status(400).json({ error: 'Document data is required.' });
        }

        const prompt = `
            Analyze the following document data from a company's DocTrac system. The data is in JSON format.
            Provide a concise executive summary of the current state of their documents.
            
            Your report should include the following sections:
            1.  **Overall Summary:** A brief overview of the total number of documents and their general status.
            2.  **Procurement Insights (Inbound documents):** Analyze the documents where the company is buying. Highlight any bottlenecks, such as a high number of requisitions waiting for quotes or purchase orders waiting for invoices.
            3.  **Sales Insights (Outbound documents):** Analyze the documents where the company is selling. Point out any delays, like quotes waiting for client POs.
            4.  **Actionable Items:** Specifically list any documents that require immediate attention (e.g., invoices waiting for payment, requisitions waiting for quotes for a long time).
            5.  **Suggestions:** Provide one or two actionable suggestions for improving their document workflow based on the data. For example, if many invoices are due for payment, suggest they focus on payments. If many requisitions are pending, suggest they follow up with suppliers for quotes.
    
            Be clear, professional, and use formatting like bolding for headers.
    
            Data:
            ${JSON.stringify(documents, null, 2)}
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        res.json({ report: result.text });
    } catch (error) {
        console.error('Server-side report generation error:', error);
        res.status(500).json({ error: "Failed to generate the AI report. The service may be unavailable or the data is invalid." });
    }
});


// Fallback to serving index.html for any unhandled routes, supporting client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`DocTrac server listening on port ${port}`);
});
