// Keep the old build command usable; Wrangler owns Worker bundling and static assets.
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,[new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url).pathname,'deploy','--dry-run','--outdir','dist'],{stdio:'inherit'});
