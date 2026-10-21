import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildPosition, moveLabel, squareName, squarePoint } from './game'
import { isValidMove, checkCaptures } from './vendor/go'
import { parseUciInfo, UciQueue } from './uci'
import { createEngine, type Analysis } from './engines'

describe('playable positions', () => {
    it('uses legal chess moves, including castling and en passant', () => {
        const castle = buildPosition('chess', ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6'])
        expect(castle.legal).toContain('e1g1')
        expect(moveLabel(castle, 'e1g1')).toBe('O-O')
        const castled = buildPosition('chess', [...castle.moves, 'e1g1'])
        expect(castled.board[7].slice(4, 8)).toEqual(['', 'R', 'K', ''])
        const ep = ['e2e4', 'a7a6', 'e4e5', 'd7d5']
        expect(buildPosition('chess', ep).legal).toContain('e5d6')
        expect(buildPosition('chess', [...ep, 'e5d6']).board[3][3]).toBe('')
    })
    it('offers all promotions and recognizes checkmate', () => {
        const promotion = buildPosition('chess', ['a2a4', 'h7h5', 'a4a5', 'h5h4', 'a5a6', 'h4h3', 'a6b7', 'h3g2'])
        expect(promotion.legal.filter(move => move.startsWith('b7a8'))).toHaveLength(4)
        expect(buildPosition('chess', ['f2f3', 'e7e5', 'g2g4', 'd8h4']).terminal).toContain('Checkmate')
    })
    it('keeps Xiangqi coordinates, turn and legal cannon/horse moves consistent', () => {
        const start = buildPosition('xiangqi', [])
        expect(start.legal).toContain('h2e2')
        expect(start.legal).toContain('b0c2')
        expect(start.legal).not.toContain('b0b2')
        const moved = buildPosition('xiangqi', ['h2e2'])
        expect(moved.board[7][4]).toBe('C')
        expect(moved.board[7][7]).toBe('')
        expect(moved.turn).toBe(1)
        expect(moved.legal).not.toContain('b0c2')
        expect(() => buildPosition('xiangqi', ['b0b2'])).toThrow()
    })
    it('plays and captures Go stones without mutating previous positions', () => {
        const moves = ['B1', 'A1', 'A2']
        const position = buildPosition('go', moves)
        expect(position.board[8][0]).toBe('')
        expect(position.goBoards![2][8][0]).toBe('white')
        expect(position.legal).not.toContain('A1') // suicide
        expect(buildPosition('go', moves.slice(0, -1)).board[8][0]).toBe('W')
        expect(buildPosition('go', ['pass', 'pass']).terminal).toContain('Two passes')
    })
    it('rejects immediate ko recapture but allows it after an intervening turn', () => {
        const board = Array.from({ length: 9 }, () => Array<'black' | 'white' | null>(9).fill(null))
        board[1][1] = 'white'
        for (const [x, y] of [
            [0, 1],
            [1, 0],
            [1, 2],
        ])
            board[y][x] = 'black'
        for (const [x, y] of [
            [2, 0],
            [2, 2],
            [3, 1],
        ])
            board[y][x] = 'white'
        const next = board.map(row => [...row])
        next[1][2] = 'black'
        const captured = checkCaptures(next, 2, 1, 'black').newBoard
        expect(captured[1][1]).toBeNull()
        expect(isValidMove(captured, 1, 1, 'white', board)).toBe(false)
        expect(isValidMove(captured, 1, 1, 'white', captured)).toBe(true)
    })
    it('round-trips every board coordinate', () => {
        for (const scene of ['chess', 'xiangqi', 'go'] as const) {
            const position = buildPosition(scene, [])
            position.board.forEach((row, y) =>
                row.forEach((_, x) => expect(squarePoint(scene, squareName(scene, x, y))).toEqual([x, y]))
            )
        }
    })
})

describe('UCI search ownership', () => {
    it('ignores bounds and parses scored multi-PV lines', () => {
        expect(parseUciInfo('info depth 8 multipv 2 score cp -37 pv e7e5 g1f3')).toMatchObject({
            move: 'e7e5',
            score: -37,
            rank: 2,
        })
        expect(parseUciInfo('info depth 12 score mate -2 pv e7e5')).toMatchObject({ mate: true, score: -2 })
        expect(parseUciInfo('info depth 8 score cp 100 lowerbound pv e7e5')).toBeNull()
    })
    it('waits for canceled bestmove and starts only the latest requested position', () => {
        const send = vi.fn()
        const update = vi.fn()
        const engine = new UciQueue(send, update, vi.fn())
        engine.boot()
        engine.request({ key: 'a', command: 'position startpos', lineCount: 1 })
        expect(send).toHaveBeenCalledWith('uci')
        engine.receive('uciok')
        engine.receive('readyok')
        engine.receive('info depth 8 multipv 1 score cp 20 pv e2e4')
        expect(update).toHaveBeenLastCalledWith('a', expect.any(Array), false)
        engine.request({ key: 'b', command: 'position b' })
        engine.request({ key: 'c', command: 'position c', lineCount: 1 })
        update.mockClear()
        engine.receive('info depth 9 score cp 50 pv d2d4')
        expect(update).not.toHaveBeenCalled()
        expect(send).not.toHaveBeenCalledWith('position b')
        expect(send).not.toHaveBeenCalledWith('position c')
        engine.receive('bestmove e2e4')
        expect(send).toHaveBeenLastCalledWith('go movetime 900')
        expect(send).toHaveBeenCalledWith('position c')
        engine.receive('info depth 5 score cp -10 pv e7e5')
        expect(update).toHaveBeenLastCalledWith('c', [expect.objectContaining({ move: 'e7e5' })], false)
        engine.dispose()
        update.mockClear()
        engine.receive('info depth 10 score cp 30 pv c7c5\nbestmove c7c5')
        expect(update).not.toHaveBeenCalled()
    })
    it('retains a complete ranking when the next depth is interrupted', () => {
        const update = vi.fn()
        const engine = new UciQueue(vi.fn(), update, vi.fn())
        engine.receive('readyok')
        engine.request({ key: 'a', command: 'position startpos', lineCount: 2 })
        engine.receive('info depth 8 multipv 1 score cp 20 pv e2e4')
        engine.receive('info depth 8 multipv 2 score cp 10 pv d2d4')
        engine.receive('info depth 9 multipv 1 score cp 25 pv d2d4')
        engine.receive('bestmove d2d4')
        expect(update).toHaveBeenLastCalledWith(
            'a',
            [expect.objectContaining({ move: 'e2e4', depth: 8 }), expect.objectContaining({ move: 'd2d4', depth: 8 })],
            true
        )
    })
})

class FakeWorker {
    static instances: FakeWorker[] = []
    onmessage: ((event: { data: unknown }) => void) | null = null
    onerror: ((event: { preventDefault: () => void }) => void) | null = null
    onmessageerror: (() => void) | null = null
    postMessage = vi.fn()
    terminate = vi.fn()
    constructor(public url: string) {
        FakeWorker.instances.push(this)
    }
    receive(data: unknown) {
        this.onmessage?.({ data })
    }
}
afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
    FakeWorker.instances = []
})

describe('worker lifecycle', () => {
    it('rejects stale Go results, filters illegal hints and stops the worker on close', () => {
        vi.useFakeTimers()
        vi.stubGlobal('Worker', FakeWorker)
        const states: Analysis[] = []
        const engine = createEngine('go', state => states.push(state))
        const worker = FakeWorker.instances[0]
        engine.analyze(buildPosition('go', []))
        worker.receive({ type: 'katago:init_result', ok: true })
        const first = worker.postMessage.mock.calls
            .map(call => call[0])
            .findLast(message => message.type === 'katago:analyze')
        engine.analyze(buildPosition('go', ['E5']))
        const second = worker.postMessage.mock.calls
            .map(call => call[0])
            .findLast(message => message.type === 'katago:analyze')
        expect(second.id).not.toBe(first.id)
        const result = (id: number) => ({
            type: 'katago:analyze_result',
            id,
            ok: true,
            analysis: {
                rootVisits: 64,
                moves: [
                    { x: 3, y: 3, scoreLead: -2, winRate: 0.4 },
                    { x: 4, y: 4, scoreLead: 1, winRate: 0.6 },
                ],
            },
        })
        worker.receive(result(first.id))
        expect(states[states.length - 1].suggestions).toEqual([])
        worker.receive(result(second.id))
        expect(states[states.length - 1]).toMatchObject({
            key: 'go:E5',
            phase: 'ready',
            suggestions: [{ move: 'D6', score: 'W +2.0' }],
        })
        engine.dispose()
        expect(worker.terminate).toHaveBeenCalledOnce()
        expect(vi.getTimerCount()).toBe(0)
    })
    it('reports a boot timeout honestly and terminates the worker', () => {
        vi.useFakeTimers()
        vi.stubGlobal('Worker', FakeWorker)
        const publish = vi.fn()
        createEngine('go', publish)
        vi.advanceTimersByTime(120000)
        expect(publish).toHaveBeenLastCalledWith(expect.objectContaining({ phase: 'error', suggestions: [] }))
        expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce()
    })
})
