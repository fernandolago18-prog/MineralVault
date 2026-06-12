function getStreakColors(streak) {
  if (!streak) return [];
  const clean = streak.toLowerCase().trim();
  const colors = [];

  const colorMap = [
    { keys: ['incolor', 'colourless', 'colorless', 'blanc', 'white'], hex: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)' },
    { keys: ['amarillo latón', 'brass'], hex: '#d4af37' },
    { keys: ['amarillo-oro', 'gold', 'oro'], hex: '#ffd700' },
    { keys: ['marrón rojiz', 'marrón rojoc', 'reddish brown'], hex: '#a0522d' },
    { keys: ['marrón oscur', 'dark brown'], hex: '#4a2f13' },
    { keys: ['rojo cobre', 'copper'], hex: '#b87333' },
    { keys: ['roja', 'rojo', 'red'], hex: '#c0392b' },
    { keys: ['marrón', 'brown'], hex: '#8b5a2b' },
    { keys: ['amarill', 'yellow'], hex: '#f1c40f' },
    { keys: ['gris plomo', 'lead'], hex: '#555d65', border: '1px solid rgba(255, 255, 255, 0.2)' },
    { keys: ['gris', 'grey', 'gray'], hex: '#8e8e93' },
    { keys: ['negra', 'negro', 'black'], hex: '#111111', border: '1px solid rgba(255, 255, 255, 0.3)' },
    { keys: ['verde claro', 'light green'], hex: '#a3e4d7' },
    { keys: ['verde oscur', 'dark green'], hex: '#196f3d' },
    { keys: ['verde pálid', 'pale green'], hex: '#abebc6' },
    { keys: ['verde', 'green'], hex: '#2ecc71' },
    { keys: ['azul', 'blue'], hex: '#3498db' },
    { keys: ['naranja', 'orange'], hex: '#e67e22' },
  ];

  let remainingText = clean;
  for (const item of colorMap) {
    for (const key of item.keys) {
      if (remainingText.includes(key)) {
        colors.push({ hex: item.hex, border: item.border });
        remainingText = remainingText.replace(new RegExp(key, 'g'), '');
        break;
      }
    }
  }

  return colors;
}

console.log('blanca a gris:', getStreakColors('blanca a gris'));
console.log('verde claro y azul oscuro:', getStreakColors('verde claro y azul oscuro'));
console.log('marrón rojizo o roja:', getStreakColors('marrón rojizo o roja'));
