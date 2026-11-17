import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

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

const VALID_SYMBOL_IDS = [
  // Advertencia NTP 399.010-1
  'W001', 'W012', 'W021', 'W024', 'W008', 'W011', 'W016', 'W015', 'W_MONTACARGA', 'W_NOISE', 'W_BIOLOGICO',
  // Obligación EPP
  'M014', 'M004', 'M003', 'M009', 'M008', 'M016', 'M_ARNES', 'M_CHALECO',
  // Prohibición
  'P002', 'P006', 'P011', 'P_CELULAR', 'P_BLOQUEAR',
  // Lucha contra incendios NTP 350.043-1
  'F001', 'F_CO2', 'F_AGUA', 'F_K', 'F002', 'F005', 'F_SIRENA',
  // Evacuación y sismos NTP 399.010-1 / INDECI
  'E_SISMO', 'E001', 'E_RUTA_IZQ', 'E_RUTA_DER', 'E_RUTA_RECTA', 'E007', 'E003', 'E_CAMILLA', 'E012', 'E_LUZ', 'E_ESCALERA',
];

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Resumen técnico ejecutivo del plano analizado y principales hallazgos de riesgo.',
    },
    zones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          riskCategory: {
            type: Type.STRING,
            description: 'Una de: Mecánico, Eléctrico, Incendio, Químico, Físico, Ergonómico, Locativo, Biológico',
          },
          x: { type: Type.NUMBER, description: 'Coordenada X esquina superior izquierda (0-1000)' },
          y: { type: Type.NUMBER, description: 'Coordenada Y esquina superior izquierda (0-1000)' },
          width: { type: Type.NUMBER, description: 'Ancho de zona (0-1000)' },
          height: { type: Type.NUMBER, description: 'Alto de zona (0-1000)' },
          probability: { type: Type.INTEGER, description: 'Probabilidad de 1 a 5' },
          severity: { type: Type.INTEGER, description: 'Severidad de 1 a 5' },
          controls: { type: Type.STRING, description: 'Controles recomendados de ingeniería, administrativos y EPP' },
        },
        required: ['name', 'riskCategory', 'x', 'y', 'width', 'height', 'probability', 'severity', 'controls'],
      },
    },
    markers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symbolId: { type: Type.STRING },
          label: { type: Type.STRING },
          zoneName: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          riskCategory: { type: Type.STRING },
          probability: { type: Type.INTEGER },
          severity: { type: Type.INTEGER },
          notes: { type: Type.STRING },
        },
        required: ['symbolId', 'label', 'zoneName', 'x', 'y', 'riskCategory', 'probability', 'severity', 'notes'],
      },
    },
    evacuationRoutes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          points: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
              required: ['x', 'y'],
            },
          },
        },
        required: ['name', 'points'],
      },
    },
    cadTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Recomendaciones prácticas para mejorar el plano base DWG/PDF o validar en campo.',
    },
  },
  required: ['summary', 'zones', 'markers', 'evacuationRoutes', 'cadTips'],
};

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
      imageBase64,
      mimeType = 'image/jpeg',
      facilityType = 'Planta Industrial / Taller',
      facilityName = 'Instalación Principal',
      standard = 'NTP 399.010-1 / Ley 29783 / INDECI',
      notes = '',
      model = DEFAULT_MODEL,
    } = body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Se requiere la imagen del plano para analizar.' });
      return;
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const ai = getAiClient();

    const prompt = `Eres un Ingeniero Senior de Seguridad y Salud en el Trabajo (SST / SSOMA) especializado en Mapas de Riesgos y Planes de Evacuación industriales en Perú bajo ${standard} (Ley 29783, D.S. 005-2012-TR, NTP 399.010-1, NTP 350.043-1, RNE A.130 e INDECI).
Analiza cuidadosamente este plano arquitectónico/técnico de "${facilityName}" (Tipo de instalación: ${facilityType}).
Notas adicionales o datos de IPERC del usuario: ${notes || 'Ninguna'}.

Sistema de coordenadas normalizado:
- X va de 0 (borde izquierdo de la imagen) a 1000 (borde derecho).
- Y va de 0 (borde superior de la imagen) a 1000 (borde inferior).

Tu tarea:
1. Identificar las zonas principales visibles en el plano (producción, almacenamiento, subestación/tableros eléctricos, oficinas, pasillos, carga/descarga, cocinas, etc.) con rectángulos (x, y, width, height en escala 0-1000) y evaluar su nivel de riesgo IPERC (probabilidad 1-5, severidad 1-5).
2. Ubicar pictogramas de seguridad reglamentarios exactamente donde correspondan en el plano (x, y en 0-1000). Usa EXCLUSIVAMENTE estos symbolId válidos: ${VALID_SYMBOL_IDS.join(', ')}.
   Significado normativo clave:
   - Evacuación/Sismo: E_SISMO (Zona Segura en Caso de Sismos - en columnas/vigas), E001 (Salida de emergencia), E_RUTA_IZQ, E_RUTA_DER, E_RUTA_RECTA (Flechas de evacuación), E007 (Punto de reunión exterior), E003 (Botiquín), E_CAMILLA (Camilla), E012 (Ducha/Lavaojos), E_LUZ (Luz de emergencia).
   - Incendios: F001 (Extintor PQS), F_CO2 (Extintor CO2 en tableros), F_AGUA (Extintor agua), F_K (Extintor K en cocinas), F002 (Gabinete contra incendios), F005 (Pulsador alarma), F_SIRENA (Sirena).
   - Advertencia: W001 (Peligro general), W012 (Riesgo eléctrico), W021 (Material inflamable), W024 (Atrapamiento/Maquinaria), W008 (Caída a desnivel), W011 (Piso resbaladizo), W016 (Sustancias químicas/tóxicas), W015 (Carga suspendida), W_MONTACARGA (Tránsito montacargas), W_NOISE (Ruido intenso >85 dB), W_BIOLOGICO (Riesgo biológico).
   - Obligación EPP: M014 (Casco), M004 (Lentes), M003 (Protección auditiva), M009 (Guantes), M016 (Respirador/Mascarilla), M_ARNES (Arnés trabajos altura), M_CHALECO (Chaleco reflectante).
   - Prohibición: P002 (Prohibido fumar/llama), P006 (Acceso restringido), P011 (No apagar con agua), P_CELULAR (Prohibido celulares), P_BLOQUEAR (No obstruir salidas).
3. Trazar 1 a 3 rutas de evacuación lógicas siguiendo pasillos hasta puertas exteriores o salidas de escape.
4. Dar recomendaciones prácticas de adecuación según normativa peruana y validación en campo.

Sé muy preciso con las coordenadas visuales respecto a las paredes, pasillos, puertas y rótulos visibles en la imagen.`;

    let activeModel = model;
    let fallbackNotice = '';

    const executeAnalysis = async (targetModel: string) => {
      return await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_SCHEMA,
        },
      });
    };

    let response;
    try {
      response = await executeAnalysis(activeModel);
    } catch (modelErr: any) {
      // Si el modelo pedido es Hydrogen y falla por demanda (503/500/timeout), conmutar a 3.8 Flash
      if (activeModel === 'gemini-4-hydrogen') {
        console.warn('Gemini 4 Hydrogen falló, conmutando a gemini-3.8-flash...', modelErr?.message);
        activeModel = 'gemini-3.8-flash';
        fallbackNotice = 'ℹ️ Nota: Gemini 4 Hydrogen presentó alta demanda temporal en Google. El análisis se completó exitosamente con Gemini 3.8 Flash.\n\n';
        response = await executeAnalysis(activeModel);
      } else {
        throw modelErr;
      }
    }

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);
    if (fallbackNotice && parsed.summary) {
      parsed.summary = fallbackNotice + parsed.summary;
    }
    res.status(200).json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al analizar el plano.';
    console.error('Error en /api/ai/analyze-blueprint:', error);
    res.status(500).json({ error: message });
  }
}
