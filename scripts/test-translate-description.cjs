// Usar native fetch disponible globalmente en Node 18+

async function translateText(text) {
  if (!text) return '';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
  
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`);
    const json = await resp.json();
    
    // El formato devuelto por translate_a/single es un array complejo.
    // Los fragmentos traducidos están en json[0] como arrays [texto_traducido, texto_original, ...]
    if (json && json[0]) {
      return json[0].map(s => s[0]).join('');
    }
    return '';
  } catch (err) {
    console.error('Translation error:', err);
    return '';
  }
}

async function main() {
  const sampleText = "Quartz is a hard, crystalline mineral composed of silicon and oxygen atoms. The atoms are linked in a continuous framework of SiO4 silicon–oxygen tetrahedra, with each oxygen being shared between two tetrahedra, giving an overall chemical formula of SiO2.";
  console.log('Original Text:\n', sampleText);
  
  console.log('\nTranslating...');
  const esText = await translateText(sampleText);
  console.log('\nTranslated Text:\n', esText);
}

main().catch(console.error);
