// Keep the optional games lightweight. This runs against the production output,
// to catch growth in the game UI, simulation, drawing code and inlined assets.
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const root = resolve('publish')
async function javascript(directory) {
    const files = []
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = resolve(directory, entry.name)
        if (entry.isDirectory()) files.push(...(await javascript(path)))
        else if (entry.name.endsWith('.js')) files.push(path)
    }
    return files
}
const files = await javascript(resolve(root, '_next/static/chunks'))
const games = []
for (const path of files) {
    const source = await readFile(path)
    if (source.includes('mini-game-')) games.push({ path, bytes: source.length, gzip: gzipSync(source).length })
}
if (games.length !== 1) throw new Error(`Expected one shared game-preview chunk; found ${games.length}`)
const [game] = games
if (game.bytes > 32 * 1024 || game.gzip > 12 * 1024) {
    throw new Error(`Game preview budget exceeded: ${game.bytes} raw / ${game.gzip} gzip bytes (limits 32 / 12 KiB)`)
}
const html = await readFile(resolve(root, 'index.html'), 'utf8')
const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match => match[1]))]
let initialGzip = 0
for (const script of scripts) {
    const path = resolve(root, script.replace(/^\//, ''))
    if (path === game.path) throw new Error('Game previews must remain lazy-loaded')
    initialGzip += gzipSync(await readFile(path)).length
}
console.log(
    `Game previews: ${(game.bytes / 1024).toFixed(1)} KiB raw / ${(game.gzip / 1024).toFixed(
        1
    )} KiB gzip; loaded on demand.`
)
console.log(`Initial page scripts: ${(initialGzip / 1024).toFixed(1)} KiB gzip (measured locally).`)
