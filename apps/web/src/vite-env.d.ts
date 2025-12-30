/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Window interface for toast notifications
interface Window {
  toast?: {
    success?: (message: string) => void;
    error?: (message: string) => void;
    info?: (message: string) => void;
    warning?: (message: string) => void;
  };
}
}