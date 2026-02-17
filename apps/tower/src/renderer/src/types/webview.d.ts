/**
 * TypeScript declarations for Electron webview tag
 */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        partition?: string;
        allowpopups?: string;
        nodeintegration?: string;
        contextisolation?: string;
        preload?: string;
      };
    }
  }
}

export {};
