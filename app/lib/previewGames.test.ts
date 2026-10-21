import { describe, expect, it } from 'vitest'
import {
    cannonCanCapture,
    drive,
    goPuzzle,
    groupAt,
    neighbors,
    onRoad,
    playGo,
    rookMoves,
    START_CAR,
    type Stone,
    type DriveKey,
} from './previewGames'

describe('Go capture puzzle', () => {
    it('captures the connected white group at its last liberty without mutating the puzzle', () => {
        const board = goPuzzle()
        expect(Array.from(groupAt(board, 40, 9).liberties)).toEqual([49])
        const result = playGo(board, 49)!
        expect(result.captured).toBe(3)
        expect([39, 40, 41].map(i => result.board[i])).toEqual([null, null, null])
        expect(result.board[49]).toBe('black')
        expect(board[40]).toBe('white')
        expect(board[49]).toBeNull()
    })
    it('rejects occupied intersections and suicide, but permits a capture that creates a liberty', () => {
        expect(playGo(goPuzzle(), 40)).toBeNull()
        const surrounded: Stone[] = [null, 'white', null, 'white', null, 'white', null, 'white', null]
        expect(playGo(surrounded, 4, 3)).toBeNull()
        const capturing: Stone[] = ['black', 'white', 'black', 'white', null, 'white', 'black', 'white', 'black']
        expect(playGo(capturing, 4, 3)?.captured).toBe(4)
    })
    it('keeps edge neighbors on the board without wrapping between rows', () => {
        expect(neighbors(8, 9).sort((a, b) => a - b)).toEqual([7, 17])
        expect(neighbors(72, 9).sort((a, b) => a - b)).toEqual([63, 73])
    })
})

describe('board movement', () => {
    it('lets the rook reach the mating square, but never jump the king or move diagonally', () => {
        const moves = rookMoves(60, { 60: 'rook', 62: 'king' })
        expect(moves).toContain(4)
        expect(moves).toContain(61)
        expect(moves).not.toContain(62)
        expect(moves).not.toContain(63)
        expect(moves).not.toContain(51)
    })
    it('requires exactly one occupied screen for the cannon capture', () => {
        expect(cannonCanCapture(67, 13, new Set([13, 40, 67]))).toBe(true)
        expect(cannonCanCapture(67, 13, new Set([13, 67]))).toBe(false)
        expect(cannonCanCapture(67, 13, new Set([13, 40, 49, 67]))).toBe(false)
        expect(cannonCanCapture(67, 14, new Set([14, 40, 67]))).toBe(false)
        expect(cannonCanCapture(67, 13, new Set([40, 67]))).toBe(false)
    })
})

describe('pocket driving', () => {
    it('drives, reverses, and turns using elapsed time', () => {
        expect(drive(START_CAR, new Set<DriveKey>(['up']), 0.04).x).toBeCloseTo(67.68)
        expect(drive(START_CAR, new Set<DriveKey>(['down']), 0.04).x).toBeCloseTo(60.32)
        expect(drive(START_CAR, new Set<DriveKey>(['right']), 0.04).angle).toBeCloseTo(0.104)
        expect(drive(START_CAR, new Set(), 0.04)).toEqual(START_CAR)
    })
    it('stops at buildings and map boundaries while leaving steering available', () => {
        expect(onRoad(130, 125)).toBe(false)
        expect(onRoad(200, 125)).toBe(true)
        const edge = { x: 357, y: 208, angle: 0 }
        const stopped = drive(edge, new Set<DriveKey>(['up', 'left']), 0.04)
        expect(stopped.x).toBe(357)
        expect(stopped.angle).toBeLessThan(0)
    })
})
