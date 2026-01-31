/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EMAIL_API_URL: string
  readonly VITE_ADMIN_EMAIL: string
  readonly VITE_COGNITO_USER_POOL_ID: string
  readonly VITE_COGNITO_CLIENT_ID: string
  readonly VITE_COGNITO_REGION: string
  readonly VITE_SCPC_USER: string
  readonly VITE_SCPC_PASSWORD: string
  readonly VITE_SCPC_REGIONAL: string
  readonly VITE_SCPC_CODIGO: string
  readonly VITE_SCPC_SENHA_SISTEMA: string
  readonly VITE_SCPC_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
