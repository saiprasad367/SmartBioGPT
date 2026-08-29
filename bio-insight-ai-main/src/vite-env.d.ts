/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google Identity Services - loaded from index.html
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          ux_mode?: "popup" | "redirect";
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: Record<string, unknown>
        ) => void;
        prompt: () => void;
        disableAutoSelect: () => void;
      };
    };
  };
}
