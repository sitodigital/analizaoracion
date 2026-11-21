# ANALIZALAORACION

Aplicación web para análisis sintáctico y morfológico interactivo del español.

**Creado por Alfonso M. Martín Boza.**

## Qué incluye
- Introducción manual de oraciones y textos.
- Subida de fotografías e imágenes.
- Escaneo con cámara (requiere HTTPS o localhost).
- OCR en el navegador mediante Tesseract.js, con idioma español.
- Análisis avanzado mediante API compatible con OpenAI.
- Resultados interactivos: al pulsar una palabra o una función aparece su explicación.
- Vista de sujeto, predicado, constituyentes y tabla morfológica.
- Impresión de resultados, favicon SVG y manifiesto PWA.

## ¿Hay que instalar algo para usarla?
**No.** Una vez publicada en un hosting, cualquier persona podrá entrar desde el navegador de un ordenador, móvil o tableta. No necesita instalar Node.js, descargar el proyecto ni instalar la PWA. La instalación como aplicación en la pantalla de inicio es opcional.

Node.js y la configuración del servidor solo son necesarios para quien administra y publica la aplicación.

## Publicarla en Internet (recomendado: GitHub + Render)

### 1. Subir el proyecto a GitHub
1. Entra en https://github.com e inicia sesión.
2. Crea un repositorio nuevo llamado `analizalaoracion`. Puede ser privado o público.
3. Sube el contenido de esta carpeta al repositorio (no subas ningún archivo `.env`).

### 2. Crear el servidor en Render
1. Entra en https://render.com y crea una cuenta o inicia sesión.
2. Selecciona **New** y después **Web Service**.
3. Conecta GitHub y selecciona el repositorio `analizalaoracion`.
4. Configura: Runtime **Node**; Build Command `npm install`; Start Command `npm start`.
5. En **Environment** añade `OPENAI_API_KEY` con tu clave API privada. Añade también `OPENAI_MODEL` con `gpt-4.1-mini` si quieres usar ese modelo.
6. Pulsa **Deploy** y espera a que termine. Render te dará una dirección HTTPS pública.

También se incluye `render.yaml` para facilitar la configuración como Blueprint si prefieres usar esa opción. Comprueba el plan y sus condiciones vigentes en Render antes de desplegar.

### 3. Comprobar que funciona
- Abre la dirección HTTPS de Render.
- Prueba el botón **Probar ejemplo** y después **Analizar oración**.
- Prueba subir una fotografía y usar la cámara. El acceso a cámara necesita HTTPS y permiso del navegador.
- La ruta `/api/health` debe responder con `{"ok":true,...}`.

### 4. Usarla desde todos los dispositivos
Comparte la URL HTTPS de Render. En iPhone/iPad se puede usar Safari > Compartir > Añadir a pantalla de inicio. En Android se puede usar Chrome > menú > Instalar aplicación o Añadir a pantalla de inicio. En ordenador basta con abrir el enlace.

## Ejecutarla localmente (solo para desarrollo)
1. Instala Node.js 18 o superior.
2. Abre esta carpeta en Terminal.
3. Ejecuta `npm install`.
4. Copia `.env.example` a `.env` y añade tu clave en `OPENAI_API_KEY`.
5. Ejecuta `npm start` y abre `http://localhost:3000`.

## Costes y aspectos importantes
- La clave API y el consumo del modelo se facturan por separado de ChatGPT. Configura límites de gasto en el proveedor de API.
- El hosting puede tener límites, suspensiones o costes según el plan elegido. Revisa las condiciones actuales de Render.
- El OCR usa Tesseract.js y descarga sus recursos desde Internet.
- Las imágenes se procesan en el navegador; el texto reconocido o escrito se envía al servidor y al proveedor de IA para el análisis. No introduzcas información privada o sensible.
- No publiques nunca el archivo `.env` ni la clave API. La clave debe guardarse únicamente como variable de entorno en Render.
- Antes de compartirla ampliamente, conviene añadir control de uso, límites por IP o autenticación para evitar consumos no autorizados de API.
