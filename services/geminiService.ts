
import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { Loan, User, AIReportData, AIReportPageData } from '../types';

// Safely get the API key. In a browser-only environment, process may not be defined.
// Your build tool (like on Vercel) should replace process.env.API_KEY with the actual value.
const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || undefined;

if (!apiKey) {
    console.warn("API_KEY environment variable not found. Gemini API calls will be disabled. Ensure it's set in your deployment environment.");
}

// Initialize AI with the key if available, otherwise use an empty string to prevent crashes.
// API calls will fail without a valid key, but the app will load.
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

let chat: Chat | null = null;
let chatInitializedForUserId: number | null = null;

const initializeChat = (user: User) => {
    const systemInstruction = `You are MicroBot, a friendly and helpful AI assistant for MicroFin, a microcredit management system.
    Your goal is to assist users with their questions about the platform, microfinance concepts, and their personal loan data.
    Be concise, clear, and professional.
    The current user is ${user.name}, who is a(n) ${user.role}.
    Today's date is ${new Date().toLocaleDateString()}.
    When asked about loans, use the provided data. Do not invent loan details.
    If you don't know the answer, say "I'm sorry, I don't have that information, but I can help with other questions about MicroFin."`;

    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    chatInitializedForUserId = user.id;
};

export const getChatbotResponseStream = async (message: string, user: User, loans: Loan[]): Promise<AsyncGenerator<GenerateContentResponse>> => {
    if (!chat || chatInitializedForUserId !== user.id) { // Re-initialize if chat is not set or user has changed
        initializeChat(user);
    }
    
    const userLoans = loans.filter(l => l.borrowerId === user.id);
    const prompt = `
      User question: "${message}"

      User's loan data (for context, if relevant):
      ${userLoans.length > 0 ? JSON.stringify(userLoans, null, 2) : "User has no loans."}
    `;

    if (!chat) throw new Error("Chat not initialized");

    return chat.sendMessageStream({ message: prompt });
};


const reportSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief overall summary (2-3 sentences) of the financial situation." },
        positiveTrends: {
            type: Type.ARRAY,
            description: "A list of 3 key positive trends.",
            items: {
                type: Type.OBJECT,
                properties: {
                    trend: { type: Type.STRING, description: "Title of the positive trend." },
                    evidence: { type: Type.STRING, description: "A sentence explaining the trend with a supporting data point." }
                },
                required: ["trend", "evidence"]
            }
        },
        risks: {
            type: Type.ARRAY,
            description: "A list of 3 key risks or areas for improvement.",
            items: {
                type: Type.OBJECT,
                properties: {
                    risk: { type: Type.STRING, description: "Title of the risk." },
                    evidence: { type: Type.STRING, description: "A sentence explaining the risk with a supporting data point." }
                },
                required: ["risk", "evidence"]
            }
        },
        recommendations: {
            type: Type.ARRAY,
            description: "A list of 2 actionable recommendations.",
            items: { type: Type.STRING }
        }
    },
    required: ["summary", "positiveTrends", "risks", "recommendations"]
};


export const generateFinancialReport = async (loans: Loan[], users: User[]): Promise<AIReportData> => {
    const prompt = `
      You are a senior financial analyst for a microcredit company called MicroFin.
      Analyze the following loan and user data to generate a concise report in JSON format.
      Focus on portfolio health, risk, and performance.
      All monetary values are in MZN.

      DATASET:
      Total Users: ${users.length}
      Total Loans: ${loans.length}
      Loans Data: ${JSON.stringify(loans, null, 2)}

      Based on this data, provide an analysis.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: reportSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const reportData = JSON.parse(jsonText);
        return reportData as AIReportData;
    } catch (error) {
        console.error("Error parsing Gemini report response:", error);
        console.error("Raw response text:", response.text);
        throw new Error("Failed to generate or parse the AI financial report.");
    }
};

const aiReportPageSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A detailed textual analysis (3-4 paragraphs) of the provided loan data. Discuss portfolio composition by purpose, performance of different loan types, risk assessment based on overdue loans, and cash flow trends (new loans vs repayments). Use markdown for formatting." },
        chart1: {
            type: Type.OBJECT,
            description: "Data for a stacked bar chart showing loan statuses by purpose.",
            properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of unique loan purposes." },
                datasets: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING, description: "Loan status (e.g., Active, Overdue, Completed)." },
                            data: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Count of loans for each purpose in this status." },
                            backgroundColor: { type: Type.STRING, description: "A hex color code for this dataset (e.g., '#4ade80' for active, '#f87171' for overdue)." },
                        },
                        required: ["label", "data", "backgroundColor"]
                    }
                }
            },
            required: ["labels", "datasets"]
        },
        chart2: {
            type: Type.OBJECT,
            description: "Data for a line chart comparing new loans disbursed vs. repayments received over time.",
            properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of months or time periods for the x-axis." },
                datasets: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING, description: "'New Loans Disbursed' or 'Repayments Received'." },
                            data: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Aggregated amount for each time period." },
                            borderColor: { type: Type.STRING, description: "A hex color code for the line." },
                            backgroundColor: { type: Type.STRING, description: "A semi-transparent hex color code for the area under the line." },
                        },
                        required: ["label", "data", "borderColor", "backgroundColor"]
                    },
                    minItems: 2,
                    maxItems: 2,
                }
            },
            required: ["labels", "datasets"]
        }
    },
    required: ["summary", "chart1", "chart2"]
};

export const generateAIReportPage = async (loans: Loan[], users: User[], period: string): Promise<AIReportPageData> => {
     const prompt = `
      You are a senior financial analyst for a microcredit company called MicroFin.
      Analyze the following loan and user data for the specified period: "${period}".
      Generate a detailed report in JSON format according to the provided schema.
      Focus on portfolio health, risk concentration by purpose, and cash flow trends.
      All monetary values are in MZN. Today is ${new Date().toISOString().split('T')[0]}.

      DATASET:
      Total Users in System: ${users.length}
      Loans within period: ${loans.length}
      Loans Data for Analysis: ${JSON.stringify(loans, null, 2)}

      Based on this data, provide the detailed analysis.
      For chart2, if the period is long, group data by month. If short, group by week or day. Make the labels clear.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: aiReportPageSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const reportData = JSON.parse(jsonText);
        return reportData as AIReportPageData;
    } catch (error) {
        console.error("Error parsing AI Page Report response:", error);
        console.error("Raw response text:", response.text);
        throw new Error("Failed to generate or parse the AI page report.");
    }
}

export const generateItemAnalysis = async (itemName: string, itemData: any): Promise<string> => {
    const prompt = `
        You are a helpful financial analyst assistant. Your task is to explain a data item to a microcredit manager.
        The item is named "${itemName}".
        Here is the data for the item:
        ${JSON.stringify(itemData, null, 2)}

        Based on this data, provide a concise, easy-to-understand explanation of what this item represents and a single actionable recommendation.
        Format the output as a single paragraph. Start with the key insight, then provide the recommendation.
        Address the manager directly but professionally.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error generating analysis for ${itemName}:`, error);
        throw new Error(`Failed to generate analysis for ${itemName}.`);
    }
};
