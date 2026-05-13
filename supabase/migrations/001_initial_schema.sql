-- ============================================================
-- MineralVault — Schema Inicial de Base de Datos
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- TABLA: minerals (catálogo global de minerales — snapshot Mindat)
-- RLS: lectura pública, escritura solo service_role (para seed)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.minerals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mindat_id        INTEGER UNIQUE,
  name             TEXT NOT NULL,
  name_es          TEXT,
  chemical_formula TEXT,
  hardness_min     NUMERIC(3,1),
  hardness_max     NUMERIC(3,1),
  density_min      NUMERIC(5,2),
  density_max      NUMERIC(5,2),
  streak           TEXT,
  luster           TEXT[],
  transparency     TEXT,
  color            TEXT[],
  crystal_system   TEXT,
  crystal_habits   TEXT[],
  cleavage         TEXT,
  fracture         TEXT,
  tenacity         TEXT,
  magnetism        TEXT,
  radioactivity    TEXT,
  fluorescence     TEXT,
  mineral_class    TEXT,
  strunz_number    TEXT,
  dana_number      TEXT,
  associated_minerals TEXT[],
  localities       TEXT[],
  description      TEXT,
  mindat_url       TEXT,
  thumbnail_url    TEXT,
  model_3d_config  JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda y filtrado
CREATE INDEX IF NOT EXISTS idx_minerals_fts
  ON public.minerals
  USING gin(to_tsvector('english', name || ' ' || COALESCE(name_es, '') || ' ' || COALESCE(mineral_class, '')));

CREATE INDEX IF NOT EXISTS idx_minerals_class ON public.minerals(mineral_class);
CREATE INDEX IF NOT EXISTS idx_minerals_crystal_system ON public.minerals(crystal_system);
CREATE INDEX IF NOT EXISTS idx_minerals_hardness ON public.minerals(hardness_min, hardness_max);
CREATE INDEX IF NOT EXISTS idx_minerals_mindat_id ON public.minerals(mindat_id);

-- RLS
ALTER TABLE public.minerals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "minerals_public_select"
  ON public.minerals FOR SELECT
  TO authenticated, anon
  USING (true);

-- Solo service_role puede insertar/actualizar (seed script usa service_role_key)
CREATE POLICY "minerals_service_role_write"
  ON public.minerals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLA: user_profiles (perfil extendido del coleccionista)
-- Se crea automáticamente al registrarse via trigger
-- RLS: solo el propietario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  bio               TEXT,
  location          TEXT,
  google_drive_connected BOOLEAN DEFAULT FALSE,
  google_refresh_token  TEXT,  -- Almacenado cifrado, manejado server-side
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_select"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_owner_modify"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_owner_insert"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLA: user_collection (colección personal del coleccionista)
-- RLS: solo el propietario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_collection (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mineral_id      UUID NOT NULL REFERENCES public.minerals(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'owned'
                    CHECK (status IN ('owned', 'wanted', 'traded', 'sold')),
  acquired_at     DATE,
  origin          TEXT,
  notes           TEXT,
  quality         SMALLINT CHECK (quality BETWEEN 1 AND 5),
  dimensions      TEXT,
  weight_g        NUMERIC(8,2),
  price_eur       NUMERIC(10,2),
  drive_folder_id TEXT,
  primary_photo_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mineral_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_user ON public.user_collection(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_mineral ON public.user_collection(mineral_id);
CREATE INDEX IF NOT EXISTS idx_collection_status ON public.user_collection(user_id, status);

ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_owner_all"
  ON public.user_collection FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: specimen_photos (metadatos de fotos en Google Drive)
-- RLS: solo el propietario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.specimen_photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id    UUID NOT NULL REFERENCES public.user_collection(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drive_file_id    TEXT NOT NULL,
  drive_view_url   TEXT NOT NULL,
  drive_thumb_url  TEXT,
  filename         TEXT,
  caption          TEXT,
  is_primary       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_collection ON public.specimen_photos(collection_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON public.specimen_photos(user_id);

ALTER TABLE public.specimen_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_owner_all"
  ON public.specimen_photos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: Búsqueda full-text de minerales con filtros
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_minerals(
  search_query    TEXT DEFAULT NULL,
  filter_class    TEXT DEFAULT NULL,
  filter_system   TEXT DEFAULT NULL,
  hardness_min_v  NUMERIC DEFAULT NULL,
  hardness_max_v  NUMERIC DEFAULT NULL,
  page_size       INTEGER DEFAULT 24,
  page_offset     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, mindat_id INTEGER, name TEXT, name_es TEXT,
  chemical_formula TEXT, hardness_min NUMERIC, hardness_max NUMERIC,
  density_min NUMERIC, density_max NUMERIC, streak TEXT,
  color TEXT[], crystal_system TEXT, crystal_habits TEXT[],
  mineral_class TEXT, thumbnail_url TEXT, model_3d_config JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT m.*
    FROM public.minerals m
    WHERE
      (search_query IS NULL OR to_tsvector('english', m.name || ' ' || COALESCE(m.name_es, '')) @@ plainto_tsquery('english', search_query))
      AND (filter_class IS NULL OR m.mineral_class ILIKE filter_class)
      AND (filter_system IS NULL OR m.crystal_system ILIKE filter_system)
      AND (hardness_min_v IS NULL OR m.hardness_max >= hardness_min_v)
      AND (hardness_max_v IS NULL OR m.hardness_min <= hardness_max_v)
  )
  SELECT
    f.id, f.mindat_id, f.name, f.name_es, f.chemical_formula,
    f.hardness_min, f.hardness_max, f.density_min, f.density_max,
    f.streak, f.color, f.crystal_system, f.crystal_habits,
    f.mineral_class, f.thumbnail_url, f.model_3d_config,
    COUNT(*) OVER() AS total_count
  FROM filtered f
  ORDER BY f.name ASC
  LIMIT page_size OFFSET page_offset;
END;
$$;
