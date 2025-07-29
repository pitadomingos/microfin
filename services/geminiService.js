import { GoogleGenAI, Type } from "@google/genai";
import { DocumentType, Status } from '../types.js';

if (!window.APP_CONFIG?.API_KEY || window.APP_CONFIG.API_KEY.includes('PASTE_YOUR_GEMINI_API_KEY_HERE')) {
    console.error("API_KEY not configured. AI features will be disabled. Please edit 'index.html' to add your API key.");
}

const ai = new GoogleGenAI({ apiKey: window.APP_CONFIG?.API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    supplierName: { type: Type.STRING, description: 'The name of the supplier or vendor.' },
    documentType: { type: Type.STRING, description: 'The type of the document.', enum: Object.values(DocumentType) },
    documentNumber: { type: Type.STRING, description: 'The unique identifier for the document (e.g., INV-123, Q-001).' },
    status: { type: Type.STRING, description: 'The current status of the document.', enum: Object.values(Status) },
    dateIssued: { type: Type.STRING, description: 'The date the document was issued, in YYYY-MM-DD format.' },
    notes: { type: Type.STRING, description: 'Any relevant notes or summary from the text.' },
  },
  required: ['supplierName', 'documentType', 'documentNumber', 'status', 'dateIssued'],
};

export const parseTextToDocument = async (text) => {
    if (!window.APP_CONFIG?.API_KEY || window.APP_CONFIG.API_KEY.includes('PASTE_YOUR_GEMINI_API_KEY_HERE')) {
        throw new Error("Gemini API key is not configured. Please edit 'index.html' to add your API key.");
    }

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Parse the following text and extract the document details according to the provided schema. The current date is ${new Date().toISOString().split('T')[0]}. Infer dates and statuses where possible. Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const jsonString = result.text.trim();
        const parsedData = JSON.parse(jsonString);

        return parsedData;
    } catch (error) {
        console.error("Error parsing document with Gemini:", error);
        throw new Error("Failed to parse document text. The AI service may be unavailable or the input text is ambiguous.");
    }
};

export const generateReportFromData = async (documents) => {
    if (!window.APP_CONFIG?.API_KEY || window.APP_CONFIG.API_KEY.includes('PASTE_YOUR_GEMINI_API_KEY_HERE')) {
        throw new Error("Gemini API key is not configured. Please edit 'index.html' to add your API key.");
    }

    const prompt = `
        Analyze the following document data from a company's DocTrac system. The data is in JSON format.
        Provide a concise executive summary of the current state of their documents.

        Your report should include the following sections:
        1.  **Data Consistency:** Check if the consistency of data is as per document flow criteria, that is Requisition => Quote => Purchase Order => Invoice => Payment. Provide documents to rectify or correct in the document flow
        2.  **Overall Summary:** A brief overview of the total number of documents and their general status.
        3.  **Procurement Insights (Inbound documents):** Analyze the documents where the company is buying. Highlight any bottlenecks, such as a high number of requisitions waiting for quotes or purchase orders waiting for invoices.
        4.  **Sales Insights (Outbound documents):** Analyze the documents where the company is selling. Point out any delays, like quotes waiting for client POs.
        5.  **Urgent Items:** Specifically list any documents with a "Waiting for Payment" status, indicating which ones need immediate attention.
        6.  **Suggestions:** Provide one or two actionable suggestions for improving their document workflow based on the data. For example, if many items are waiting for payment, suggest they focus on payments. If many requisitions are pending, suggest they follow up with suppliers for quotes.

        Be clear, professional, and use formatting like bolding for headers.

        Data:
        ${JSON.stringify(documents, null, 2)}
    `;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return result.text;

    } catch (error) {
        console.error("Error generating report with Gemini:", error);
        throw new Error("Failed to generate the AI report. The service may be unavailable or the data is invalid.");
    }
};
