export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.status(200).json({
    status: 'ok',
    hasApiKey: hasKey,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
}

