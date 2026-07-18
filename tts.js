const axios = require('axios');

module.exports = async (req, res) => {
    // ============================================================
    // ★★★ CORS 跨域配置 ★★★
    // ============================================================
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // ============================================================
    // 只接受 POST 请求
    // ============================================================
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, voice, rate, pitch } = req.body;

    // ============================================================
    // 参数验证
    // ============================================================
    if (!text) {
        return res.status(400).json({ error: 'Missing text parameter' });
    }

    // ============================================================
    // Azure TTS 配置
    // ============================================================
    // ★★★ 请替换为您的 Azure 密钥和区域 ★★★
    const AZURE_KEY = process.env.AZURE_KEY || '您的Azure密钥';
    const AZURE_REGION = process.env.AZURE_REGION || '您的Azure区域';
    const AZURE_ENDPOINT = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const voiceName = voice || 'en-GB-SoniaNeural';
    const speed = rate || 1.0;
    const pitchValue = pitch || 0;

    // 构建 SSML
    const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
            <voice name="${voiceName}">
                <prosody rate="${speed}" pitch="${pitchValue}%">
                    ${text}
                </prosody>
            </voice>
        </speak>
    `;

    try {
        const response = await axios({
            method: 'post',
            url: AZURE_ENDPOINT,
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_KEY,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                'User-Agent': 'Linguaskill-TTS-Proxy'
            },
            data: ssml,
            responseType: 'arraybuffer'
        });

        // 返回音频数据
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', response.data.length);
        res.status(200).send(response.data);

    } catch (error) {
        console.error('Azure TTS 错误:', error.message);
        
        if (error.response) {
            res.status(error.response.status).json({
                error: 'Azure TTS API 错误',
                details: error.response.data.toString()
            });
        } else {
            res.status(500).json({
                error: '内部服务器错误',
                details: error.message
            });
        }
    }
};
