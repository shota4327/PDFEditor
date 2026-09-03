/**
 * ECMAScript 新機能・Stage 3 プロポーザル向けポリフィル
 * pdfjs-dist v6 が要求する Map.prototype.getOrInsertComputed、
 * Map.prototype.getOrInsert、Uint8Array.prototype.toHex、Promise.withResolvers を補完します。
 */

// Map.prototype.getOrInsertComputed (TC39 Stage 3 Upsert Proposal)
if (typeof Map !== 'undefined' && !(Map.prototype as any).getOrInsertComputed) {
  (Map.prototype as any).getOrInsertComputed = function <K, V>(
    this: Map<K, V>,
    key: K,
    callback: (key: K) => V
  ): V {
    if (this.has(key)) {
      return this.get(key)!;
    }
    const value = callback(key);
    this.set(key, value);
    return value;
  };
}

// Map.prototype.getOrInsert (TC39 Stage 3 Upsert Proposal)
if (typeof Map !== 'undefined' && !(Map.prototype as any).getOrInsert) {
  (Map.prototype as any).getOrInsert = function <K, V>(
    this: Map<K, V>,
    key: K,
    defaultValue: V
  ): V {
    if (this.has(key)) {
      return this.get(key)!;
    }
    this.set(key, defaultValue);
    return defaultValue;
  };
}

// Uint8Array.prototype.toHex (TC39 Stage 3 Uint8Array to/from base64/hex)
if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function (this: Uint8Array): string {
    return Array.from(this)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

// Promise.withResolvers (ES2024)
if (typeof Promise !== 'undefined' && !(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export {};
