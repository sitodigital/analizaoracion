const $ = (s) => document.querySelector(s);
const sourceText = $('#sourceText'), analyzeBtn = $('#analyzeBtn'), loading = $('#loading'), results = $('#results'), errorBox = $('#errorBox');
let cameraStream = null, activeDetail = null;

sourceText.addEventListener('input', () => $('#charCount').textContent = `${sourceText.value.length.toLocaleString('es-ES')} / 12.000`);
$('#clearBtn').addEventListener('click', () => { sourceText.value=''; sourceText.dispatchEvent(new Event('input')); $('#ocrStatus').textContent=''; sourceText.focus(); });
$('#sampleBtn').addEventListener('click', () => { sourceText.value='La profesora explicó la lección a sus alumnos porque mañana tendrán un examen.'; sourceText.dispatchEvent(new Event('input')); sourceText.focus(); });
$('#helpBtn').addEventListener('click', () => toast('Escribe un texto, sube una foto o utiliza la cámara. Después pulsa «Analizar oración». El motor gratuito ofrece un análisis orientativo; revisa especialmente las funciones sintácticas. Pulsa palabras o etiquetas para ver sus explicaciones.'));
$('#printBtn').addEventListener('click', () => window.print());

async function extractImage(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast('Selecciona un archivo de imagen válido.');
  $('#ocrStatus').textContent = 'Preparando reconocimiento de texto…';
  try {
    const worker = await Tesseract.createWorker('spa');
    const { data } = await worker.recognize(file);
    await worker.terminate();
    if (!data.text.trim()) throw new Error('No se ha detectado texto. Prueba con una imagen más nítida y bien iluminada.');
    sourceText.value = data.text.trim(); sourceText.dispatchEvent(new Event('input'));
    $('#ocrStatus').textContent = `Texto extraído (${Math.round(data.confidence)} % de confianza). Revísalo antes de analizar.`;
    sourceText.focus(); toast('Texto extraído correctamente.');
  } catch (e) { $('#ocrStatus').textContent = ''; showError(e.message || 'No se pudo leer la imagen.'); }
}
$('#imageInput').addEventListener('change', e => { extractImage(e.target.files[0]); e.target.value=''; });

$('#cameraBtn').addEventListener('click', async () => {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    $('#cameraVideo').srcObject = cameraStream; $('#cameraModal').classList.remove('hidden');
  } catch { toast('No se pudo acceder a la cámara. Comprueba los permisos del navegador y utiliza HTTPS.'); }
});
function stopCamera(){ if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;} $('#cameraModal').classList.add('hidden'); }
$('#closeCamera').addEventListener('click', stopCamera);
$('#cameraModal').addEventListener('click', e => { if(e.target.id==='cameraModal') stopCamera(); });
$('#captureBtn').addEventListener('click', async () => {
  const video=$('#cameraVideo'), canvas=$('#cameraCanvas'); if(!video.videoWidth) return toast('La cámara todavía se está iniciando.');
  canvas.width=video.videoWidth; canvas.height=video.videoHeight; canvas.getContext('2d').drawImage(video,0,0);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92)); stopCamera(); await extractImage(new File([blob],'captura.jpg',{type:'image/jpeg'}));
});

analyzeBtn.addEventListener('click', analyze);
async function analyze(){
  const text=sourceText.value.trim(); if(!text) return showError('Introduce una oración o un texto antes de analizarlo.');
  errorBox.classList.add('hidden'); results.classList.add('hidden'); loading.classList.remove('hidden'); analyzeBtn.disabled=true;
  try {
    const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
    const data=await response.json(); if(!response.ok) throw new Error(data.error || 'No se pudo analizar el texto.');
    renderResults(data); results.classList.remove('hidden'); results.scrollIntoView({behavior:'smooth',block:'start'});
  } catch(e){showError(e.message || 'Error de conexión.');}
  finally{loading.classList.add('hidden');analyzeBtn.disabled=false;}
}
function showError(message){errorBox.textContent=message;errorBox.classList.remove('hidden');}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderResults(data){
  $('#overview').textContent=data.overview||'Análisis sintáctico y morfológico del texto.';
  const host=$('#sentenceResults'); host.innerHTML='';
  (data.sentences||[]).forEach((sentence,index)=>{
    const card=document.createElement('article'); card.className='sentence-card';
    const words=sentence.words||[];
    const wordHtml=words.map((w,i)=>{
      const f=(w.function||'').toLowerCase(); const cls=f.includes('sujeto')?'subject-word':(f.includes('predicado')||f.includes('núcleo verbal')?'predicate-word':(f.includes('complement')||f.includes('atributo')?'complement-word':''));
      return `<button class="word ${cls}" data-sentence="${index}" data-word="${i}" title="Pulsa para ver el análisis de ${esc(w.word)}">${esc(w.word)}</button>`;
    }).join(' ');
    const constituents=(sentence.constituents||[]).map((c,i)=>`<button class="constituent-chip" data-const="${index}-${i}"><b>${esc(c.text)}</b>${esc(c.function)}</button>`).join('');
    const table=words.map((w,i)=>`<tr><td><button class="word-link" data-sentence="${index}" data-word="${i}">${esc(w.word)}</button></td><td>${esc(w.lemma||'—')}</td><td><span class="category-pill">${esc(w.category||'—')}</span><br><span class="muted">${esc(w.subtype||'')}</span></td><td>${esc(w.morphology||'—')}</td><td class="function-text">${esc(w.function||'—')}</td></tr>`).join('');
    card.innerHTML=`<div class="sentence-top"><h3>Oración ${index+1}</h3><span class="sentence-type">${esc(sentence.type||'Análisis')}</span></div><div class="sentence-body"><div class="sentence-text">${wordHtml||esc(sentence.text||'')}</div><div class="roles-grid">${roleCard(sentence.subject,'Sujeto','subject-card')}${roleCard(sentence.predicate,'Predicado','predicate-card')}</div>${constituents?`<div class="subheading">Funciones y sintagmas</div><div class="constituents">${constituents}</div>`:''}<div class="subheading">Análisis morfológico palabra por palabra</div><div style="overflow-x:auto"><table class="word-table"><thead><tr><th>Palabra</th><th>Lema</th><th>Categoría</th><th>Morfología</th><th>Función sintáctica</th></tr></thead><tbody>${table}</tbody></table></div><div class="detail-slot"></div></div>`;
    card.addEventListener('click',e=>{
      const wordButton=e.target.closest('[data-word]'); if(wordButton){const w=words[Number(wordButton.dataset.word)];showDetail(card,{title:w.word,category:w.category,subtitle:w.subtype,morphology:w.morphology,fn:w.function,explanation:w.explanation,lemma:w.lemma});return;}
      const constButton=e.target.closest('[data-const]');if(constButton){const [si,ci]=constButton.dataset.const.split('-').map(Number);const c=sentence.constituents[ci];showDetail(card,{title:c.text,category:'Función sintáctica',fn:c.function,explanation:c.explanation});}
    });
    host.appendChild(card);
  });
  const notes=$('#notesBox'); if(data.notes?.length){notes.innerHTML=`<b>Observaciones del análisis</b>${data.notes.map(n=>`<div>• ${esc(n)}</div>`).join('')}`;notes.classList.remove('hidden');}else notes.classList.add('hidden');
}
function roleCard(role,label,cls){if(!role)return `<div class="role-card ${cls}"><div class="role-label">${label}</div><div class="role-value">No identificado</div><p>Consulta las palabras para ver su función.</p></div>`;return `<div class="role-card ${cls}"><div class="role-label">${label}</div><div class="role-value">${esc(role.text||role.function||'')}</div><p><b>Núcleo:</b> ${esc(role.nucleus||'—')}<br>${esc(role.explanation||'')}</p></div>`;}
function showDetail(card,d){
  const slot=card.querySelector('.detail-slot'); slot.innerHTML=`<div class="detail-panel"><div><h4>${esc(d.title)} <span class="category-pill">${esc(d.category||'')}</span></h4>${d.lemma?`<p><b>Lema:</b> ${esc(d.lemma)}</p>`:''}${d.subtitle?`<p><b>Tipo:</b> ${esc(d.subtitle)}</p>`:''}${d.morphology?`<p><b>Rasgos morfológicos:</b> ${esc(d.morphology)}</p>`:''}${d.fn?`<p><b>Función sintáctica:</b> ${esc(d.fn)}</p>`:''}<p>${esc(d.explanation||'No hay una explicación adicional para este elemento.')}</p></div><button class="detail-close" aria-label="Cerrar explicación">×</button></div>`;
  slot.querySelector('.detail-close').addEventListener('click',()=>slot.innerHTML='');
  card.querySelectorAll('.word.selected').forEach(x=>x.classList.remove('selected'));
}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3600);}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(()=>{});
