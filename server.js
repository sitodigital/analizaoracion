import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const articles = new Set('el la los las un una unos unas lo al del'.split(' '));
const demonstratives = new Set('este esta estos estas ese esa esos esas aquel aquella aquellos aquellas esto eso aquello'.split(' '));
const possessives = new Set('mi mis tu tus su sus nuestro nuestra nuestros nuestras vuestro vuestra vuestros vuestras'.split(' '));
const pronouns = new Set('yo tú él ella ello nosotros nosotras vosotros vosotras ellos ellas usted ustedes me te se nos os lo los las le les mí ti sí conmigo contigo alguien nadie algo nada quien quienes que cual cuales'.split(' '));
const prepositions = new Set('a ante bajo cabe con contra de desde durante en entre hacia hasta mediante para por según sin so sobre tras versus vía'.split(' '));
const conjunctions = new Set('y e ni o u pero mas sino aunque porque pues si cuando mientras como que'.split(' '));
const adverbs = new Set('no sí también tampoco muy más menos ayer hoy mañana aquí ahí allí cerca lejos bien mal así pronto tarde siempre nunca jamás ya todavía aún después antes'.split(' '));
const commonVerbs = new Set(('ser estar haber tener hacer decir poder ir ver dar saber querer llegar pasar deber poner parecer quedar creer hablar llevar dejar seguir encontrar llamar venir pensar salir volver tomar conocer vivir sentir tratar mirar contar empezar esperar buscar existir trabajar escribir leer explicar estudiar aprender enseñar cantar jugar comer beber dormir caminar correr comprar vender abrir cerrar escuchar necesitar gustar').split(' '));
const irregularForms = new Map(Object.entries({
  es:['ser','presente','indicativo',3,'singular'], son:['ser','presente','indicativo',3,'plural'], eres:['ser','presente','indicativo',2,'singular'], soy:['ser','presente','indicativo',1,'singular'], era:['ser','pretérito imperfecto','indicativo',3,'singular'], eran:['ser','pretérito imperfecto','indicativo',3,'plural'], fue:['ser/ir','pretérito perfecto simple','indicativo',3,'singular'], fueron:['ser/ir','pretérito perfecto simple','indicativo',3,'plural'], está:['estar','presente','indicativo',3,'singular'], están:['estar','presente','indicativo',3,'plural'], estoy:['estar','presente','indicativo',1,'singular'], estás:['estar','presente','indicativo',2,'singular'], hay:['haber','presente','indicativo',3,'singular'], han:['haber','presente','indicativo',3,'plural'], he:['haber','presente','indicativo',1,'singular'], hemos:['haber','presente','indicativo',1,'plural'], ha:['haber','presente','indicativo',3,'singular'], había:['haber','pretérito imperfecto','indicativo',3,'singular'], tienen:['tener','presente','indicativo',3,'plural'], tiene:['tener','presente','indicativo',3,'singular'], tengo:['tener','presente','indicativo',1,'singular'], explicó:['explicar','pretérito perfecto simple','indicativo',3,'singular'], explicó:['explicar','pretérito perfecto simple','indicativo',3,'singular'], tendrán:['tener','futuro simple','indicativo',3,'plural'], quiero:['querer','presente','indicativo',1,'singular'], puede:['poder','presente','indicativo',3,'singular'], pueden:['poder','presente','indicativo',3,'plural'], va:['ir','presente','indicativo',3,'singular'], voy:['ir','presente','indicativo',1,'singular'], vamos:['ir','presente','indicativo',1,'plural'], hacen:['hacer','presente','indicativo',3,'plural'], hace:['hacer','presente','indicativo',3,'singular'], dijo:['decir','pretérito perfecto simple','indicativo',3,'singular']
}));
function guessVerb(w){
  if(irregularForms.has(w)){const [lemma,time,mood,person,number]=irregularForms.get(w);return {lemma,time,mood,person,number};}
  for(const [end,tense,person,number] of [['amos','presente',1,'plural'],['emos','presente',1,'plural'],['imos','presente',1,'plural'],['áis','presente',2,'plural'],['éis','presente',2,'plural'],['ís','presente',2,'plural'],['an','presente',3,'plural'],['en','presente',3,'plural'],['as','presente',2,'singular'],['es','presente',2,'singular'],['a','presente',3,'singular'],['e','presente',3,'singular'],['o','presente',1,'singular'],['ó','pretérito perfecto simple',3,'singular'],['aron','pretérito perfecto simple',3,'plural'],['ieron','pretérito perfecto simple',3,'plural'],['aba','pretérito imperfecto',3,'singular'],['aban','pretérito imperfecto',3,'plural'],['ía','pretérito imperfecto',3,'singular'],['ían','pretérito imperfecto',3,'plural'],['ará','futuro simple',3,'singular'],['arán','futuro simple',3,'plural']]){
    if(w.endsWith(end)&&w.length>end.length+2){let stem=w.slice(0,-end.length);let lemma=stem+(w.endsWith('ar')?'': ''); if(['amos','áis','an','as','a','ó','aron','aba','aban','ará','arán'].includes(end)) lemma=stem+'ar'; else if(['emos','éis','en','es','e','ieron'].includes(end)) lemma=stem+'er'; else if(['imos','ís'].includes(end)) lemma=stem+'ir';
      if(commonVerbs.has(lemma)||['tener','hacer','decir','poder','vivir','comer','leer','escribir','explicar','estudiar','aprender','enseñar','caminar','jugar','trabajar','llegar','mirar','comprar','cantar'].includes(lemma))return {lemma,time:tense,mood:'indicativo',person,number};
    }
  }
  if(w.endsWith('ar')||w.endsWith('er')||w.endsWith('ir'))return {lemma:w,time:'—',mood:'—',person:null,number:null,nonfinite:'infinitivo'};
  if(w.endsWith('ando')||w.endsWith('iendo'))return {lemma:w.endsWith('ando')?w.slice(0,-4)+'ar':w.slice(0,-4)+'er',time:'—',mood:'—',person:null,number:null,nonfinite:'gerundio'};
  if(w.endsWith('ado')||w.endsWith('ido'))return {lemma:w.endsWith('ado')?w.slice(0,-4)+'ar':w.slice(0,-3)+'er',time:'—',mood:'—',person:null,number:null,nonfinite:'participio'};
  return null;
}
function classify(raw){
 const w=raw.toLocaleLowerCase('es'), clean=w.replace(/^[¿¡([{¿]+|[.,;:!?…)}\]]+$/g,'');
 if(!clean)return null;
 if(articles.has(clean)||demonstratives.has(clean)||possessives.has(clean)) return {category:'Determinante',subtype:articles.has(clean)?'Artículo':demonstratives.has(clean)?'Demostrativo':'Posesivo',lemma:clean,morphology:'Forma '+(clean.endsWith('s')?'plural':'singular')+'; género según la forma (cuando se distingue).',explanation:'Acompaña al sustantivo y contribuye a concretar o presentar su referencia.'};
 if(pronouns.has(clean))return {category:'Pronombre',subtype:'Personal o relativo/interrogativo (según contexto)',lemma:clean,morphology:'Forma invariable o con rasgos de persona, número y género según el pronombre.',explanation:'Puede sustituir a un grupo nominal o introducir una relación; su función depende de la oración.'};
 if(prepositions.has(clean))return {category:'Preposición',subtype:'Preposición',lemma:clean,morphology:'Palabra invariable.',explanation:'Introduce un complemento y establece una relación con otro elemento.'};
 if(conjunctions.has(clean))return {category:'Conjunción',subtype:'Coordinante o subordinante (según contexto)',lemma:clean,morphology:'Palabra invariable.',explanation:'Enlaza palabras, grupos u oraciones. El valor concreto depende del contexto.'};
 if(adverbs.has(clean))return {category:'Adverbio',subtype:'Negación, afirmación, cantidad, tiempo, lugar o modo',lemma:clean,morphology:'Palabra invariable.',explanation:'Modifica un verbo, un adjetivo, otro adverbio o toda la oración.'};
 const v=guessVerb(clean); if(v)return {category:'Verbo',subtype:v.nonfinite||'Forma personal',lemma:v.lemma,morphology:v.nonfinite?`Forma no personal: ${v.nonfinite}.`:`${v.person}ª persona, ${v.number}; ${v.time}, modo ${v.mood}.`,verb:v,explanation:'Expresa una acción, proceso o estado. La forma verbal aporta información de persona, número, tiempo y modo cuando es personal.'};
 if(clean.endsWith('mente'))return {category:'Adverbio',subtype:'Adverbio de modo',lemma:clean,morphology:'Palabra invariable.',explanation:'Adverbio formado habitualmente a partir de un adjetivo.'};
 if(/(oso|osa|able|ible|al|ivo|iva|ado|ada|ido|ida)$/.test(clean))return {category:'Adjetivo',subtype:'Calificativo (probable)',lemma:clean,morphology:`Género ${/(osa|iva|ada|ida)$/.test(clean)?'femenino':'masculino o común'}; número ${clean.endsWith('s')?'plural':'singular'}.`,explanation:'Expresa una cualidad o característica y suele complementar a un sustantivo.'};
 if(/(ción|sión|dad|tad|tud|miento|mento|aje|ez|eza)$/.test(clean)||/^[A-ZÁÉÍÓÚÑ]/.test(raw))return {category:'Sustantivo',subtype:'Común o propio (según contexto)',lemma:clean,morphology:`Número ${clean.endsWith('s')?'plural':'singular'}; género no siempre deducible de la forma aislada.`,explanation:'Nombra seres, objetos, lugares, ideas o conceptos.'};
 return {category:'Sustantivo',subtype:'Posible sustantivo (clasificación orientativa)',lemma:clean,morphology:`Forma ${clean.endsWith('s')?'posiblemente plural':'posiblemente singular'}; género por confirmar en contexto.`,explanation:'Se propone como sustantivo por descarte. Conviene revisar la palabra dentro de su contexto.'};
}
function analyzeSentence(sentence){
 const tokens=sentence.match(/[¿¡]?[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)?|\d+(?:[.,]\d+)?|[^\s]/gu)||[];
 const words=tokens.map(t=>({token:t,info:classify(t)})).filter(x=>x.info);
 const verbIndex=words.findIndex(x=>x.info.category==='Verbo'&&!x.info.verb?.nonfinite);
 const subjectWords=verbIndex>0?words.slice(0,verbIndex):[];
 const subjectText=subjectWords.map(x=>x.token).join(' ');
 const predicateText=verbIndex>=0?words.slice(verbIndex).map(x=>x.token).join(' '):sentence;
 const subject=verbIndex>0?{text:subjectText,function:'Sujeto (propuesta orientativa)',nucleus:subjectWords.filter(x=>['Sustantivo','Pronombre'].includes(x.info.category)).map(x=>x.token).at(-1)||subjectWords.at(-1)?.token||'—',explanation:'Se propone como sujeto el grupo anterior al primer verbo personal. Comprueba la concordancia con el verbo, especialmente en oraciones con orden alterado.'}:{text:'No identificado con seguridad',function:'Sujeto no determinado',nucleus:'—',explanation:'El analizador gratuito no puede determinar con fiabilidad el sujeto en esta estructura. Puede ser elíptico, pospuesto o tratarse de una oración impersonal.'};
 const predicate={text:verbIndex>=0?predicateText:sentence,function:'Predicado (propuesta orientativa)',nucleus:verbIndex>=0?words[verbIndex].token:'No identificado',explanation:'Se toma como predicado el segmento que contiene el verbo personal y los elementos posteriores. La segmentación puede requerir revisión.'};
 const constituents=[]; if(subjectText)constituents.push({text:subjectText,function:'Sujeto (grupo propuesto)',explanation:'Grupo nominal situado antes del primer verbo personal; confirma la función mediante concordancia.'}); if(verbIndex>=0)constituents.push({text:words[verbIndex].token,function:'Núcleo verbal',explanation:'Verbo personal que organiza el predicado.'});
 const morph=words.map((x,i)=>{const inf=x.info;let fn='Parte de la oración';if(i===verbIndex)fn='Núcleo del predicado';else if(i<verbIndex&&verbIndex>0)fn=inf.category==='Sustantivo'||inf.category==='Pronombre'?'Posible núcleo del sujeto':'Dentro del sujeto (función por determinar)';else if(inf.category==='Preposición')fn='Enlace de un posible complemento';else if(inf.category==='Determinante')fn='Determinante de un grupo nominal';else if(inf.category==='Adverbio')fn='Complemento circunstancial o modificador (según contexto)';return {word:x.token,lemma:inf.lemma,category:inf.category,subtype:inf.subtype,morphology:inf.morphology,function:fn,explanation:inf.explanation};});
 return {text:sentence,type:'Oración; modalidad no determinada automáticamente',syntaxSummary:'Análisis orientativo por reglas gramaticales básicas. Revisa las funciones y relaciones en estructuras complejas.',subject,predicate,constituents,words:morph};
}
app.post('/api/analyze',(req,res)=>{
 const text=String(req.body?.text||'').trim();
 if(!text)return res.status(400).json({error:'Escribe o extrae un texto antes de analizarlo.'});
 if(text.length>12000)return res.status(413).json({error:'El texto supera el límite de 12.000 caracteres. Divide el contenido en varios análisis.'});
 const chunks=text.match(/[^.!?]+[.!?…]+|[^.!?]+$/gu)||[text];
 const sentences=chunks.map(s=>s.trim()).filter(Boolean).map(analyzeSentence);
 res.json({title:'Análisis gramatical gratuito',overview:'Análisis automático local mediante reglas y vocabulario básico. Es una ayuda didáctica orientativa, no sustituye la revisión de un profesor.',sentences,notes:['Motor gratuito sin inteligencia artificial de pago ni clave API.','La clasificación morfológica se basa en reglas y vocabulario limitado: algunas palabras ambiguas pueden estar mal clasificadas.','Las funciones sintácticas, el sujeto elíptico, las subordinadas y las oraciones complejas requieren revisión manual.']});
});
app.get('/api/health',(_req,res)=>res.json({ok:true,app:'ANALIZALAORACION',engine:'gratuito'}));
app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`ANALIZALAORACION disponible en http://localhost:${PORT}`));
