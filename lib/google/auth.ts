/**
 * lib/google/auth.ts
 * Helpers para el flujo OAuth 2.0 con Google Drive.
 * - Sólo se usa en el servidor (API Routes / Server Components).
 * - El client_secret NUNCA llega al cliente.
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_AUTH_BASE  = 'https://accounts.google.com/o/oauth2/v2/auth'

/** Scopes mínimos: acceso solo a los ficheros creados por esta app */
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
].join(' ')

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface GoogleTokenResponse {
  access_token:  string
  refresh_token?: string
  expires_in:    number
  token_type:    string
  scope:         string
}

export interface GoogleTokenError {
  error:             string
  error_description: string
}

// ─── URL de autorización ──────────────────────────────────────────────────────

/**
 * Genera la URL de autorización OAuth 2.0 a la que hay que redirigir al usuario.
 * @param state  Token CSRF (ej. UUID generado en la ruta de connect).
 */
export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope:         DRIVE_SCOPES,
    access_type:   'offline',   // Necesario para obtener refresh_token
    prompt:        'consent',   // Fuerza a Google a devolver siempre refresh_token
    state,
  })
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`
}

// ─── Intercambio de código por tokens ────────────────────────────────────────

/**
 * Intercambia el `code` de autorización por un par de tokens (access + refresh).
 * Solo se llama una vez, en el callback de OAuth.
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      grant_type:    'authorization_code',
    }),
  })

  const data = await res.json() as GoogleTokenResponse | GoogleTokenError

  if ('error' in data) {
    throw new Error(`Google OAuth error: ${data.error} — ${data.error_description}`)
  }
  return data
}

// ─── Refresco de access token ─────────────────────────────────────────────────

/**
 * Usa el refresh_token almacenado en Supabase para obtener un nuevo access_token.
 * Se llama en cada subida de archivo (los access tokens duran ~1h).
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })

  const data = await res.json() as GoogleTokenResponse | GoogleTokenError

  if ('error' in data) {
    throw new Error(`Google token refresh error: ${data.error} — ${data.error_description}`)
  }
  return data.access_token
}
