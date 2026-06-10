const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
const HEADERS = {
  'Accept': 'application/sparql-results+json',
  'User-Agent': 'MineralVault/1.0 (educational project)',
};

async function queryWikidata(sparql) {
  const url = WIKIDATA_SPARQL + '?query=' + encodeURIComponent(sparql) + '&format=json';
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) throw new Error(`Wikidata error: ${resp.status} ${await resp.text()}`);
  return (await resp.json()).results.bindings;
}

async function main() {
  console.log('Querying Wikidata...');
  const res = await queryWikidata(`
    SELECT ?item ?mindatId ?nameEs WHERE {
      ?item wdt:P6263 ?mindatId .
      ?item rdfs:label ?nameEs .
      FILTER(LANG(?nameEs) = "es")
    }
    LIMIT 100
  `);
  console.log('Got', res.length, 'results');
  for (let i = 0; i < Math.min(10, res.length); i++) {
    console.log(res[i]);
  }
}

main().catch(console.error);
