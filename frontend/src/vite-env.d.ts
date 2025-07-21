/// <reference types="vite/client" />
/// <reference types="jest" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // más variables de entorno según sea necesario
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
