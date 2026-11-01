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
  'Localizando ejemplares geológicos...',
  'Extrayendo minerales de las profundidades...',
  'Inspeccionando hábitos cristalinos...',
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
    }, 2400)

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
        {/* Glow de fondo de la linterna del minero */}
        <div className="mining-lantern-glow" />

        {/* SVG Animado del Minero / Pico y Geoda de Cristales */}
        <div className="mining-scene-wrapper">
          <svg
            className="mining-svg"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Degradado para el pico de acero pulido */}
              <linearGradient id="pickMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e5e7eb" />
                <stop offset="50%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#4b5563" />
              </linearGradient>

              {/* Degradado para el mango de madera tratada */}
              <linearGradient id="pickHandle" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              {/* Cristales: Oro y Ámbar */}
              <linearGradient id="crystalGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>

              {/* Cristales: Esmeralda */}
              <linearGradient id="crystalEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>

              {/* Cristales: Amatista */}
              <linearGradient id="crystalAmethyst" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>

              {/* Resplandor radial de la veta */}
              <radialGradient id="rockAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c5a059" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#2d8a67" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#08080a" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Aura de la roca mineral */}
            <circle cx="100" cy="135" r="55" fill="url(#rockAura)" className="mining-pulse-aura" />

            {/* Anillos de prospección / Brújula geológica */}
            <circle
              cx="100"
              cy="110"
              r="76"
              stroke="#c5a059"
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.3"
              className="mining-radar-ring"
            />
            <circle
              cx="100"
              cy="110"
              r="86"
              stroke="#2d8a67"
              strokeWidth="0.75"
              strokeDasharray="2 12"
              opacity="0.25"
              className="mining-radar-ring-reverse"
            />

            {/* Marcadores de rumbo en el anillo */}
            <circle cx="100" cy="24" r="2.5" fill="#c5a059" opacity="0.6" />
            <circle cx="100" cy="196" r="2.5" fill="#c5a059" opacity="0.6" />
            <circle cx="14" cy="110" r="2.5" fill="#c5a059" opacity="0.6" />
            <circle cx="186" cy="110" r="2.5" fill="#c5a059" opacity="0.6" />

            {/* Roca madre (Bedrock) */}
            <path
              d="M40 165 L60 145 L85 152 L115 142 L145 150 L165 165 L155 178 L45 178 Z"
              fill="#181820"
              stroke="#262632"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M55 165 L75 153 L100 158 L125 149 L150 162"
              stroke="#343444"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Formación de cristales en la geoda */}
            <g className="mining-crystal-cluster">
              {/* Cristal Izquierdo: Amatista */}
              <polygon
                points="70,150 78,124 88,128 84,152 74,154"
                fill="url(#crystalAmethyst)"
                opacity="0.9"
              />
              <polygon
                points="78,124 88,128 85,138 75,136"
                fill="#f3e8ff"
                opacity="0.6"
              />

              {/* Cristal Derecho: Esmeralda */}
              <polygon
                points="118,150 126,120 138,126 132,152 122,153"
                fill="url(#crystalEmerald)"
                opacity="0.9"
              />
              <polygon
                points="126,120 138,126 134,136 124,132"
                fill="#d1fae5"
                opacity="0.6"
              />

              {/* Cristal Central Principal: Oro nativo / Pirita brillante */}
              <polygon
                points="92,152 98,102 110,106 108,153"
                fill="url(#crystalGold)"
              />
              <polygon
                points="98,102 104,92 110,106 104,112"
                fill="#fef9c3"
                opacity="0.9"
              />
              <polygon
                points="98,102 104,92 92,110 94,124"
                fill="#facc15"
                opacity="0.75"
              />

              {/* Cristales menores de acompañamiento */}
              <polygon
                points="60,158 64,142 70,145 68,160"
                fill="url(#crystalGold)"
                opacity="0.7"
              />
              <polygon
                points="136,155 142,138 148,142 144,158"
                fill="url(#crystalAmethyst)"
                opacity="0.75"
              />
            </g>

            {/* Destello central del cristal cuando impacta el pico */}
            <circle
              cx="104"
              cy="98"
              r="14"
              fill="#fff"
              className="mining-impact-flash"
            />

            {/* Chispas y esquirlas de minerales que saltan con el golpe */}
            <g className="mining-sparks-group">
              {/* Chispa 1: Arriba-Izquierda */}
              <path
                d="M102 92 Q88 72 82 68"
                stroke="#fef08a"
                strokeWidth="2"
                strokeLinecap="round"
                className="mining-spark spark-1"
              />
              <polygon
                points="80,68 84,65 83,70"
                fill="#fde047"
                className="mining-spark spark-1"
              />

              {/* Chispa 2: Arriba central (Diamante/Estrella) */}
              <path
                d="M104 88 L104 64"
                stroke="#6ee7b7"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="mining-spark spark-2"
              />
              <polygon
                points="104,60 106,64 104,68 102,64"
                fill="#a7f3d0"
                className="mining-spark spark-2"
              />

              {/* Chispa 3: Arriba-Derecha */}
              <path
                d="M108 94 Q122 76 132 70"
                stroke="#fef08a"
                strokeWidth="2"
                strokeLinecap="round"
                className="mining-spark spark-3"
              />
              <polygon
                points="132,70 136,73 131,75"
                fill="#fde047"
                className="mining-spark spark-3"
              />

              {/* Chispa 4: Lateral Izquierda (Púrpura) */}
              <circle
                cx="74"
                cy="88"
                r="2.5"
                fill="#d8b4fe"
                className="mining-spark spark-4"
              />

              {/* Chispa 5: Lateral Derecha (Oro) */}
              <circle
                cx="138"
                cy="92"
                r="3"
                fill="#fef08a"
                className="mining-spark spark-5"
              />
            </g>

            {/* PICO DE MINERO ANIMADO */}
            {/* El grupo rota sobre el punto de sujeción para simular el golpe */}
            <g className="mining-pickaxe-arm">
              {/* Mango del pico (madera de fresno con remate) */}
              <rect
                x="132"
                y="30"
                width="7"
                height="80"
                rx="3.5"
                transform="rotate(38 132 30)"
                fill="url(#pickHandle)"
                stroke="#451a03"
                strokeWidth="1"
              />

              {/* Refuerzo / anillo de unión de bronce */}
              <rect
                x="131"
                y="35"
                width="9"
                height="10"
                rx="1.5"
                transform="rotate(38 131 35)"
                fill="#c5a059"
                stroke="#78350f"
                strokeWidth="0.75"
              />

              {/* Cabeza metálica del pico de doble punta */}
              {/* Curva arqueada de minería clásica */}
              <path
                d="M102 36 Q135 48 168 84 Q148 64 120 48 Q110 42 102 36 Z"
                fill="url(#pickMetal)"
                stroke="#1f2937"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* Punta afilada frontal reforzada */}
              <polygon
                points="102,36 109,38 107,43 100,38"
                fill="#f9fafb"
              />

              {/* Ojo del pico (fijación al mango) */}
              <circle
                cx="136"
                cy="52"
                r="4.5"
                fill="#374151"
                stroke="#c5a059"
                strokeWidth="1"
              />
            </g>

            {/* Linterna de minero en el suelo (Candil de carburo) */}
            <g transform="translate(42, 148) scale(0.7)">
              <rect x="0" y="8" width="16" height="20" rx="3" fill="#3f3f46" stroke="#c5a059" strokeWidth="1" />
              {/* Cristal del candil encendido */}
              <rect x="3" y="11" width="10" height="13" rx="1.5" fill="#fef08a" opacity="0.85" className="mining-lantern-flicker" />
              {/* Asa de transporte */}
              <path d="M2 8 C2 -2 14 -2 14 8" fill="none" stroke="#a1a1aa" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* Títulos y textos dinámicos del buscador de minerales */}
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

          {/* Barra de progreso de veta de oro */}
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
