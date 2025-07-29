
export const sendMessageStream = async (message, documents) => {
    const response = await fetch('/api/gemini/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, documents })
    });

    if (!response.ok) {
        throw new Error(`Server responded with an error: ${response.status}`);
    }
    if (!response.body) {
        throw new Error('The response from the server does not contain a body to stream.');
    }
    
    return response.body;
};
