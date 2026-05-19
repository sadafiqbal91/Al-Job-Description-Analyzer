export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, isJson } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key not configured on server' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: isJson ? { response_mime_type: "application/json" } : {}
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('Google API Error:', data.error);
            
            if (data.error.code === 429) {
                return res.status(429).json({ 
                    error: 'Rate limit exceeded. Please wait a moment and try again.',
                    retryAfter: 60
                });
            }
            
            if (data.error.code === 403) {
                return res.status(403).json({ 
                    error: 'API key suspended or invalid. Please contact administrator.'
                });
            }
            
            return res.status(data.error.code || 500).json({ error: data.error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Failed to connect to AI Engine" });
    }
}