import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { evaluationText, graphPath, type ReviewGame, type ReviewScene } from './review'
const read = (scene: ReviewScene) =>
    JSON.parse(readFileSync(`public/previews/reviews/${scene}.json`, 'utf8')) as ReviewGame

describe('recorded game reviews', () => {
    it('keeps the Go record’s outgoing move aligned with the following position', () => {
        const game = read('go'),
            frame = game.frames[37]
        expect(frame.label).toBe('37. Black J3')
        expect(frame.last).toEqual([8, 6])
        expect(frame.board[6][8]).toBe('x')
        expect(frame.planted).toBe(true)
        expect(frame.quality).toBe('Blunder')
        expect(evaluationText('go', frame)).toBe('White +3.7 points')
        expect(evaluationText('go', frame.lines[0], true)).toBe('W +4.2')
        expect(evaluationText('go', frame.lines[1], true)).toBe('B +3.6')
    })
    it('preserves terminal winners and score perspective for both chess games', () => {
        const chess = read('chess'),
            xiangqi = read('xiangqi')
        expect(chess.frames[38].label).toBe('19… Kf8')
        expect(chess.frames[38].quality).toBe('Blunder')
        expect(evaluationText('chess', chess.frames.at(-1)!)).toBe('White wins')
        expect(evaluationText('xiangqi', xiangqi.frames.at(-1)!)).toBe('Black wins')
        expect(chess.frames.at(-1)!.lines).toEqual([])
        expect(xiangqi.frames.at(-1)!.lines).toEqual([])
    })
    it('keeps every timeline position and suggested move inside its board', () => {
        for (const scene of ['chess', 'xiangqi', 'go'] as const) {
            const game = read(scene),
                width = scene === 'chess' ? 8 : 9,
                height = scene === 'xiangqi' ? 10 : width
            expect(game.start).toBeLessThan(game.frames.length)
            expect(graphPath(game.frames)).not.toMatch(/NaN|Infinity/)
            for (const frame of game.frames) {
                expect(frame.board).toHaveLength(height)
                expect(frame.board.every(row => row.length === width)).toBe(true)
                expect(frame.balance).toBeGreaterThanOrEqual(0)
                expect(frame.balance).toBeLessThanOrEqual(100)
                for (const line of frame.lines)
                    for (const move of line.moves)
                        if (move) {
                            for (let i = 0; i < move.length; i++) {
                                expect(move[i]).toBeGreaterThanOrEqual(0)
                                expect(move[i]).toBeLessThan(i % 2 ? height : width)
                            }
                        }
            }
        }
    })
})
