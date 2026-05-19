import selfsigned from 'selfsigned';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const certsDir  = resolve(__dirname, '../certs');
mkdirSync(certsDir, { recursive: true });

const attrs = [{ name: 'commonName', value: 'voltvybe-local' }];
const pems  = await selfsigned.generate(attrs, { days: 365, keySize: 2048 });

writeFileSync(resolve(certsDir, 'cert.pem'), pems.cert);
writeFileSync(resolve(certsDir, 'key.pem'),  pems.private);

console.log('TLS cert generated -> backend/certs/cert.pem  +  key.pem');
