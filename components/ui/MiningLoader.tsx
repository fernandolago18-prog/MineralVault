'use client'

import React, { useState, useEffect } from 'react'

interface MiningLoaderProps {
  message?: string
  subtitle?: string
  fullScreen?: boolean
  showDepth?: boolean
}

const DEFAULT_PHRASES = [
  'Izando jaula desde la caña del Pozo Maestro...',
  'Vagoneta cargada con galena argentífera y pirita...',
  'Girando poleas de extracción en el castillete...',
  'Ascendiendo por las guiaderas hacia la superficie...',
  'Llegando a la plaza de desembarque con mineral...',
  'Explorando el patrimonio geológico de La Unión...',
]

export default function MiningLoader({
  message,
  subtitle,
  fullScreen = false,
  showDepth = true,
}: MiningLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const [depth, setDepth] = useState(-180)

  // Rotación suave de frases mineras
  useEffect(() => {
    if (subtitle) return

    const phraseInterval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % DEFAULT_PHRASES.length)
        setFade(true)
      }, 250)
    }, 2800)

    return () => clearInterval(phraseInterval)
  }, [subtitle])

  // Simulación sincronizada en tiempo real de la profundidad del pozo
  // Coincide exactamente con el ciclo de 5.2s de la animación del castillete
  useEffect(() => {
    if (!showDepth) return

    const cycleDuration = 5200 // 5.2 segundos por ciclo de izado
    const startTime = Date.now()

    const depthInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % cycleDuration
      const progress = elapsed / cycleDuration

      if (progress < 0.08) {
        // En el fondo del pozo preparando la marcha
        setDepth(-180)
      } else if (progress < 0.68) {
        // Ascenso continuo a régimen constante
        const ascentRatio = (progress - 0.08) / 0.6
        setDepth(Math.round(-180 + ascentRatio * 180))
      } else {
        // En superficie / desembarque de mineral
        setDepth(0)
      }
    }, 75)

    return () => clearInterval(depthInterval)
  }, [showDepth])

  const currentPhrase = subtitle || DEFAULT_PHRASES[phraseIndex]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido..."
      className={`mining-loader-container ${fullScreen ? 'fullscreen' : 'embedded'}`}
    >
      <div className="mining-loader-card">
        {/* Glow cálido ambiental del castillete minero */}
        <div className="mining-lantern-glow" />

        {/* ============================================================
            ESCENA DEL CASTILLETE MINERO DE LA UNIÓN (REGIÓN DE MURCIA)
            Estructura de celosía de hierro remachado, tornapuntas,
            poleas gemelas de extracción y jaula ascendente con mineral
            ============================================================ */}
        <div className="mining-scene-wrapper">
          <svg
            className="mining-svg photorealistic-scene"
            viewBox="0 0 380 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Cielo nocturno crepuscular de la Sierra Minera */}
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#090a10" />
                <stop offset="45%" stopColor="#131019" />
                <stop offset="78%" stopColor="#22131b" />
                <stop offset="100%" stopColor="#30171c" />
              </linearGradient>

              {/* Silueta lejana de cabezos mineros (Cabezo Rajao) */}
              <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#201521" />
                <stop offset="100%" stopColor="#0c0910" />
              </linearGradient>

              {/* Acero forjado y celosía con pátina de óxido férrico característico */}
              <linearGradient id="ironLattice" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2c2d36" />
                <stop offset="25%" stopColor="#464956" />
                <stop offset="60%" stopColor="#5d6272" />
                <stop offset="85%" stopColor="#363844" />
                <stop offset="100%" stopColor="#1e1f26" />
              </linearGradient>

              {/* Tornapuntas posteriores en sombra volumétrica */}
              <linearGradient id="backstayIron" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#252630" />
                <stop offset="50%" stopColor="#363844" />
                <stop offset="100%" stopColor="#15161c" />
              </linearGradient>

              {/* Poleas de fundición con llanta de garganta pulida por el cable */}
              <linearGradient id="sheaveRim" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="35%" stopColor="#475569" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>

              {/* Cable de acero trenzado bajo tensión de tiro */}
              <linearGradient id="cableSteel" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="45%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Mampostería del brocal en piedra caliza y ladrillo viejo */}
              <linearGradient id="stoneCollar" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#483f3a" />
                <stop offset="40%" stopColor="#312a27" />
                <stop offset="100%" stopColor="#181413" />
              </linearGradient>

              {/* Abismo profundo y oscuro de la caña del pozo */}
              <radialGradient id="shaftAbyss" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#121217" />
                <stop offset="45%" stopColor="#09090c" />
                <stop offset="100%" stopColor="#020203" />
              </radialGradient>

              {/* Haz descendente del foco industrial sobre la viga */}
              <linearGradient id="spotlightBeam" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.25" />
                <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.12" />
                <stop offset="65%" stopColor="#d97706" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </linearGradient>

              {/* Llama incandescente y destello de reflector */}
              <radialGradient id="lampBulbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#fef08a" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
              </radialGradient>

              {/* Galena argentífera brillante de La Unión (Plata y Plomo) */}
              <linearGradient id="oreGalena" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#cbd5e1" />
                <stop offset="60%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Pirita dorada ("Oro de los tontos") */}
              <linearGradient id="orePyrite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="30%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>

              {/* Blenda acaramelada (Esfalerita resinosa de La Unión) */}
              <linearGradient id="oreSphalerite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="35%" stopColor="#f97316" />
                <stop offset="75%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#431407" />
              </linearGradient>

              {/* Chapa de acero remachada de la vagoneta Decauville */}
              <linearGradient id="wagonSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3a4150" />
                <stop offset="50%" stopColor="#242832" />
                <stop offset="100%" stopColor="#16181f" />
              </linearGradient>

              {/* Guardacabezas / Visera curva de chapa de la jaula */}
              <linearGradient id="cageBonnet" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* 1. Fondo atmosférico de la Sierra Minera */}
            <rect x="0" y="0" width="380" height="340" fill="url(#skyGrad)" rx="8" />

            {/* Silueta ondulada de los cabezos mineros al atardecer */}
            <path
              d="M 0 250 
                 Q 45 220 90 230 
                 T 190 225 
                 Q 250 200 310 220 
                 T 380 235 
                 L 380 280 
                 L 0 280 Z"
              fill="url(#mountainGrad)"
              opacity="0.85"
            />

            {/* Chimenea histórica de fundición minera en el horizonte */}
            <polygon points="325,225 329,195 333,195 337,225" fill="#18131d" opacity="0.9" />

            {/* 2. Boca del pozo, brocal de mampostería y suelo */}
            <rect x="0" y="270" width="380" height="70" fill="#0d0e12" />
            <line x1="0" y1="270" x2="380" y2="270" stroke="#282427" strokeWidth="1.5" />

            {/* Zapatas de cimentación de hormigón del castillete */}
            <polygon points="42,272 78,272 74,260 46,260" fill="#2d3038" stroke="#1c1d22" strokeWidth="1" />
            <polygon points="152,272 176,272 174,264 154,264" fill="#2d3038" stroke="#1c1d22" strokeWidth="1" />
            <polygon points="248,272 272,272 270,264 250,264" fill="#2d3038" stroke="#1c1d22" strokeWidth="1" />

            {/* Caña del pozo: abertura oscura que desciende al abismo */}
            <ellipse cx="212" cy="272" rx="42" ry="12" fill="#050508" />
            <path
              d="M 170 272 
                 L 172 340 
                 L 252 340 
                 L 254 272 
                 Z"
              fill="url(#shaftAbyss)"
            />

            {/* Cuadros de madera de entibación en el pozo */}
            <line x1="171" y1="288" x2="253" y2="288" stroke="#1a1412" strokeWidth="2.5" />
            <line x1="171" y1="308" x2="253" y2="308" stroke="#15100e" strokeWidth="2.5" />
            <line x1="172" y1="328" x2="252" y2="328" stroke="#100c0a" strokeWidth="2.5" />

            {/* Muro del brocal frontal (piedra y ladrillo de La Unión) */}
            <path
              d="M 166 268 
                 L 166 280 
                 Q 212 286 258 280 
                 L 258 268 
                 Q 212 274 166 268 Z"
              fill="url(#stoneCollar)"
              stroke="#1a1614"
              strokeWidth="1.2"
            />
            <path d="M 166 268 Q 212 274 258 268" stroke="#5a504a" strokeWidth="1.5" fill="none" />
            <line x1="195" y1="270" x2="195" y2="283" stroke="#231d1b" strokeWidth="1" />
            <line x1="228" y1="271" x2="228" y2="284" stroke="#231d1b" strokeWidth="1" />

            {/* Barandillas de protección y compuertas de desembarque */}
            <line x1="154" y1="250" x2="168" y2="250" stroke="#484b56" strokeWidth="1.8" />
            <line x1="154" y1="260" x2="168" y2="260" stroke="#484b56" strokeWidth="1.8" />
            <line x1="156" y1="250" x2="156" y2="270" stroke="#484b56" strokeWidth="2" />
            <line x1="168" y1="248" x2="168" y2="270" stroke="#484b56" strokeWidth="2" />

            <line x1="256" y1="250" x2="270" y2="250" stroke="#484b56" strokeWidth="1.8" />
            <line x1="256" y1="260" x2="270" y2="260" stroke="#484b56" strokeWidth="1.8" />
            <line x1="256" y1="248" x2="256" y2="270" stroke="#484b56" strokeWidth="2" />
            <line x1="268" y1="250" x2="268" y2="270" stroke="#484b56" strokeWidth="2" />

            {/* Guiaderas verticales del pozo por donde corre la jaula */}
            <line x1="192" y1="65" x2="192" y2="340" stroke="#2e313c" strokeWidth="2.5" strokeDasharray="12 2" />
            <line x1="232" y1="65" x2="232" y2="340" stroke="#2e313c" strokeWidth="2.5" strokeDasharray="12 2" />

            {/* 3. Tornapuntas posteriores en celosía metálica (inclinados a la izquierda) */}
            <g id="tornapuntas" opacity="0.95">
              <line x1="60" y1="262" x2="188" y2="68" stroke="url(#backstayIron)" strokeWidth="6" strokeLinecap="round" />
              <line x1="68" y1="264" x2="196" y2="68" stroke="url(#backstayIron)" strokeWidth="5" strokeLinecap="round" />

              {/* Celosía en zigzag de los tornapuntas */}
              <line x1="72" y1="246" x2="88" y2="242" stroke="#454958" strokeWidth="1.5" />
              <line x1="72" y1="246" x2="98" y2="216" stroke="#3b3e4a" strokeWidth="1.2" />
              <line x1="88" y1="242" x2="84" y2="224" stroke="#3b3e4a" strokeWidth="1.2" />

              <line x1="94" y1="210" x2="114" y2="204" stroke="#454958" strokeWidth="1.5" />
              <line x1="94" y1="210" x2="128" y2="174" stroke="#3b3e4a" strokeWidth="1.2" />
              <line x1="114" y1="204" x2="108" y2="182" stroke="#3b3e4a" strokeWidth="1.2" />

              <line x1="126" y1="164" x2="148" y2="156" stroke="#454958" strokeWidth="1.5" />
              <line x1="126" y1="164" x2="164" y2="122" stroke="#3b3e4a" strokeWidth="1.2" />
              <line x1="148" y1="156" x2="142" y2="134" stroke="#3b3e4a" strokeWidth="1.2" />

              <line x1="162" y1="114" x2="182" y2="106" stroke="#454958" strokeWidth="1.5" />
              <line x1="162" y1="114" x2="190" y2="76" stroke="#3b3e4a" strokeWidth="1.2" />

              <line x1="110" y1="184" x2="173" y2="184" stroke="url(#backstayIron)" strokeWidth="3" />
              <line x1="140" y1="135" x2="178" y2="135" stroke="url(#backstayIron)" strokeWidth="3" />
            </g>

            {/* 4. Torre vertical del castillete (Pies derechos y cruces de San Andrés) */}
            <g id="torre-castillete">
              <line x1="185" y1="64" x2="164" y2="264" stroke="url(#ironLattice)" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="239" y1="64" x2="260" y2="264" stroke="url(#ironLattice)" strokeWidth="5.5" strokeLinecap="round" />

              <line x1="187" y1="64" x2="167" y2="264" stroke="#5d6272" strokeWidth="1.2" />
              <line x1="237" y1="64" x2="257" y2="264" stroke="#5d6272" strokeWidth="1.2" />

              {/* Travesaños horizontales de unión */}
              <line x1="182" y1="65" x2="242" y2="65" stroke="url(#ironLattice)" strokeWidth="4.5" />
              <line x1="179" y1="110" x2="245" y2="110" stroke="url(#ironLattice)" strokeWidth="4" />
              <line x1="174" y1="160" x2="250" y2="160" stroke="url(#ironLattice)" strokeWidth="4.5" />
              <line x1="169" y1="215" x2="255" y2="215" stroke="url(#ironLattice)" strokeWidth="4.5" />

              {/* Cruces de San Andrés (aspa característica) */}
              <line x1="185" y1="66" x2="244" y2="109" stroke="#3b3e4c" strokeWidth="2" />
              <line x1="239" y1="66" x2="180" y2="109" stroke="#3b3e4c" strokeWidth="2" />
              <circle cx="212" cy="87.5" r="2.2" fill="#6d7285" stroke="#1d1e25" strokeWidth="0.8" />

              <line x1="180" y1="111" x2="249" y2="159" stroke="#3b3e4c" strokeWidth="2.2" />
              <line x1="244" y1="111" x2="175" y2="159" stroke="#3b3e4c" strokeWidth="2.2" />
              <circle cx="212" cy="135" r="2.4" fill="#6d7285" stroke="#1d1e25" strokeWidth="0.8" />

              <line x1="175" y1="161" x2="254" y2="214" stroke="#3b3e4c" strokeWidth="2.4" />
              <line x1="249" y1="161" x2="170" y2="214" stroke="#3b3e4c" strokeWidth="2.4" />
              <circle cx="212" cy="187.5" r="2.6" fill="#6d7285" stroke="#1d1e25" strokeWidth="0.8" />

              <line x1="170" y1="216" x2="188" y2="263" stroke="#3b3e4c" strokeWidth="2.5" />
              <line x1="254" y1="216" x2="236" y2="263" stroke="#3b3e4c" strokeWidth="2.5" />

              {/* Cartelas y remaches de forja */}
              <polygon points="180,63 192,63 186,77 180,72" fill="#464956" />
              <circle cx="184" cy="67" r="1.2" fill="#cbd5e1" />
              <polygon points="244,63 232,63 238,77 244,72" fill="#464956" />
              <circle cx="240" cy="67" r="1.2" fill="#cbd5e1" />

              <polygon points="175,157 186,157 182,169 174,166" fill="#464956" />
              <circle cx="178" cy="162" r="1.4" fill="#cbd5e1" />
              <polygon points="249,157 238,157 242,169 250,166" fill="#464956" />
              <circle cx="246" cy="162" r="1.4" fill="#cbd5e1" />
            </g>

            {/* 5. Plataforma de servicio y poleas de extracción (Sheaves) */}
            <line x1="176" y1="58" x2="248" y2="58" stroke="#3e414f" strokeWidth="2" />
            <line x1="178" y1="50" x2="246" y2="50" stroke="#4f5364" strokeWidth="1.2" />
            <polygon points="196,58 204,58 202,46 198,46" fill="#1f2028" stroke="#5a5e6d" strokeWidth="1" />
            <polygon points="205,55 213,55 211,43 207,43" fill="#1a1b22" stroke="#444754" strokeWidth="1" />

            {/* Cable inclinado desde la sala de máquinas */}
            <line x1="20" y1="165" x2="200" y2="30" stroke="url(#cableSteel)" strokeWidth="2.6" strokeLinecap="round" />
            <line x1="28" y1="170" x2="209" y2="25" stroke="#64748b" strokeWidth="1.8" opacity="0.7" />

            {/* Polea trasera en perspectiva */}
            <g className="sheave-wheel-rear" opacity="0.6">
              <circle cx="209" cy="47" r="21" fill="none" stroke="url(#sheaveRim)" strokeWidth="3" />
              <line x1="209" y1="26" x2="209" y2="68" stroke="#606476" strokeWidth="1.4" />
              <line x1="188" y1="47" x2="230" y2="47" stroke="#606476" strokeWidth="1.4" />
              <line x1="194" y1="32" x2="224" y2="62" stroke="#606476" strokeWidth="1.2" />
              <line x1="194" y1="62" x2="224" y2="32" stroke="#606476" strokeWidth="1.2" />
              <circle cx="209" cy="47" r="4.5" fill="#1b1c24" stroke="#494d5d" strokeWidth="1.2" />
            </g>

            {/* Polea delantera principal conectada al cable de izado */}
            <g className="sheave-wheel-front">
              <circle cx="200" cy="52" r="22" fill="none" stroke="url(#sheaveRim)" strokeWidth="3.5" />
              <circle cx="200" cy="52" r="19" fill="#0d0e14" stroke="#454958" strokeWidth="1.2" />
              <path d="M 183 40 A 22 22 0 0 1 218 40" stroke="#f1f5f9" strokeWidth="1" fill="none" opacity="0.6" />

              {/* 8 radios dobles de fundición */}
              <line x1="200" y1="30" x2="200" y2="74" stroke="#7e8498" strokeWidth="1.6" />
              <line x1="178" y1="52" x2="222" y2="52" stroke="#7e8498" strokeWidth="1.6" />
              <line x1="184" y1="36" x2="216" y2="68" stroke="#666b7c" strokeWidth="1.4" />
              <line x1="184" y1="68" x2="216" y2="36" stroke="#666b7c" strokeWidth="1.4" />

              <circle cx="200" cy="52" r="6" fill="#292b36" stroke="#8e94a8" strokeWidth="1.5" />
              <circle cx="200" cy="52" r="2.5" fill="#f8fafc" />
            </g>

            {/* 6. Cable vertical de acero acoplado a la jaula */}
            <g className="vertical-hoist-cable cable-vibration">
              <line
                x1="222"
                y1="52"
                x2="222"
                y2="280"
                stroke="url(#cableSteel)"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <line
                x1="221.3"
                y1="52"
                x2="221.3"
                y2="280"
                stroke="#ffffff"
                strokeWidth="0.8"
                opacity="0.75"
              />
            </g>

            {/* 7. Vaho y partículas minerales saliendo de la boca del pozo */}
            <g className="shaft-vapors" opacity="0.7">
              <ellipse cx="212" cy="270" rx="20" ry="6" fill="#94a3b8" filter="blur(4px)" className="well-vapor-1" />
              <ellipse cx="214" cy="275" rx="15" ry="5" fill="#fef08a" filter="blur(5px)" className="well-vapor-2" />
            </g>

            {/* 8. La Jaula Minera con Mineral (Asciende verticalmente) */}
            <g className="mining-cage-assembly">
              <ellipse cx="212" cy="195" rx="22" ry="6" fill="#000000" opacity="0.45" filter="blur(3px)" />

              {/* Grillete de suspensión al cable principal (x: 222, y: 138) */}
              <circle cx="222" cy="138" r="3.2" fill="none" stroke="#f1f5f9" strokeWidth="1.8" />
              <line x1="222" y1="135" x2="222" y2="141" stroke="#cbd5e1" strokeWidth="2" />

              {/* Cadenas de suspensión tipo pata de oca */}
              <line x1="222" y1="140" x2="198" y2="152" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="2 1" />
              <line x1="222" y1="140" x2="226" y2="152" stroke="#cbd5e1" strokeWidth="1.4" strokeDasharray="2 1" />

              {/* Guardacabezas / Visera curva de seguridad */}
              <path
                d="M 194 154 
                   Q 212 147 230 154 
                   L 230 157 
                   Q 212 150 194 157 Z"
                fill="url(#cageBonnet)"
                stroke="#1e293b"
                strokeWidth="1"
              />
              <circle cx="200" cy="153.5" r="0.7" fill="#cbd5e1" />
              <circle cx="212" cy="151.5" r="0.7" fill="#cbd5e1" />
              <circle cx="224" cy="153.5" r="0.7" fill="#cbd5e1" />

              {/* Bastidor de la jaula */}
              <rect x="194" y="190" width="36" height="3" fill="#2d313c" stroke="#171920" strokeWidth="0.8" />
              <line x1="195" y1="190" x2="229" y2="190" stroke="#cbd5e1" strokeWidth="0.8" />

              <line x1="196" y1="154" x2="196" y2="190" stroke="url(#ironLattice)" strokeWidth="2.5" />
              <line x1="228" y1="154" x2="228" y2="190" stroke="url(#ironLattice)" strokeWidth="2.5" />
              <line x1="196" y1="154" x2="196" y2="190" stroke="#94a3b8" strokeWidth="0.6" />
              <line x1="228" y1="154" x2="228" y2="190" stroke="#94a3b8" strokeWidth="0.6" />

              {/* Zapatas de guía en las guiaderas */}
              <rect x="192" y="156" width="4" height="6" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="0.6" />
              <rect x="192" y="182" width="4" height="6" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="0.6" />
              <rect x="228" y="156" width="4" height="6" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="0.6" />
              <rect x="228" y="182" width="4" height="6" rx="1" fill="#475569" stroke="#0f172a" strokeWidth="0.6" />

              <line x1="196" y1="172" x2="228" y2="172" stroke="#475569" strokeWidth="1.2" />

              {/* Enrejado de protección lateral */}
              <g opacity="0.4" stroke="#64748b" strokeWidth="0.7">
                <line x1="196" y1="156" x2="204" y2="172" />
                <line x1="204" y1="156" x2="212" y2="172" />
                <line x1="212" y1="156" x2="220" y2="172" />
                <line x1="220" y1="156" x2="228" y2="172" />
                <line x1="204" y1="172" x2="196" y2="190" />
                <line x1="212" y1="172" x2="204" y2="190" />
                <line x1="220" y1="172" x2="212" y2="190" />
                <line x1="228" y1="172" x2="220" y2="190" />
              </g>

              {/* Vagoneta minera Decauville dentro de la jaula */}
              <circle cx="202" cy="189" r="2.8" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="202" cy="189" r="1" fill="#cbd5e1" />
              <circle cx="222" cy="189" r="2.8" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="222" cy="189" r="1" fill="#cbd5e1" />
              <line x1="199" y1="187" x2="225" y2="187" stroke="#1e293b" strokeWidth="1.5" />

              <polygon
                points="198,175 226,175 223,186 201,186"
                fill="url(#wagonSteel)"
                stroke="#0f172a"
                strokeWidth="1"
              />
              <line x1="198" y1="175" x2="226" y2="175" stroke="#64748b" strokeWidth="1.2" />
              <circle cx="202" cy="178" r="0.6" fill="#cbd5e1" />
              <circle cx="212" cy="178" r="0.6" fill="#cbd5e1" />
              <circle cx="222" cy="178" r="0.6" fill="#cbd5e1" />

              {/* Carga de mineral de La Unión: Galena argentífera, pirita y esfalerita */}
              <g id="minerales-carga">
                <polygon points="199,175 204,168 211,173 206,175" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
                <polygon points="218,175 222,169 226,175" fill="#1e293b" stroke="#0f172a" strokeWidth="0.5" />

                {/* Galena argentífera (cubos metálicos de plata y plomo) */}
                <polygon points="203,171 207,164 214,166 211,173" fill="url(#oreGalena)" stroke="#0f172a" strokeWidth="0.6" />
                <polygon points="207,164 211,161 216,164 214,166" fill="#ffffff" />
                <polygon points="214,166 216,164 220,168 217,172" fill="#94a3b8" />

                {/* Pirita dorada brillante */}
                <polygon points="209,168 215,162 219,166 214,171" fill="url(#orePyrite)" stroke="#451a03" strokeWidth="0.5" />
                <polygon points="215,162 218,159 222,163 219,166" fill="#fef08a" />
                <polygon points="219,166 222,163 224,168 221,171" fill="#ca8a04" />

                {/* Blenda acaramelada (miel / ámbar) */}
                <polygon points="200,174 204,168 208,172 203,175" fill="url(#oreSphalerite)" stroke="#431407" strokeWidth="0.5" />
                <polygon points="216,171 221,167 225,172 220,175" fill="url(#oreSphalerite)" stroke="#431407" strokeWidth="0.5" />

                {/* Cuarzo cristalino */}
                <polygon points="211,162 213,157 215,162" fill="#ffffff" />
                <polygon points="206,166 208,162 210,165" fill="#f8fafc" />

                {/* Destellos especulares animados cuando la jaula llega a la luz */}
                <g className="ore-glint glint-1">
                  <path d="M 211 161 L 213 156 L 215 161 L 220 163 L 215 165 L 213 170 L 211 165 L 206 163 Z" fill="#ffffff" />
                  <circle cx="213" cy="163" r="1.5" fill="#fef08a" />
                </g>
                <g className="ore-glint glint-2">
                  <path d="M 218 162 L 219.5 158 L 221 162 L 225 163.5 L 221 165 L 219.5 169 L 218 165 L 214 163.5 Z" fill="#fef08a" />
                </g>
                <g className="ore-glint glint-3">
                  <path d="M 206 168 L 207 165 L 208 168 L 211 169 L 208 170 L 207 173 L 206 170 L 203 169 Z" fill="#ffffff" />
                </g>
              </g>
            </g>

            {/* ============================================================
                9. ILUMINACIÓN INDUSTRIAL AUTÉNTICA Y REALISTA (SIN OBJETOS FLOTANTES)
                Foco de maniobras empernado sólidamente a la viga intermedia del castillete
                y lámpara minera de seguridad Wolf apoyada firmemente sobre el brocal
                ============================================================ */}
            <g id="iluminacion-minera">
              {/* Haz descendente suave que baña la boca del pozo y la jaula */}
              <polygon
                points="260,172 165,225 186,285 272,250"
                fill="url(#spotlightBeam)"
                pointerEvents="none"
              />

              {/* FOCO INDUSTRIAL DE VIGA: Placa base de acero con remaches sobre la viga */}
              <rect x="248" y="156" width="4" height="9" rx="0.5" fill="#2d3038" stroke="#1c1d22" strokeWidth="0.8" />
              <circle cx="250" cy="158.5" r="0.7" fill="#cbd5e1" />
              <circle cx="250" cy="162.5" r="0.7" fill="#cbd5e1" />

              {/* Brazo acodado de fijación de hierro macizo forjado */}
              <path d="M 251 160.5 L 260 160.5 L 263 166" fill="none" stroke="#484b56" strokeWidth="2.2" strokeLinecap="round" />

              {/* Campana del foco industrial de hierro fundido (orientada hacia el pozo) */}
              <g transform="translate(263, 166) rotate(24)">
                {/* Carcasa cónica reflectora */}
                <path d="M -6 0 C -6 -3 6 -3 6 0 L 8 6 L -8 6 Z" fill="#2a2d36" stroke="#121318" strokeWidth="0.9" />
                <line x1="-8" y1="6" x2="8" y2="6" stroke="#5d6272" strokeWidth="1.2" />
                {/* Lente estriada y resplandor incandescente */}
                <ellipse cx="0" cy="6" rx="6" ry="2.5" fill="#ffffff" />
                <circle cx="0" cy="6" r="7" fill="url(#lampBulbGlow)" className="carbide-lantern-flame" />
                {/* Rejilla de protección metálica antigolpes */}
                <line x1="-3" y1="4" x2="-3" y2="7.5" stroke="#3b3e4a" strokeWidth="0.8" />
                <line x1="0" y1="4" x2="0" y2="8" stroke="#3b3e4a" strokeWidth="0.8" />
                <line x1="3" y1="4" x2="3" y2="7.5" stroke="#3b3e4a" strokeWidth="0.8" />
              </g>

              {/* LÁMPARA MINERA DE SEGURIDAD (WOLF/DAVY): Asentada sólidamente en el brocal de piedra */}
              <g id="lampara-testigo-brocal" transform="translate(263, 252)">
                {/* Base plana circular de latón pesado apoyada en el sillar */}
                <rect x="-4" y="12" width="8" height="4" rx="1" fill="#b45309" stroke="#451a03" strokeWidth="0.8" />
                <rect x="-3.5" y="10" width="7" height="2" fill="#d97706" />
                {/* Cilindro de vidrio blindado con llama segura */}
                <rect x="-3" y="4" width="6" height="6" rx="0.5" fill="#fef08a" opacity="0.9" />
                <circle cx="0" cy="7" r="4.5" fill="url(#lampBulbGlow)" className="carbide-lantern-flame" />
                {/* Columnas protectoras de latón */}
                <line x1="-2.5" y1="4" x2="-2.5" y2="10" stroke="#78350f" strokeWidth="0.7" />
                <line x1="2.5" y1="4" x2="2.5" y2="10" stroke="#78350f" strokeWidth="0.7" />
                {/* Caperuza de malla de alambre y anilla de forja */}
                <polygon points="-3.5,4 3.5,4 2,0 -2,0" fill="#92400e" stroke="#451a03" strokeWidth="0.6" />
                <circle cx="0" cy="-2" r="1.8" fill="none" stroke="#b45309" strokeWidth="0.8" />
              </g>
            </g>
          </svg>
        </div>

        {/* Título, frases y lecturas en tiempo real */}
        <div className="mining-loader-text-area">
          <div className="mining-loader-title">
            <span className="mining-gem-symbol">◆</span>
            <span>{message || 'SIERRA MINERA · LA UNIÓN'}</span>
            <span className="mining-gem-symbol">◆</span>
          </div>

          <div
            className={`mining-loader-phrase ${fade ? 'phrase-visible' : 'phrase-hidden'}`}
          >
            {currentPhrase}
          </div>

          {/* Indicador de profundidad y estado de extracción minera */}
          {showDepth && (
            <div className="mining-depth-gauge">
              <span className="mining-depth-indicator" />
              <span>
                POZO MAESTRO &nbsp;·&nbsp;{' '}
                {depth < 0 ? `NIVEL ${depth} m` : 'SUPERFICIE (0 m)'}
              </span>
            </div>
          )}

          {/* Barra de progreso con destello de veta dorada */}
          <div className="mining-progress-track">
            <div className="mining-progress-shimmer" />
          </div>

          <div className="mining-loader-hint">
            Castillete Minero · Región de Murcia
          </div>
        </div>
      </div>
    </div>
  )
}
