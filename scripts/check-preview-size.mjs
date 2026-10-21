// Hovers contain short films; full game engines and assets stay on their sites.
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
const reviews = []
for (const path of files) {
    const source = await readFile(path)
    if (source.includes('recorded-review')) reviews.push({ path, bytes: source.length, gzip: gzipSync(source).length })
    if (source.includes('game-film'))
        games.push({ path, bytes: source.length, gzip: gzipSync(source).length })
}
if (games.length !== 1) throw new Error(`Expected one lazy game-film chunk; found ${games.length}`)
const bytes = games.reduce((sum, game) => sum + game.bytes, 0)
const gzip = games.reduce((sum, game) => sum + game.gzip, 0)
if (bytes > 8 * 1024 || gzip > 4 * 1024) {
    throw new Error(`Game preview budget exceeded: ${bytes} raw / ${gzip} gzip bytes (limits 8 / 4 KiB)`)
}
const html = await readFile(resolve(root, 'index.html'), 'utf8')
const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match => match[1]))]
let initialGzip = 0
for (const script of scripts) {
    const path = resolve(root, script.replace(/^\//, ''))
    if ([...games, ...reviews].some(game => path === game.path)) throw new Error('Game previews must remain lazy-loaded')
    initialGzip += gzipSync(await readFile(path)).length
}
console.log(
    `Game film code: ${(bytes / 1024).toFixed(1)} KiB raw / ${(gzip / 1024).toFixed(1)} KiB gzip; loaded on demand.`
)
let mediaBytes = 0
for (const game of ['crown', 'rift', 'gta']) {
    for (const extension of ['mp4', 'webp']) {
        const file = `/previews/game-${game}.${extension}`
        const size = (await readFile(resolve(root, file.slice(1)))).length
        const limit = extension === 'mp4' ? 600 * 1024 : 50 * 1024
        if (size > limit) throw new Error(`Game media exceeds ${limit / 1024} KiB: ${file}`)
        if (html.includes(file)) throw new Error(`Game media must not load on initial page: ${file}`)
        mediaBytes += size
    }
}
if (mediaBytes > 1600 * 1024) throw new Error('Game media exceeds 1600 KiB total')
console.log(`All three films + posters: ${(mediaBytes / 1024).toFixed(1)} KiB; only the open card loads its film.`)
console.log(`Initial page scripts: ${(initialGzip / 1024).toFixed(1)} KiB gzip (measured locally).`)

if (reviews.length !== 1 || reviews[0].gzip > 8 * 1024) throw new Error('Recorded review UI must stay in one lazy chunk below 8 KiB gzip')
let reviewBytes = 0
for (const name of ['chess.json', 'xiangqi.json', 'go.json', 'chess-pieces.svg']) {
    const file = `/previews/reviews/${name}`
    const size = (await readFile(resolve(root, file.slice(1)))).length
    if (size > 80 * 1024) throw new Error(`Recorded review asset exceeds 80 KiB: ${name}`)
    if (html.includes(file)) throw new Error(`Review asset must load only on demand: ${name}`)
    reviewBytes += size
}
if (reviewBytes > 160 * 1024) throw new Error('Recorded game assets exceed 160 KiB total')
console.log(`Recorded reviews: ${(reviews[0].gzip / 1024).toFixed(1)} KiB gzip UI; ${(reviewBytes / 1024).toFixed(1)} KiB total data and pieces, loaded per open board.`)
