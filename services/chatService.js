import { GoogleGenAI } from "@google/genai";

let ai = null;
let chat = null;

const initializeChat = () => {
    // No-op if chat is already initialized
    if (chat) {
        return;
    }

    const apiKey = window.APP_CONFIG?.API_KEY;
    if (!apiKey || apiKey.includes('PASTE_YOUR_GEMINI_API_KEY_HERE')) {
        console.error("Chat features disabled. Gemini API key is not configured. Please edit 'index.html' to add your API key.");
        return;
    }

    if (!ai) {
        ai = new GoogleGenAI({ apiKey });
    }
    
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a helpful assistant for an application called 'DocTrac'.
            Your purpose is to assist users with navigating the app and answering questions about their documents.
            The user can be a 'User' or an 'Admin'.
            The app has the following pages:
            - Dashboard: A summary view with charts.
            - Documents: A table of all documents.
            - AI Reports: A page to generate an AI analysis of all documents.
            - Activity Log: Shows a history of actions.
            - User Manual: Explains how to use the app.
            - Admin Console: For admins to manage users, suppliers, clients, and company branding.
            When asked a question about the documents, use the provided JSON data to answer accurately.
            Be professional, concise and friendly. Today's date is ${new Date().toLocaleDateString()}.`,
        },
    });
};

export const sendMessageStream = async (message, documents) => {
    // Lazily initialize on first use
    initializeChat();

    if (!chat) {
        throw new Error("Chat could not be initialized. Please check your API Key configuration in index.html.");
    }
    
    // Provide document data as context for the model
    const contextMessage = `Here is the current list of documents in JSON format. Use this to answer any questions about the data: ${JSON.stringify(documents)}`;

    const response = await chat.sendMessageStream({ message: `${message}\n\nCONTEXT:\n${contextMessage}`});
    return response;
};
