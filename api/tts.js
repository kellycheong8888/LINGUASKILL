const { synthesizeSpeech } = require('./processor');

module.exports = async (req, res) => {
    // CORS 跨域配置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-proxy-secret');
    res.setHeader('Access-Control-Max-Age', '86400');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只接受 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, voice, rate, pitch } = req.body;

    // 参数验证
    if (!text) {
        return res.status(400).json({ error: 'Missing text parameter' });
    }

    try {
        const audioData = await synthesizeSpeech(text, voice, rate, pitch);
        
        // 返回 base64 编码的音频
        const base64Audio = audioData.toString('base64');
        res.status(200).json({
            success: true,
            audio: base64Audio
        });

    } catch (error) {
        console.error('TTS 错误:', error.message);
        
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
