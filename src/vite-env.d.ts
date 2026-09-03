/// <reference types="vite/client" />

declare module '*?url' {
  const src: string;
  export default src;
}

declare module 'pdfjs-dist/build/pdf.worker.mjs' {
  const content: any;
  export = content;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs' {
  const content: any;
  export = content;
}
