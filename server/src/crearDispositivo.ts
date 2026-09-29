import { randomBytes } from 'node:crypto';
import { huella } from './app';
import { crearDbPg, migrar } from './db';

// Uso: npm run dispositivo:crear -- B07 "Ana López"
// Imprime el token UNA sola vez: se escribe en Ajustes → Servidor del teléfono B07.

const [codigo, observador] = process.argv.slice(2);
if (!codigo || !/^[A-Z]\d{2}$/.test(codigo) || !observador) {
  console.error('Uso: npm run dispositivo:crear -- B07 "Nombre del observador"');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const db = crearDbPg(process.env.DATABASE_URL);
await migrar(db);
const token = randomBytes(24).toString('base64url');
await db.query(
  `INSERT INTO dispositivos (codigo, observador, token_sha256) VALUES ($1, $2, $3)
   ON CONFLICT (codigo) DO UPDATE SET observador = EXCLUDED.observador, token_sha256 = EXCLUDED.token_sha256, activo = true`,
  [codigo, observador, huella(token)],
);
await db.cerrar();

console.log(`\nTeléfono ${codigo} (${observador}) listo.`);
console.log(`Token (guárdalo, no se vuelve a mostrar):\n\n  ${token}\n`);
console.log('Si el código ya existía, su token anterior dejó de funcionar.');
