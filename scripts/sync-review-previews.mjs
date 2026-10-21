// Reuse the blog's recorded engine runs; no engine or model ships in these cards.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { runInNewContext } from 'node:vm'

const blog = resolve(process.argv[2] || '../blogs')
const output = resolve('public/previews/reviews')
await mkdir(output, { recursive: true })
const source = async name => {
    const path = `assets/data/${name}-demo.json`
    const bytes = await readFile(resolve(blog, path))
    return { data: JSON.parse(bytes), provenance: { path, sha256: createHash('sha256').update(bytes).digest('hex') } }
}
const core = async (name, symbol) => {
    const context = {}
    runInNewContext(await readFile(resolve(blog, `assets/js/${name}-core.js`), 'utf8'), context)
    return context[symbol]
}
const C = await core('web-chess', 'WebChessCore')
const X = await core('web-xiangqi', 'WebXiangqiCore')
const fenRows = fen => fen.split(' ')[0].split('/').map(row => row.replace(/\d/g, n => '.'.repeat(Number(n))))
const square = (s, height) => [s.charCodeAt(0) - 97, height - (height === 10 ? 1 : 0) - Number(s[1])]
const arrow = (uci, height) => [...square(uci.slice(0, 2), height), ...square(uci.slice(2, 4), height)]
const titleCase = text => text[0].toUpperCase() + text.slice(1)
const save = async (scene, data) => {
    const width = scene === 'chess' ? 8 : 9, height = scene === 'xiangqi' ? 10 : width
    for (const f of data.frames) {
        if (f.board.length !== height || f.board.some(row => row.length !== width)) throw new Error(`Invalid ${scene} board`)
        if (!Number.isFinite(f.balance) || f.balance < 0 || f.balance > 100) throw new Error(`Invalid ${scene} evaluation`)
    }
    const encoded = JSON.stringify({ scene, ...data }) + '\n'
    await writeFile(resolve(output, `${scene}.json`), encoded)
    console.log(`${scene}: ${data.frames.length} positions, ${(Buffer.byteLength(encoded) / 1024).toFixed(1)} KiB`)
}

const chess = await source('web-chess'), game = chess.data.games.find(g => g.id === 'club')
await save('chess', {
    title: 'Club vs Intermediate', engine: 'Stockfish 18 · depth 16', start: 38,
    source: chess.provenance,
    frames: game.frames.map((f, k) => ({
        board: fenRows(f.fen), turn: f.fen.split(' ')[1] === 'w' ? 'White' : 'Black',
        label: k ? `${Math.ceil(k / 2)}${k % 2 ? '.' : '…'} ${f.move.san}` : 'Starting position',
        last: k ? square(f.move.to, 8) : null,
        score: f.eval.cp / 100, mate: f.eval.mate,
        balance: C.winPercentFromCp(f.eval.cp),
        quality: k ? titleCase(game.rows[k - 1].quality) : '',
        lines: f.lines.slice(0, 3).map(l => ({
            label: l.san[0], score: l.cp / 100, mate: l.mate,
            moves: l.uci.slice(0, 2).map(u => arrow(u, 8)), text: l.san.slice(0, 4).join(' '),
        })),
    })),
})

const xiangqi = await source('web-xiangqi'), xg = xiangqi.data.game
let board = X.parseFenBoard(X.START_POSITION_FEN.split(' ')[0])
const boards = [board]
for (const move of xg.moves) {
    const [fx, fy] = square(move.slice(0, 2), 10), [tx, ty] = square(move.slice(2, 4), 10)
    // The source's rank zero is Red's home rank; display rows run top to bottom.
    const next = X.cloneBoardState(board)
    if (!board[9 - fy][fx]) throw new Error(`Empty Xiangqi source: ${move}`)
    next[9 - ty][tx] = next[9 - fy][fx]; next[9 - fy][fx] = ''
    boards.push(next); board = next
}
const worst = xg.rows.reduce((best, row, i) => row.winLoss > xg.rows[best].winLoss ? i : best, 0) + 1
await save('xiangqi', {
    title: 'Easy vs Medium', engine: 'Pikafish · depth 16', start: worst,
    source: xiangqi.provenance,
    frames: xg.evals.map((e, k) => {
        const cp = e.mate !== null ? (e.mate > 0 ? 30000 - e.mate : -30000 - e.mate) : e.cp
        return {
            board: [...boards[k]].reverse().map(row => row.map(p => p || '.').join('')),
            turn: k % 2 ? 'Black' : 'Red',
            label: k ? `${Math.ceil(k / 2)}${k % 2 ? '.' : '…'} ${X.formatMoveInStyle(boards[k - 1], xg.moves[k - 1], 'chinese')}` : 'Starting position',
            last: k ? square(xg.moves[k - 1].slice(2, 4), 10) : null,
            score: cp / 100, mate: e.mate, balance: X.getWinningChancePercent(cp, 'red'),
            quality: k ? titleCase(xg.rows[k - 1].quality) : '',
            lines: (xg.lines[k] || []).slice(0, 3).map(l => {
                const tokens = X.formatLineTokensInStyle(boards[k], l.pv, 'chinese', 4).tokens
                return { label: tokens[0], score: (l.cp || 0) / 100, mate: l.mate, moves: l.pv.slice(0, 2).map(u => arrow(u, 10)), text: tokens.join(' ') }
            }),
        }
    }),
})

const go = await source('web-katrain'), gf = go.data.game.frames
const gtp = s => s === 'pass' ? null : ['ABCDEFGHJKLMNOPQRST'.indexOf(s[0]), 9 - parseInt(s.slice(1), 10)]
const coord = move => move === 'pass' ? 'pass' : 'ABCDEFGHJ'[move[0]] + (9 - move[1])
await save('go', {
    title: '9 × 9 self-play', engine: 'Neural MCTS · 200 visits · small model', start: go.data.review.start,
    source: go.provenance,
    frames: gf.map((f, k) => {
        const prev = gf[k - 1]
        const loss = prev ? (prev.toPlay === 'b' ? 1 : -1) * (prev.leadB - f.leadB) : 0
        const quality = loss >= 12 ? 'Blunder' : loss >= 6 ? 'Mistake' : loss >= 3 ? 'Inaccuracy' : loss >= 1.5 ? 'Slight loss' : loss >= .5 ? 'Good' : 'Best'
        return {
            board: f.board, turn: f.toPlay === 'b' ? 'Black' : 'White',
            label: k ? `${k}. ${prev.toPlay === 'b' ? 'Black' : 'White'} ${coord(prev.move)}` : 'Starting position',
            last: prev && prev.move !== 'pass' ? prev.move : null,
            score: f.leadB, mate: null, balance: f.winB * 100,
            quality: k ? quality : '', planted: !!prev?.slip,
            lines: k === gf.length - 1 ? [] : f.cands.filter(c => c.x >= 0).slice(0, 3).map(c => ({
                label: coord([c.x, c.y]), score: c.s, mate: null,
                moves: c.pv.slice(0, 4).map(gtp), text: c.pv.slice(0, 4).join(' '),
            })),
        }
    }),
})

// The same Cburnett piece artwork used by the blog and Web Chess.
const js = await readFile(resolve(blog, 'assets/js/web-chess.js'), 'utf8')
const pieces = JSON.parse(js.match(/var PIECES = (\{.*\});/)[1])
await writeFile(resolve(output, 'chess-pieces.svg'), '<svg xmlns="http://www.w3.org/2000/svg">' + Object.entries(pieces).map(([id, paths]) => `<symbol id="${id}" viewBox="0 0 45 45">${paths}</symbol>`).join('') + '</svg>\n')
