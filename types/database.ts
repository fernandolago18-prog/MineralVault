// ============================================================
// Tipos TypeScript que reflejan el schema de Supabase
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      minerals: {
        Row: Mineral
        Insert: Omit<Mineral, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Mineral, 'id' | 'created_at'>>
      }
      user_collection: {
        Row: CollectionItem
        Insert: Omit<CollectionItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CollectionItem, 'id' | 'created_at' | 'user_id'>>
      }
      specimen_photos: {
        Row: SpecimenPhoto
        Insert: Omit<SpecimenPhoto, 'id' | 'created_at'>
        Update: Partial<Omit<SpecimenPhoto, 'id' | 'created_at' | 'user_id'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
    }
    Functions: {
      search_minerals: {
        Args: {
          search_query?: string | null
          filter_class?: string | null
          filter_system?: string | null
          hardness_min_v?: number | null
          hardness_max_v?: number | null
          page_size?: number
          page_offset?: number
        }
        Returns: MineralSearchResult[]
      }
    }
  }
}

// ============================================================
// Entidades
// ============================================================

export interface Mineral {
  id: string
  mindat_id: number | null
  name: string
  name_es: string | null
  chemical_formula: string | null
  hardness_min: number | null
  hardness_max: number | null
  density_min: number | null
  density_max: number | null
  streak: string | null
  luster: string[] | null
  transparency: string | null
  color: string[] | null
  crystal_system: CrystalSystem | null
  crystal_habits: string[] | null
  cleavage: string | null
  fracture: string | null
  tenacity: string | null
  magnetism: string | null
  radioactivity: string | null
  fluorescence: string | null
  mineral_class: string | null
  strunz_number: string | null
  dana_number: string | null
  associated_minerals: string[] | null
  localities: string[] | null
  description: string | null
  mindat_url: string | null
  thumbnail_url: string | null
  model_3d_config: Crystal3DConfig | null
  parent_mindat_id: number | null
  created_at: string
  updated_at: string
}

export interface MineralSearchResult extends Omit<Mineral, 'luster' | 'transparency' | 'cleavage' | 'fracture' | 'tenacity' | 'magnetism' | 'radioactivity' | 'fluorescence' | 'strunz_number' | 'dana_number' | 'associated_minerals' | 'localities' | 'description' | 'mindat_url' | 'created_at' | 'updated_at'> {
  total_count: number
}

export interface CollectionItem {
  id: string
  user_id: string
  mineral_id: string
  status: CollectionStatus
  acquired_at: string | null
  origin: string | null
  notes: string | null
  quality: number | null
  dimensions: string | null
  weight_g: number | null
  price_eur: number | null
  drive_folder_id: string | null
  primary_photo_url: string | null
  created_at: string
  updated_at: string
}

export interface CollectionItemWithMineral extends CollectionItem {
  mineral: Mineral
}

export interface SpecimenPhoto {
  id: string
  collection_id: string
  user_id: string
  drive_file_id: string
  drive_view_url: string
  drive_thumb_url: string | null
  filename: string | null
  caption: string | null
  is_primary: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  bio: string | null
  location: string | null
  google_drive_connected: boolean
  google_refresh_token: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Enums y tipos auxiliares
// ============================================================

export type CollectionStatus = 'owned' | 'wanted' | 'traded' | 'sold'

export type CrystalSystem =
  | 'Cubic'
  | 'Hexagonal'
  | 'Tetragonal'
  | 'Orthorhombic'
  | 'Monoclinic'
  | 'Triclinic'
  | 'Trigonal'
  | 'Amorphous'
  | string

export interface Crystal3DConfig {
  system: CrystalSystem
  habit: string
  /** Parámetros paramétricos para Three.js */
  params?: {
    a?: number  // Eje a (normalizado)
    b?: number  // Eje b (normalizado)
    c?: number  // Eje c (normalizado)
    alpha?: number  // Ángulo alpha (grados)
    beta?: number   // Ángulo beta (grados)
    gamma?: number  // Ángulo gamma (grados)
    dominantFaces?: string[]  // e.g. ['cube', 'octahedron']
  }
}

// ============================================================
// UI helpers
// ============================================================

export const CRYSTAL_SYSTEM_LABELS: Record<string, string> = {
  Cubic: 'Cúbico',
  Hexagonal: 'Hexagonal',
  Tetragonal: 'Tetragonal',
  Orthorhombic: 'Ortorrómbico',
  Monoclinic: 'Monoclínico',
  Triclinic: 'Triclínico',
  Trigonal: 'Trigonal',
  Icosahedral: 'Icosaédrico',
  Amorphous: 'Amorfo',
}

export const CRYSTAL_SYSTEM_DEFINITIONS: Record<string, string> = {
  Cubic: 'Cúbico (Isométrico): Tres ejes iguales que se cortan en ángulos de 90°.',
  Tetragonal: 'Tetragonal: Tres ejes, dos iguales y uno diferente, todos a 90°.',
  Hexagonal: 'Hexagonal: Tres ejes iguales en un plano a 120° y un cuarto eje perpendicular diferente.',
  Trigonal: 'Trigonal (Romboédrico): Similar al hexagonal, pero sin un eje de simetría séxtuple (a veces agrupado como una subdivisión de este último).',
  Orthorhombic: 'Ortorrómbico: Tres ejes desiguales que se cortan a 90°.',
  Monoclinic: 'Monoclínico: Tres ejes desiguales, dos de ellos inclinados entre sí y el tercero perpendicular.',
  Triclinic: 'Triclínico: Tres ejes desiguales y ninguno forma ángulos de 90°.',
  Amorphous: 'Amorfo: Estructura no cristalina sin ordenamiento atómico de largo alcance.',
}

export const VALID_3D_SYSTEMS = [
  'Cubic',
  'Tetragonal',
  'Hexagonal',
  'Trigonal',
  'Orthorhombic',
  'Monoclinic',
  'Triclinic',
]

export const MINERAL_CLASS_LABELS: Record<string, string> = {
  'Native Elements': 'Elementos Nativos',
  'Sulfides': 'Sulfuros',
  'Oxides': 'Óxidos',
  'Halides': 'Haluros',
  'Carbonates': 'Carbonatos',
  'Phosphates': 'Fosfatos',
  'Silicates': 'Silicatos',
  'Sulfates': 'Sulfatos',
  'Borates': 'Boratos',
  'Arsenates': 'Arseniatos',
  'Vanadates': 'Vanadatos',
  'Tungstates': 'Tungstatos',
  'Molybdates': 'Molibdatos',
  'Nitrates': 'Nitratos',
}

export const LUSTER_LABELS: Record<string, string> = {
  vitreous: 'Vítreo',
  'sub-vitreous': 'Subvítreo',
  subvitreous: 'Subvítreo',
  adamantine: 'Adamantino',
  pearly: 'Nacarado (Perlado)',
  greasy: 'Graso',
  silky: 'Sedoso',
  resinous: 'Resinoso',
  waxy: 'Ceroso',
  dull: 'Mate',
  metallic: 'Metálico',
  submetallic: 'Submetálico',
  earthy: 'Terroso',
}

export const TRANSPARENCY_LABELS: Record<string, string> = {
  transparent: 'Transparente',
  translucent: 'Translúcido',
  opaque: 'Opaco',
}

export const CLEAVAGE_LABELS: Record<string, string> = {
  perfect: 'Perfecta',
  good: 'Buena',
  fair: 'Regular',
  poor: 'Pobre',
  indistinct: 'Indistinta',
  none: 'Ninguna',
  distinct: 'Distinguible',
  imperfect: 'Imperfecta',
}

export const FRACTURE_LABELS: Record<string, string> = {
  conchoidal: 'Concoidea',
  subconchoidal: 'Subconcoidea',
  'sub-conchoidal': 'Subconcoidea',
  uneven: 'Irregular',
  splintery: 'Astillosa',
  hackly: 'Ganchosa',
  fibrous: 'Fibrosa',
  even: 'Regular',
  irregular: 'Irregular',
}

export const TENACITY_LABELS: Record<string, string> = {
  brittle: 'Frágil',
  sectile: 'Séctil',
  malleable: 'Maleable',
  ductile: 'Dúctil',
  flexible: 'Flexible',
  elastic: 'Elástica',
}

export const COLOR_LABELS: Record<string, string> = {
  white: 'Blanco',
  black: 'Negro',
  blue: 'Azul',
  red: 'Rojo',
  green: 'Verde',
  brown: 'Marrón',
  yellow: 'Amarillo',
  gray: 'Gris',
  grey: 'Gris',
  pink: 'Rosa',
  orange: 'Naranja',
  violet: 'Violeta',
  purple: 'Púrpura',
  colorless: 'Incoloro',
  colourless: 'Incoloro',
}

export const CRYSTAL_HABIT_LABELS: Record<string, string> = {
  prismatic: 'Prismático',
  rhombohedral: 'Romboédrico',
  tabular: 'Tabular',
  cubic: 'Cúbico',
  octahedral: 'Octaédrico',
  dodecahedral: 'Dodecaédrico',
  pyramidal: 'Piramidal',
  scalenohedral: 'Escalenoédrico',
  acicular: 'Acicular',
  needle: 'En agujas (Acicular)',
  platy: 'Laminar',
  plate: 'Laminar',
  plat: 'Laminar',
  earthy: 'Terroso',
  columnar: 'Columnar',
  massive: 'Masivo',
  granular: 'Granular',
  botryoidal: 'Botrioidal',
  fibrous: 'Fibroso',
  stalactitic: 'Estalactítico',
  radiating: 'Radiado',
  reniform: 'Reniforme',
}

export function translateHabit(habit: string | null | undefined): string {
  if (!habit) return '—';
  const clean = habit.toLowerCase().trim();
  return CRYSTAL_HABIT_LABELS[clean] ?? habit;
}

export function translateLuster(lusterArray: string[] | null | undefined): string {
  if (!lusterArray || lusterArray.length === 0) return '—';
  return lusterArray.map(l => LUSTER_LABELS[l.toLowerCase().trim()] ?? l).join(', ');
}

export function translateCleavage(cleavage: string | null | undefined): string {
  if (!cleavage) return '—';
  const clean = cleavage.toLowerCase().replace(/\./g, '').trim();
  const parts = clean.split(/[\/,;\-]/).map(p => p.trim());
  return parts.map(p => CLEAVAGE_LABELS[p] ?? p).join(' / ');
}

export function translateFracture(fracture: string | null | undefined): string {
  if (!fracture) return '—';
  const clean = fracture.toLowerCase().replace(/\./g, '').trim();
  const parts = clean.split(/[,;\/]/).map(p => p.trim());
  const mapped = parts.map(p => {
    const norm = p.replace('-', '');
    return FRACTURE_LABELS[p] ?? FRACTURE_LABELS[norm] ?? p;
  });
  return Array.from(new Set(mapped)).join(', ');
}

export function translateTenacity(tenacity: string | null | undefined): string {
  if (!tenacity) return '—';
  const clean = tenacity.toLowerCase().replace(/\./g, '').trim();
  const parts = clean.split(/[,;\/]/).map(p => p.trim());
  return parts.map(p => TENACITY_LABELS[p] ?? p).join(', ');
}

export function translateStreak(streak: string | null | undefined): string {
  if (!streak) return '—';
  let clean = streak.trim().replace(/\./g, '');
  
  // Diccionario de traducción de rayas comunes
  const replacements: [RegExp, string][] = [
    [/^white$/i, 'Blanca'],
    [/^white to pale yellow$/i, 'Blanca a amarillo pálido'],
    [/^colorless$/i, 'Incoloro'],
    [/^colourless$/i, 'Incoloro'],
    [/^grey$/i, 'Gris'],
    [/^gray$/i, 'Gris'],
    [/^black$/i, 'Negra'],
    [/^red$/i, 'Roja'],
    [/^brown$/i, 'Marrón'],
    [/^yellow$/i, 'Amarilla'],
    [/^green$/i, 'Verde'],
    [/^light green$/i, 'Verde claro'],
    [/^dark green$/i, 'Verde oscuro'],
    [/^pale green$/i, 'Verde pálido'],
    [/^yellowish$/i, 'Amarillenta'],
    [/^reddish brown$/i, 'Marrón rojizo'],
    [/^dark brown$/i, 'Marrón oscuro'],
    [/^lead-grey$/i, 'Gris plomo'],
    [/^lead grey$/i, 'Gris plomo'],
    [/^brass-yellow$/i, 'Amarillo latón'],
    [/^copper-red$/i, 'Rojo cobre'],
    [/^copper red$/i, 'Rojo cobre'],
  ];

  for (const [regex, replacement] of replacements) {
    if (regex.test(clean)) {
      return replacement;
    }
  }

  // Si no coincide exactamente, hacer traducción por palabras claves
  const wordReplacements: [RegExp, string][] = [
    [/white/gi, 'blanca'],
    [/colorless/gi, 'incolora'],
    [/colourless/gi, 'incolora'],
    [/black/gi, 'negra'],
    [/red/gi, 'roja'],
    [/brown/gi, 'marrón'],
    [/yellow/gi, 'amarilla'],
    [/green/gi, 'verde'],
    [/grey/gi, 'gris'],
    [/gray/gi, 'gris'],
    [/pale/gi, 'pálido'],
    [/dark/gi, 'oscuro'],
    [/light/gi, 'claro'],
    [/\bto\b/gi, 'a'],
    [/\band\b/gi, 'y'],
    [/\bor\b/gi, 'o'],
  ];

  for (const [regex, replacement] of wordReplacements) {
    clean = clean.replace(regex, replacement);
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function translateColor(colorArray: string[] | null | undefined): string {
  if (!colorArray || colorArray.length === 0) return '—';
  
  const colorsList = colorArray.map(color => {
    let clean = color.trim();
    
    // Traducción de frases comunes de Mindat
    if (clean.toLowerCase().includes('displays a wide variety of colour')) {
      return 'Gran variedad de colores (púrpura, verde, amarillo, azul, incoloro, rosa, etc.)';
    }
    if (clean.toLowerCase().includes('often tinged other hues due to impurities')) {
      return 'A menudo teñido de otros tonos debido a impurezas';
    }

    const replacements: [RegExp, string][] = [
      [/colorless/gi, 'incoloro'],
      [/colourless/gi, 'incoloro'],
      [/pale brass-yellow/gi, 'amarillo latón pálido'],
      [/brass-yellow/gi, 'amarillo latón'],
      [/brass yellow/gi, 'amarillo latón'],
      [/golden-yellow/gi, 'amarillo dorado'],
      [/golden yellow/gi, 'amarillo dorado'],
      [/champagne/gi, 'champaña'],
      [/yellowish green/gi, 'verde amarillento'],
      [/yellowish-green/gi, 'verde amarillento'],
      [/greenish/gi, 'verdoso'],
      [/bluish/gi, 'azulado'],
      [/reddish/gi, 'rojizo'],
      [/yellowish/gi, 'amarillento'],
      [/brownish/gi, 'marronáceo'],
      [/white/gi, 'blanco'],
      [/black/gi, 'negro'],
      [/blue/gi, 'azul'],
      [/red/gi, 'rojo'],
      [/green/gi, 'verde'],
      [/brown/gi, 'marrón'],
      [/yellow/gi, 'amarillo'],
      [/gray/gi, 'gris'],
      [/grey/gi, 'gris'],
      [/pink/gi, 'rosa'],
      [/orange/gi, 'naranja'],
      [/violet/gi, 'violeta'],
      [/purple/gi, 'púrpura'],
      [/lilac/gi, 'lila'],
      [/bronze/gi, 'bronce'],
      [/copper/gi, 'cobre'],
      [/gold/gi, 'dorado'],
      [/golden/gi, 'dorado'],
      [/silver/gi, 'plata'],
      [/silvery/gi, 'plateado'],
      [/rose/gi, 'rosa'],
      [/etc/gi, 'etc'],
      [/\bto\b/gi, 'a'],
      [/\band\b/gi, 'y'],
      [/\bor\b/gi, 'o'],
      [/\bwith\b/gi, 'con'],
      [/\bdeep\b/gi, 'oscuro'],
      [/\bdeeper\b/gi, 'más oscuro'],
      [/\bshades\b/gi, 'tonos'],
      [/\bdark\b/gi, 'oscuro'],
      [/\blight\b/gi, 'claro'],
    ];

    for (const [regex, replacement] of replacements) {
      clean = clean.replace(regex, replacement);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  });

  return colorsList.join(', ');
}

export function translateMagnetism(magnetism: string | null | undefined): string {
  if (!magnetism) return '—';
  const clean = magnetism.trim();
  const replacements: Record<string, string> = {
    'Antiferromagnetic': 'Antiferromagnético',
    'antiferromagnetic': 'antiferromagnético',
    'Magnetic': 'Magnético',
    'magnetic': 'magnético',
    'Non-magnetic': 'No magnético',
    'non-magnetic': 'no magnético',
  };
  return replacements[clean] ?? clean;
}

export function translateRadioactivity(radioactivity: string | null | undefined): string {
  if (!radioactivity) return '—';
  const clean = radioactivity.trim();
  const replacements: Record<string, string> = {
    'none': 'ninguna',
    'None': 'Ninguna',
    'weak': 'débil',
    'Weak': 'Débil',
    'strong': 'fuerte',
    'Strong': 'Fuerte',
  };
  return replacements[clean] ?? clean;
}

export function translateFluorescence(fluorescence: string | null | undefined): string {
  if (!fluorescence) return '—';
  let clean = fluorescence.trim();
  
  const lower = clean.toLowerCase();
  if (lower === 'none' || lower === 'none.' || lower === 'ninguno' || lower === 'ninguno.' || lower === 'ninguna' || lower === 'ninguna.') {
    return 'Ninguna';
  }
  if (lower === 'no' || lower === 'no.') {
    return 'No';
  }
  if (lower === 'not fluorescent' || lower === 'not fluorescent.' || lower === 'no fluorescente' || lower === 'no fluorescente.') {
    return 'No fluorescente';
  }

  const replacements: [RegExp, string][] = [
    [/not fluorescent/gi, 'no fluorescente'],
    [/fluorescent/gi, 'fluorescente'],
    [/weak/gi, 'débil'],
    [/bright/gi, 'brillante'],
    [/strong/gi, 'fuerte'],
    [/under/gi, 'bajo'],
    [/short-wave/gi, 'onda corta'],
    [/short wave/gi, 'onda corta'],
    [/long-wave/gi, 'onda larga'],
    [/long wave/gi, 'onda larga'],
    [/wavelength/gi, 'longitud de onda'],
    [/light/gi, 'luz'],
    [/yellow/gi, 'amarillo'],
    [/green/gi, 'verde'],
    [/blue/gi, 'azul'],
    [/red/gi, 'rojo'],
    [/orange/gi, 'naranja'],
    [/white/gi, 'blanco'],
    [/cream/gi, 'crema'],
    [/pink/gi, 'rosa'],
    [/violet/gi, 'violeta'],
    [/purple/gi, 'púrpura'],
    [/none observed/gi, 'ninguno observado'],
    [/\bto\b/gi, 'a'],
    [/\band\b/gi, 'y'],
    [/\bor\b/gi, 'o'],
  ];

  for (const [regex, replacement] of replacements) {
    clean = clean.replace(regex, replacement);
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Hábitos de cristalización por defecto (fallback) para minerales comunes */
export const FALLBACK_CRYSTAL_HABITS: Record<number, string[]> = {
  3337: ['Prismatic', 'Rhombohedral', 'Tabular'],       // Quartz (Cuarzo)
  1576: ['Cubic', 'Octahedral', 'Dodecahedral'],         // Fluorite (Fluorita)
  859:  ['Rhombohedral', 'Scalenohedral', 'Prismatic'],  // Calcite (Calcita)
  1136: ['Pyramidal', 'Prismatic', 'Tabular'],          // Corundum (Corindón)
}

/**
 * Fusiona las propiedades de una variedad de mineral con las de su especie mineral principal (padre),
 * heredando cualquier propiedad que esté vacía o nula en la variedad.
 * También aplica hábitos cristalinos predeterminados si la especie principal no los tiene especificados.
 */
export function mergeMineralWithParent<T extends Partial<Mineral>>(mineral: T, parent: Partial<Mineral> | null | undefined): T {
  const merged = { ...mineral };
  
  if (parent && mineral.parent_mindat_id) {
    const fieldsToMerge: (keyof Mineral)[] = [
      'chemical_formula',
      'hardness_min',
      'hardness_max',
      'density_min',
      'density_max',
      'streak',
      'luster',
      'transparency',
      'color',
      'crystal_system',
      'crystal_habits',
      'cleavage',
      'fracture',
      'tenacity',
      'magnetism',
      'radioactivity',
      'fluorescence',
      'mineral_class',
      'strunz_number',
      'dana_number',
      'associated_minerals',
      'localities',
      'description',
      'model_3d_config',
    ];

    for (const field of fieldsToMerge) {
      const val = mineral[field];
      const parentVal = parent[field];
      
      const isEmpty = 
        val === null || 
        val === undefined || 
        val === '' || 
        (Array.isArray(val) && val.length === 0) ||
        (field === 'strunz_number' && val === '0.0.0') ||
        (field === 'dana_number' && val === '0.0.0.0') ||
        (field === 'model_3d_config' && val && typeof val === 'object' && (val as any).system === 'Amorphous' && (!(val as any).params || (val as any).params.a === 1 && (val as any).params.b === 1 && (val as any).params.c === 1));

      if (isEmpty && parentVal !== null && parentVal !== undefined && parentVal !== '') {
        if (field === 'model_3d_config') {
          const parentConfig = parentVal as any;
          const parentIsEmpty = parentConfig && parentConfig.system === 'Amorphous' && (!parentConfig.params || parentConfig.params.a === 1 && parentConfig.params.b === 1 && parentConfig.params.c === 1);
          if (!parentIsEmpty) {
            (merged as any)[field] = parentVal;
          }
        } else {
          (merged as any)[field] = parentVal;
        }
      }
    }

    // Fallback description if it's null but specify it's a variety of the parent
    if (!mineral.description && parent.description) {
      merged.description = `Variedad de ${parent.name_es || parent.name}. ${parent.description}`;
    }
  }

  // Enriquecer con hábitos cristalinos de fallback si están vacíos (priorizando ID del padre si es variedad)
  const lookupId = merged.parent_mindat_id ?? merged.mindat_id ?? (parent ? (parent.parent_mindat_id ?? parent.mindat_id) : null);
  if (lookupId && (!merged.crystal_habits || merged.crystal_habits.length === 0)) {
    const fallback = FALLBACK_CRYSTAL_HABITS[lookupId];
    if (fallback) {
      merged.crystal_habits = fallback;
    }
  }

  return merged;
}

export function getStreakColor(streak: string | null | undefined): { hex: string; border?: string } | null {
  if (!streak) return null;
  const clean = streak.toLowerCase().trim();
  
  if (clean.includes('incolor') || clean.includes('colourless') || clean.includes('colorless')) {
    return { hex: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)' };
  }
  if (clean.includes('blanc') || clean.includes('white')) {
    return { hex: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)' };
  }
  if (clean.includes('amarillo latón') || clean.includes('brass')) {
    return { hex: '#d4af37' };
  }
  if (clean.includes('amarillo-oro') || clean.includes('gold') || clean.includes('oro')) {
    return { hex: '#ffd700' };
  }
  if (clean.includes('marrón rojiz') || clean.includes('marrón rojoc') || clean.includes('reddish brown')) {
    return { hex: '#a0522d' };
  }
  if (clean.includes('marrón oscur') || clean.includes('dark brown')) {
    return { hex: '#4a2f13' };
  }
  if (clean.includes('rojo cobre') || clean.includes('copper')) {
    return { hex: '#b87333' };
  }
  if (clean.includes('roja') || clean.includes('rojo') || clean.includes('red')) {
    return { hex: '#c0392b' };
  }
  if (clean.includes('marrón') || clean.includes('brown')) {
    return { hex: '#8b5a2b' };
  }
  if (clean.includes('amarill') || clean.includes('yellow')) {
    return { hex: '#f1c40f' };
  }
  if (clean.includes('gris plomo') || clean.includes('lead')) {
    return { hex: '#555d65', border: '1px solid rgba(255, 255, 255, 0.2)' };
  }
  if (clean.includes('gris') || clean.includes('grey') || clean.includes('gray')) {
    return { hex: '#8e8e93' };
  }
  if (clean.includes('negra') || clean.includes('negro') || clean.includes('black')) {
    return { hex: '#111111', border: '1px solid rgba(255, 255, 255, 0.3)' };
  }
  if (clean.includes('verde claro') || clean.includes('light green')) {
    return { hex: '#a3e4d7' };
  }
  if (clean.includes('verde oscur') || clean.includes('dark green')) {
    return { hex: '#196f3d' };
  }
  if (clean.includes('verde pálid') || clean.includes('pale green')) {
    return { hex: '#abebc6' };
  }
  if (clean.includes('verde') || clean.includes('green')) {
    return { hex: '#2ecc71' };
  }
  if (clean.includes('azul') || clean.includes('blue')) {
    return { hex: '#3498db' };
  }
  if (clean.includes('naranja') || clean.includes('orange')) {
    return { hex: '#e67e22' };
  }
  
  return null;
}



