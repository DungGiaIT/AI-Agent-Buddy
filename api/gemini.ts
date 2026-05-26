import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Cấu hình CORS để App di động có thể gọi API mà không bị chặn
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Xử lý preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // API Key được lưu bí mật trên môi trường của Vercel (Environment Variables)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Lỗi máy chủ: Chưa cấu hình GEMINI_API_KEY' });
    }

    // Gọi đến mô hình gemini-2.0-flash-lite-preview-02-05 (bản Flash Lite mới nhất)
    const model = 'gemini-2.0-flash-lite-preview-02-05';
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    // Chuyển tiếp nguyên vẹn body từ Client (bao gồm cả prompt và generationConfig)
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Lỗi khi gọi Gemini Proxy:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ', details: error.message });
  }
}
