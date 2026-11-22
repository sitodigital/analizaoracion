# ANALIZALAORACION

Aplicación web para análisis sintáctico y morfológico interactivo del español.

**Creado por Alfonso M. Martín Boza.**

## Qué incluye
- Introducción manual de oraciones y textos.
- Subida de fotografías y escaneo con cámara.
- OCR en el navegador mediante Tesseract.js en español.
- Análisis gramatical gratuito basado en reglas, sin clave API ni consumo de servicios de inteligencia artificial de pago.
- Resultados interactivos con explicaciones de palabras y funciones.
- Vista orientativa de sujeto, predicado, constituyentes y tabla morfológica.
- Impresión, favicon y manifiesto PWA.

## Importante sobre la precisión
El motor gratuito utiliza reglas y vocabulario básico. Puede clasificar mal palabras ambiguas y no resuelve de forma fiable todas las subordinadas, sujetos elípticos, pasivas, perífrasis ni estructuras complejas. Los resultados se presentan como orientativos y deben revisarse.

## Publicación en GitHub + Render
1. Sube el contenido de esta carpeta al repositorio GitHub, manteniendo `public` como subcarpeta.
2. En Render conecta el repositorio como **Web Service**.
3. Runtime: **Node**. Build Command: `npm install`. Start Command: `npm start`.
4. Selecciona el plan gratuito disponible y despliega. No necesitas añadir `OPENAI_API_KEY` ni `OPENAI_MODEL`.
5. Render puede suspender el servicio gratuito por inactividad y el primer acceso posterior puede tardar. Revisa las condiciones vigentes del plan gratuito.

## Uso
Cualquier usuario puede abrir la URL HTTPS desde ordenador, móvil o tableta. No necesita instalar Node ni descargar el proyecto. La instalación PWA es opcional.

## Costes
El código no utiliza una API de IA de pago ni requiere claves secretas. El OCR utiliza Tesseract.js desde CDN, por lo que necesita conexión a Internet para cargar sus recursos. Render ofrece un nivel gratuito sujeto a sus límites y condiciones; no se garantiza disponibilidad permanente sin restricciones.
