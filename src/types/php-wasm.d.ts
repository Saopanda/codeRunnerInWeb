declare module 'php-wasm/PhpWeb.mjs' {
  export class PhpWeb {
    constructor()
    run(code: string): void
    addEventListener(
      event: string,
      callback: (event: { detail?: string }) => void
    ): void
    removeEventListener(
      event: string,
      callback: (event: { detail?: string }) => void
    ): void
  }
}
