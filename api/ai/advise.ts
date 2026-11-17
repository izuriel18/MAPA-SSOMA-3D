import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno de Vercel.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
        'x-goog-api-key': apiKey,
      },
    },
  });
}

export default async function handler(req: any, res: any) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Se requiere POST.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      question,
      facilityContext = '',
      currentSummary = '',
    } = body;

    if (!question || !String(question).trim()) {
      res.status(400).json({ error: 'Escribe una consulta para el asistente SST.' });
      return;
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Contexto de la instalación: ${facilityContext || 'No especificado'}
Estado actual del mapa de riesgos: ${currentSummary || 'Sin elementos cargados aún'}

Consulta del usuario: ${question}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'Eres un especialista Senior en Seguridad, Salud en el Trabajo y Medio Ambiente (SSOMA / SST) en Perú, con dominio exhaustivo de la Ley 29783, D.S. 005-2012-TR, R.M. 050-2013-TR (Formatos e IPERC), NTP 399.010-1 (Señales de seguridad), NTP 350.043-1 (Extintores), RNE Norma A.130 e inspecciones de INDECI / SUNAFIL, así como preparación de planos CAD (DWG/DXF/PDF). Responde en español de forma clara, técnica, estructurada y práctica, citando artículos y normas aplicables cuando sea pertinente.',
      },
    });

    res.status(200).json({ answer: response.text ?? 'No se pudo generar una respuesta.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar al asistente IA.';
    console.error('Error en /api/ai/advise:', error);
    res.status(500).json({ error: message });
  }
}
