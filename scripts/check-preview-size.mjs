// The homepage contains captures and a launcher; game assets stay on their sites.
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
    if (source.includes('actual-game-preview') || source.includes('game-window-toolbar'))
        games.push({ path, bytes: source.length, gzip: gzipSync(source).length })
}
if (games.length !== 2) throw new Error(`Expected separate capture and live-window chunks; found ${games.length}`)
const bytes = games.reduce((sum, game) => sum + game.bytes, 0)
const gzip = games.reduce((sum, game) => sum + game.gzip, 0)
if (bytes > 20 * 1024 || gzip > 8 * 1024) {
    throw new Error(`Game preview budget exceeded: ${bytes} raw / ${gzip} gzip bytes (limits 20 / 8 KiB)`)
}
const html = await readFile(resolve(root, 'index.html'), 'utf8')
const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match => match[1]))]
let initialGzip = 0
for (const script of scripts) {
    const path = resolve(root, script.replace(/^\//, ''))
    if (games.some(game => path === game.path)) throw new Error('Game previews must remain lazy-loaded')
    initialGzip += gzipSync(await readFile(path)).length
}
console.log(
    `Capture + live-window code: ${(bytes / 1024).toFixed(1)} KiB raw / ${(gzip / 1024).toFixed(1)} KiB gzip; loaded on demand.`
)
const captures = ['crown-clan', 'crown-raid', 'summoners-rift', 'rift-lux', 'gta-grove', 'gta-driving']
let mediaBytes = 0
for (const capture of captures) {
    const file = `/previews/${capture}.webp`
    const size = (await readFile(resolve(root, file.slice(1)))).length
    if (size > 96 * 1024) throw new Error(`Capture exceeds 96 KiB: ${capture}`)
    if (html.includes(file)) throw new Error(`Capture must not load on initial page: ${capture}`)
    mediaBytes += size
}
if (mediaBytes > 384 * 1024) throw new Error('Game captures exceed 384 KiB total')
console.log(`All six captures: ${(mediaBytes / 1024).toFixed(1)} KiB; only the selected capture loads.`)
console.log(`Initial page scripts: ${(initialGzip / 1024).toFixed(1)} KiB gzip (measured locally).`)
