import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const systemPrompt = `Eres un lingüista y profesor experto en gramática normativa y análisis sintáctico del español. Analiza con rigor el texto proporcionado, sin inventar datos. Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin Markdown, con esta estructura:
{
 "title":"Análisis del texto",
 "overview":"Resumen breve del tipo de texto y sus construcciones",
 "sentences":[{
  "text":"oración exacta",
  "type":"Oración simple/enunciativa/etc.",
  "syntaxSummary":"Resumen sintáctico",
  "subject":{"text":"...","function":"Sujeto","nucleus":"...","explanation":"..."},
  "predicate":{"text":"...","function":"Predicado verbal/nominal","nucleus":"...","explanation":"..."},
  "constituents":[{"text":"...","function":"Sujeto / Núcleo del sujeto / CD / CI / CC de lugar / Atributo / Complemento del nombre / etc.","explanation":"Explicación breve y específica"}],
  "words":[{"word":"forma exacta","lemma":"lema","category":"Sustantivo/Verbo/Determinante/Adjetivo/Pronombre/Adverbio/Preposición/Conjunción/Interjección","subtype":"subtipo","morphology":"rasgos morfológicos completos","function":"función sintáctica en esta oración","explanation":"explicación pedagógica de por qué"}]
 }],
 "notes":["Ambigüedades o aclaraciones relevantes"]
}
Reglas: 1) Separa correctamente las oraciones. 2) En morfología indica, cuando proceda, género, número, persona, número verbal, tiempo, modo, aspecto, forma no personal, grado, determinación, tipo de pronombre, etc. 3) No confundas categoría morfológica con función sintáctica: explícalas por separado. 4) Si una palabra está sustantivada o una construcción es ambigua, indícalo. 5) Para sujeto omitido usa el texto "Sujeto elíptico" y explica la persona verbal; si es impersonal indícalo. 6) Analiza subordinadas y coordinadas con el máximo detalle posible; identifica nexo, proposición y función cuando se pueda. 7) No fuerces análisis cuando falte contexto: advierte la ambigüedad en notes. 8) Conserva tildes y signos. 9) Para textos largos, analiza todas las oraciones, sin omitir ninguna. 10) Las explicaciones deben ser claras para estudiantes de secundaria.`;

app.post('/api/analyze', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Escribe o extrae un texto antes de analizarlo.' });
    if (text.length > 12000) return res.status(413).json({ error: 'El texto supera el límite de 12.000 caracteres. Divide el contenido en varios análisis.' });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Falta configurar OPENAI_API_KEY en el archivo .env del servidor. Consulta README.md.' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza sintáctica y morfológicamente este texto en español:\n\n${text}` }
        ]
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || `El proveedor devolvió el error ${response.status}.`;
      return res.status(response.status === 401 ? 502 : 502).json({ error: message });
    }
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'El motor no devolvió un análisis. Inténtalo de nuevo.' });
    let analysis;
    try { analysis = JSON.parse(content); } catch { return res.status(502).json({ error: 'La respuesta del motor no tenía un formato válido. Inténtalo de nuevo.' }); }
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo completar el análisis. Comprueba la conexión del servidor.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'ANALIZALAORACION' }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`ANALIZAlaoracion disponible en http://localhost:${PORT}`));
