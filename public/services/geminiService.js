
export const parseTextToDocument = async (text) => {
    const response = await fetch('/api/gemini/parsetext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
        } catch (e) {
            // response body is not JSON or is empty
        }
        console.error("Server error parsing document:", errorMsg);
        throw new Error(errorMsg);
    }
    
    return response.json();
};

export const generateReportFromData = async (documents) => {
    const response = await fetch('/api/gemini/generatereport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
    });

    if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
        } catch (e) {
             // response body is not JSON or is empty
        }
        console.error("Server error generating report:", errorMsg);
        throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.report;
};
