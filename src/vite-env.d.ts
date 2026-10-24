/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_IPFS_GATEWAY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
