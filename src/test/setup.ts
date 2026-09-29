// IndexedDB en memoria para probar Dexie en Node.
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';

// Node 18 no expone `crypto` como global; los navegadores sí.
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}
