import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno del servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const VALID_SYMBOL_IDS = [
  'W001', 'W012', 'W021', 'W024', 'W008', 'W011', 'W016', 'W015', 'W_NOISE',
  'M014', 'M004', 'M003', 'M009', 'M008', 'M016',
  'P002', 'P006', 'P011',
  'F001', 'F002', 'F005',
  'E001', 'E003', 'E007', 'E012',
];

const app = express();
app.use(express.json({ limit: '25mb' }));

app.post('/api/ai/analyze-blueprint', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/png',
      facilityType = 'Planta Industrial / Taller',
      facilityName = 'Instalación Principal',
      standard = 'ISO 7010 / NTP 399.010-1',
      notes = '',
    } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      facilityType?: string;
      facilityName?: string;
      standard?: string;
      notes?: string;
    };

    if (!imageBase64) {
      res.status(400).json({ error: 'Se requiere la imagen del plano renderizado para analizar.' });
      return;
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const ai = getAiClient();

    const prompt = `Eres un Ingeniero Senior de Seguridad y Salud en el Trabajo (SST / HSE) especializado en Mapas de Riesgos industriales según ${standard}.
Analiza cuidadosamente este plano arquitectónico/técnico de "${facilityName}" (Tipo de instalación: ${facilityType}).
Notas adicionales del usuario: ${notes || 'Ninguna'}.

Sistema de coordenadas normalizado:
- X va de 0 (borde izquierdo de la imagen) a 1000 (borde derecho).
- Y va de 0 (borde superior de la imagen) a 1000 (borde inferior).

Tu tarea:
1. Identificar las zonas principales visibles en el plano (producción, almacenamiento, tablero/subestación eléctrica, oficinas, accesos, pasillos, carga/descarga, etc.) con rectángulos (x, y, width, height en escala 0-1000) y evaluar su nivel de riesgo IPER (probabilidad 1-5, severidad 1-5).
2. Ubicar pictogramas de seguridad ISO 7010 recomendados exactamente donde correspondan en el plano (x, y en 0-1000). Usa EXCLUSIVAMENTE estos symbolId válidos: ${VALID_SYMBOL_IDS.join(', ')}.
   Significado rápido:
   - Advertencia: W001 (Peligro general), W012 (Riesgo eléctrico), W021 (Material inflamable), W024 (Atrapamiento/Maquinaria), W008 (Caída a desnivel), W011 (Piso resbaladizo), W016 (Sustancias químicas/tóxicas), W015 (Carga suspendida), W_NOISE (Ruido intenso).
   - Obligación EPP: M014 (Casco), M004 (Lentes), M003 (Protección auditiva), M009 (Guantes), M008 (Calzado seguridad), M016 (Mascarilla/Respirador).
   - Prohibición: P002 (Prohibido fumar/llama), P006 (Acceso restringido), P011 (No apagar con agua).
   - Incendios: F001 (Extintor), F002 (Gabinete/Manguera), F005 (Pulsador alarma).
   - Evacuación/Emergencia: E001 (Salida de emergencia), E003 (Botiquín), E007 (Punto de reunión), E012 (Ducha/Lavaojos).
3. Trazar 1 a 3 rutas de evacuación lógicas siguiendo pasillos hasta puertas exteriores o salidas.
4. Dar recomendaciones prácticas de limpieza de plano CAD/PDF y medidas preventivas prioritarias.

Sé preciso con las coordenadas visuales respecto a las paredes, pasillos, puertas y rótulos visibles en la imagen.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        responseMimeType: 'application/json',
        responseSchema: {
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
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al analizar el plano.';
    console.error('Error en /api/ai/analyze-blueprint:', error);
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/advise', async (req: Request, res: Response) => {
  try {
    const {
      question,
      facilityContext = '',
      currentSummary = '',
    } = req.body as {
      question?: string;
      facilityContext?: string;
      currentSummary?: string;
    };

    if (!question || !question.trim()) {
      res.status(400).json({ error: 'Escribe una consulta para el asistente SST.' });
      return;
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Contexto de la instalación: ${facilityContext || 'No especificado'}
Estado actual del mapa de riesgos: ${currentSummary || 'Sin elementos cargados aún'}

Consulta del usuario: ${question}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'Eres un especialista en Seguridad y Salud en el Trabajo (SST) y en preparación de planos CAD (DWG/DXF/PDF) para Mapas de Riesgos según ISO 7010, NTP 399.010-1, NFPA 10 y metodologías IPER. Responde en español de forma clara, estructurada, práctica y sin rodeos (máximo 250 palabras, usando viñetas concretas).',
      },
    });

    res.json({ answer: response.text ?? 'No se pudo generar una respuesta.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar al asistente IA.';
    console.error('Error en /api/ai/advise:', error);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MapaRiesgo Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
