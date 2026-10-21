// Rebuild the small Go worker from the user's sibling app, without changing it.
// The checked-in output is used by Pages; normal site builds need no sibling repo.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const go = resolve(process.argv[2] || resolve(root, '../web-katrain'))
const xiangqi = resolve(process.argv[3] || resolve(root, '../web-xiangqi'))
const output = resolve(root, 'public/live-engines/go')
const rules = resolve(root, 'app/lib/live-analysis/vendor')
await mkdir(`${output}/tfjs`, { recursive: true })
await mkdir(rules, { recursive: true })
execFileSync(
    resolve(go, 'node_modules/.bin/esbuild'),
    [
        'src/engine/katago/worker.ts',
        '--bundle',
        '--minify',
        '--format=iife',
        '--platform=browser',
        '--main-fields=browser,module,main',
        '--legal-comments=external',
        '--define:import.meta.env.BASE_URL="/live-engines/go/"',
        `--outfile=${output}/worker.js`,
    ],
    { cwd: go, stdio: 'inherit' }
)
await copyFile(`${go}/public/models/katago-small.bin.gz`, `${output}/model.bin.gz`)
await copyFile(`${go}/LICENSE`, `${output}/LICENSE`)
for (const name of ['tfjs-backend-wasm.wasm', 'tfjs-backend-wasm-simd.wasm', 'tfjs-backend-wasm-threaded-simd.wasm']) {
    await copyFile(`${go}/node_modules/@tensorflow/tfjs-backend-wasm/dist/${name}`, `${output}/tfjs/${name}`)
}
const revision = repo => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
await writeFile(
    `${output}/provenance.json`,
    JSON.stringify(
        {
            repository: 'https://github.com/Sir-Teo/web-katrain',
            commit: revision(go),
            source: 'src/engine/katago/worker.ts',
            build: 'node scripts/sync-preview-engines.mjs',
            model: 'Bundled small test network; quick hints, not strong Go analysis.',
        },
        null,
        2
    ) + '\n'
)
const goRules = (await readFile(`${go}/src/utils/gameLogic.ts`, 'utf8')).replace(
    "import type { BoardState, Player } from '../types';",
    "type Player = 'black' | 'white';\ntype BoardState = (Player | null)[][];"
)
await writeFile(
    `${rules}/go.ts`,
    `// Vendored from Sir-Teo/web-katrain@${revision(go)} (MIT). See public/live-engines/go/LICENSE.\n${goRules}`
)
await writeFile(
    `${rules}/xiangqi.ts`,
    `// Vendored from the user's Sir-Teo/web-xiangqi@${revision(xiangqi)}: src/utils/xiangqi.ts.\n${await readFile(
        `${xiangqi}/src/utils/xiangqi.ts`,
        'utf8'
    )}`
)
