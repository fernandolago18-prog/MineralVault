'use client'

import React, { useState, useEffect } from 'react'

interface MiningLoaderProps {
  message?: string
  fullScreen?: boolean
  subtitle?: string
}

const DEFAULT_PHRASES = [
  'Picando en la roca madre...',
  'Descubriendo vetas de cristal...',
  'Extrayendo minerales de las profundidades...',
  'Inspeccionando hábitos cristalinos y dureza...',
  'Localizando ejemplares geológicos...',
  'Iluminando las galerías subterráneas...',
]

export default function MiningLoader({
  message,
  fullScreen = false,
  subtitle,
}: MiningLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    if (subtitle) return

    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % DEFAULT_PHRASES.length)
        setFade(true)
      }, 250)
    }, 2500)

    return () => clearInterval(interval)
  }, [subtitle])

  const currentPhrase = subtitle || DEFAULT_PHRASES[phraseIndex]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido..."
      className={`mining-loader-container ${fullScreen ? 'fullscreen' : 'embedded'}`}
    >
      <div className="mining-loader-card">
        {/* Glow atmosférico de la linterna de prospección en la caverna */}
        <div className="mining-lantern-glow" />

        {/* Escena fotorealista del minero, roca madre y pico con impacto físico */}
        <div className="mining-scene-wrapper">
          <svg
            className="mining-svg photorealistic-scene"
            viewBox="0 0 320 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Filtro de textura para superficie rugosa de piedra natural */}
              <filter id="rockGranite" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="noise" />
                <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.25 0" />
                <feComposite in2="SourceGraphic" in="gl" operator="in" />
              </filter>

              {/* Degradado para acero forjado al carbono (cabeza del pico) */}
              <linearGradient id="forgedSteel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="18%" stopColor="#94a3b8" />
                <stop offset="45%" stopColor="#475569" />
                <stop offset="75%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Bisel metálico y filo pulido del pico */}
              <linearGradient id="steelChiselBevel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#cbd5e1" />
                <stop offset="80%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Madera de nogal/fresno aceitada para el mango del pico */}
              <linearGradient id="hickoryWood" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="25%" stopColor="#92400e" />
                <stop offset="60%" stopColor="#d97706" />
                <stop offset="85%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#3d1502" />
              </linearGradient>

              {/* Cuero envejecido de la empuñadura */}
              <linearGradient id="leatherGrip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#291609" />
                <stop offset="50%" stopColor="#45230c" />
                <stop offset="100%" stopColor="#1f1006" />
              </linearGradient>

              {/* Roca madre: Basalto y granito volumétrico */}
              <linearGradient id="rockBase" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#33333d" />
                <stop offset="40%" stopColor="#22222a" />
                <stop offset="70%" stopColor="#18181f" />
                <stop offset="100%" stopColor="#0f0f14" />
              </linearGradient>

              {/* Luz rasante sobre las aristas de la roca */}
              <linearGradient id="rockFacetHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#636375" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3a3a48" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#16161c" stopOpacity="0" />
              </linearGradient>

              {/* Cristal de oro / pirita en la geoda */}
              <linearGradient id="goldVein" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="25%" stopColor="#fde047" />
                <stop offset="60%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>

              {/* Cristal de amatista */}
              <linearGradient id="amethystVein" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#faf5ff" />
                <stop offset="35%" stopColor="#c084fc" />
                <stop offset="75%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>

              {/* Cristal de esmeralda */}
              <linearGradient id="emeraldVein" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ecfdf5" />
                <stop offset="35%" stopColor="#34d399" />
                <stop offset="75%" stopColor="#059669" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>

              {/* Resplandor térmico de impacto en la grieta */}
              <radialGradient id="strikeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="25%" stopColor="#fef08a" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#eab308" stopOpacity="0.6" />
                <stop offset="80%" stopColor="#ca8a04" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#08080a" stopOpacity="0" />
              </radialGradient>

              {/* Niebla y polvo mineral subterráneo */}
              <radialGradient id="dustCloud" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#94a3b8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>

              {/* Brillo de linterna rasante */}
              <radialGradient id="lanternCone" cx="85%" cy="20%" r="75%">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.28" />
                <stop offset="40%" stopColor="#d97706" stopOpacity="0.12" />
                <stop offset="80%" stopColor="#78350f" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#08080a" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Haz de luz de la linterna de minero que baña la escena */}
            <rect x="0" y="0" width="320" height="220" fill="url(#lanternCone)" />

            {/* Partículas de polvo de caverna flotando en el aire */}
            <g className="cavern-motes">
              <circle cx="80" cy="50" r="1.2" fill="#fef08a" opacity="0.4" className="mote mote-1" />
              <circle cx="150" cy="40" r="0.9" fill="#e2e8f0" opacity="0.35" className="mote mote-2" />
              <circle cx="210" cy="90" r="1.5" fill="#fef08a" opacity="0.3" className="mote mote-3" />
              <circle cx="110" cy="110" r="0.8" fill="#e2e8f0" opacity="0.4" className="mote mote-4" />
              <circle cx="260" cy="40" r="1.1" fill="#fef08a" opacity="0.5" className="mote mote-5" />
            </g>

            {/* =======================================================
                BLOQUE GEOLÓGICO DE LA ROCA MADRE (OBJETIVO DEL IMPACTO)
                El pico golpea exactamente en la grieta en x: 130, y: 145
                ======================================================= */}
            <g className="mining-rock-mass">
              {/* Sombra de oclusión ambiental bajo la roca */}
              <ellipse cx="120" cy="205" rx="95" ry="14" fill="#050508" opacity="0.85" />

              {/* Masa base de la roca (estrato volcánico / granítico) */}
              <path
                d="M 35 200 
                   L 20 180 
                   L 25 150 
                   L 45 130 
                   L 75 120 
                   L 110 115 
                   L 130 145 
                   L 155 125 
                   L 185 135 
                   L 205 160 
                   L 215 195 
                   L 180 205 
                   L 110 208 Z"
                fill="url(#rockBase)"
                stroke="#2a2a36"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Facetas esculpidas y aristas de fractura natural de la piedra */}
              <polygon points="45,130 75,120 90,140 55,155" fill="url(#rockFacetHighlight)" />
              <polygon points="75,120 110,115 130,145 90,140" fill="#2d2d3a" opacity="0.9" />
              <polygon points="110,115 155,125 130,145" fill="#1b1b22" />
              <polygon points="155,125 185,135 170,165 130,145" fill="url(#rockFacetHighlight)" />
              <polygon points="185,135 205,160 175,185 170,165" fill="#262632" />
              <polygon points="55,155 90,140 100,185 45,185" fill="#181820" />
              <polygon points="90,140 130,145 140,195 100,185" fill="#14141a" />
              <polygon points="130,145 170,165 175,185 140,195" fill="#1e1e28" />

              {/* Aristas afiladas de la fractura */}
              <path
                d="M 45 130 L 90 140 L 130 145 L 170 165 L 205 160
                   M 75 120 L 90 140 L 100 185 L 110 208
                   M 155 125 L 130 145 L 140 195"
                stroke="#444455"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* =======================================================
                  LA GEODA Y VETA MINERAL EXPUESTA (DENTRO DE LA GRIETA)
                  ======================================================= */}
              <g className="mining-geode-vein">
                {/* Fondo oscuro del interior de la geoda */}
                <path
                  d="M 118 135 Q 130 140 142 136 Q 148 148 138 158 Q 124 160 116 148 Z"
                  fill="#09090d"
                />

                {/* Cristales de Oro Nativo / Pirita cúbica formándose en la veta */}
                <polygon points="122,142 127,135 132,139 127,146" fill="url(#goldVein)" />
                <polygon points="127,135 131,130 136,134 132,139" fill="#fef08a" />
                <polygon points="125,145 129,141 135,147 131,151" fill="url(#goldVein)" />

                {/* Cristales prismáticos de Amatista en las paredes de la grieta */}
                <polygon points="118,148 111,142 115,138 122,144" fill="url(#amethystVein)" />
                <polygon points="111,142 108,137 113,136 115,138" fill="#f3e8ff" />

                {/* Cristales de Esmeralda / Malaquita */}
                <polygon points="135,152 143,148 146,155 138,159" fill="url(#emeraldVein)" />
                <polygon points="143,148 147,144 150,149 146,155" fill="#a7f3d0" />

                {/* Líneas de fractura secundarias que laten con el impacto */}
                <path
                  className="fissure-crack-line"
                  d="M 130 145 L 115 158 L 102 165
                     M 130 145 L 140 162 L 150 178
                     M 130 145 L 126 132 L 118 126"
                  stroke="#fbbf24"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Resplandor interno de la veta que se aviva con el golpe */}
              <circle
                cx="130"
                cy="145"
                r="35"
                fill="url(#strikeGlow)"
                className="fissure-internal-glow"
              />
            </g>

            {/* =======================================================
                NUBE DE POLVO Y ESQUIRLAS DE IMPACTO (EN X: 130, Y: 145)
                ======================================================= */}
            {/* Polvo mineral fino generado por el impacto */}
            <ellipse
              cx="130"
              cy="145"
              rx="24"
              ry="16"
              fill="url(#dustCloud)"
              className="impact-dust-cloud"
            />

            {/* Destello blanco incandescente de contacto acero-roca */}
            <circle
              cx="130"
              cy="145"
              r="18"
              fill="url(#strikeGlow)"
              className="steel-impact-flash"
            />

            {/* Esquirlas de roca y trozos de mineral que salen disparados */}
            <g className="impact-debris-burst">
              {/* Esquirla de roca 1 (hacia arriba izquierda con parábola) */}
              <polygon points="130,145 125,142 127,148" fill="#64748b" className="debris chunk-1" />
              {/* Esquirla de oro 2 (hacia arriba derecho) */}
              <polygon points="130,145 134,141 136,146" fill="#fde047" className="debris chunk-2" />
              {/* Esquirla de cristal 3 (hacia arriba vertical) */}
              <polygon points="130,145 131,139 128,141" fill="#c084fc" className="debris chunk-3" />
              {/* Esquirla de roca 4 (hacia izquierda) */}
              <polygon points="130,145 122,147 124,151" fill="#475569" className="debris chunk-4" />
              {/* Esquirla de oro 5 (hacia abajo y rebote) */}
              <polygon points="130,145 136,149 138,145" fill="#facc15" className="debris chunk-5" />
              {/* Esquirla de cuarzo 6 */}
              <polygon points="130,145 133,138 135,142" fill="#ffffff" className="debris chunk-6" />
            </g>

            {/* Chispas incandescentes de alta velocidad */}
            <g className="impact-sparks-burst">
              <line x1="130" y1="145" x2="110" y2="120" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" className="spark spark-1" />
              <line x1="130" y1="145" x2="135" y2="105" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" className="spark spark-2" />
              <line x1="130" y1="145" x2="155" y2="118" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" className="spark spark-3" />
              <line x1="130" y1="145" x2="98" y2="138" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" className="spark spark-4" />
              <line x1="130" y1="145" x2="160" y2="140" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" className="spark spark-5" />
            </g>

            {/* =======================================================
                EL PICO DE MINERO (CINEMÁTICA Y CONTACTO FÍSICO REAL)
                Punto de rotación en x: 240, y: 55 (manos del minero)
                En rotación 0deg, la punta de cincel está exactamente en (130, 145)
                ======================================================= */}
            <g className="photorealistic-pickaxe-pivot">
              {/* Sombra proyectada del pico en la pared de la cueva */}
              <g opacity="0.4" transform="translate(10, 12)">
                <path
                  d="M 240 55 L 140 135 Q 120 148 105 140"
                  stroke="#050508"
                  strokeWidth="10"
                  strokeLinecap="round"
                  filter="blur(4px)"
                />
              </g>

              {/* Mango de madera de fresno/hickory con veta curva ergonómica */}
              <path
                d="M 245 50 
                   Q 200 90 148 135
                   L 142 128
                   Q 195 82 238 43 Z"
                fill="url(#hickoryWood)"
                stroke="#291204"
                strokeWidth="1"
              />

              {/* Brillo especular longitudinal a lo largo del mango de madera */}
              <path
                d="M 242 47 Q 198 86 145 131"
                stroke="#fed7aa"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.35"
              />

              {/* Envoltura de cuero antideslizante en la zona de agarre */}
              <path
                d="M 247 48 L 225 66 L 218 58 L 240 40 Z"
                fill="url(#leatherGrip)"
                stroke="#1c0b02"
                strokeWidth="0.8"
              />
              <line x1="228" y1="62" x2="238" y2="44" stroke="#78350f" strokeWidth="1" />
              <line x1="233" y1="58" x2="243" y2="40" stroke="#78350f" strokeWidth="1" />

              {/* Remate metálico / culata de acero al final del mango */}
              <polygon points="248,46 254,41 249,36 243,41" fill="url(#forgedSteel)" stroke="#0f172a" strokeWidth="0.8" />

              {/* CASQUILLO Y OJO DE FIJACIÓN DEL PICO (Unión cabeza-mango) */}
              <g transform="translate(145, 131) rotate(42)">
                {/* Cuña de acero y anillo de refuerzo de bronce */}
                <rect x="-8" y="-6" width="16" height="12" rx="2" fill="#b45309" stroke="#451a03" strokeWidth="0.8" />
                <rect x="-6" y="-4" width="12" height="8" rx="1.5" fill="url(#forgedSteel)" stroke="#1e293b" strokeWidth="0.8" />
                {/* Ojo central del mango */}
                <circle cx="0" cy="0" r="2.5" fill="#0f172a" />
              </g>

              {/* CABEZA DE ACERO FORJADO AL CARBONO DEL PICO */}
              {/* Curva de arco minero: Hoja trasera (maza) y Hoja delantera (punta de cincel) */}
              {/* La punta afilada delantera finaliza EXACTAMENTE en (130, 145) */}
              <path
                d="M 172 108 
                   Q 156 122 145 131 
                   Q 138 138 130 145 
                   Q 135 140 144 127 
                   Q 154 115 167 101 Z"
                fill="url(#forgedSteel)"
                stroke="#0f172a"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* Bisel superior del filo que capta la luz reflejada de la linterna */}
              <path
                d="M 172 108 Q 155 123 130 145"
                stroke="url(#steelChiselBevel)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Hoja trasera de maza / piocha cuadrada */}
              <path
                d="M 148 133
                   Q 160 142 178 152
                   L 175 158
                   Q 156 147 142 136 Z"
                fill="url(#forgedSteel)"
                stroke="#0f172a"
                strokeWidth="1"
              />
              <line x1="178" y1="152" x2="175" y2="158" stroke="#cbd5e1" strokeWidth="1.4" />

              {/* Punta de diamante endurecida en la punta de penetración (130, 145) */}
              <polygon
                points="130,145 134,142 133,146"
                fill="#ffffff"
                stroke="#94a3b8"
                strokeWidth="0.5"
              />
            </g>
          </svg>
        </div>

        {/* Título, frases del explorador y barra de progreso */}
        <div className="mining-loader-text-area">
          <div className="mining-loader-title">
            <span className="mining-gem-symbol">◆</span>
            <span>{message || 'MINERALES DE LA TIERRA'}</span>
            <span className="mining-gem-symbol">◆</span>
          </div>

          <div
            className={`mining-loader-phrase ${fade ? 'phrase-visible' : 'phrase-hidden'}`}
          >
            {currentPhrase}
          </div>

          {/* Barra de veta dorada */}
          <div className="mining-progress-track">
            <div className="mining-progress-shimmer" />
          </div>

          <div className="mining-loader-hint">
            Arqueología &amp; Mineralogía Científica
          </div>
        </div>
      </div>
    </div>
  )
}
