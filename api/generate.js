module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, isJson } = req.body;
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key not configured on server' });
    }

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 2000,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('HuggingFace API Error:', data.error);
            return res.status(500).json({ error: data.error });
        }

        res.status(200).json({
            candidates: [{
                content: {
                    parts: [{
                        text: data[0]?.generated_text || ''
                    }]
                }
            }]
        });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Failed to connect to AI Engine" });
    }
}