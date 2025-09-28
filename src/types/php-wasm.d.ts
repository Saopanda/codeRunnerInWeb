declare module 'php-wasm/PhpWeb.mjs' {
  export class PhpWeb {
    constructor()
    run: (code: string) => Promise<void>
    destroy: () => void
    addEventListener: (event: string, callback: (event: { detail?: string }) => void) => void
    removeEventListener: (event: string, callback: (event: { detail?: string }) => void) => void
  }

  export function runPhpTags(code: string): Promise<string>
}
