import { describe, expect, it } from 'vitest'
import {
    checkpoints,
    createGame,
    deploy,
    emptyInput,
    pause,
    stars,
    start,
    step,
    volley,
    type Raid,
    type Rift,
    type Drive,
} from './simulation'

const advance = (game: ReturnType<typeof createGame>, seconds: number, input = emptyInput()) => {
    for (let i = 0; i < seconds * 60; i++) step(game, 1 / 60, input)
}

describe('pocket raid', () => {
    it('accepts deployment only outside the village and consumes the selected army', () => {
        const game = createGame('crown') as Raid
        expect(deploy(game, { x: 20, y: 120 })).toBe(false)
        start(game)
        expect(deploy(game, { x: 180, y: 150 })).toBe(false)
        expect(game.army.barbarian).toBe(4)
        for (let i = 0; i < 4; i++) expect(deploy(game, { x: 40, y: 120 + i * 20 })).toBe(true)
        expect(deploy(game, { x: 40, y: 200 })).toBe(false)
        expect(game.troops).toHaveLength(4)
        expect(game.army.barbarian).toBe(0)
    })
    it('simulates troop movement, damage and a winnable eight-troop raid', () => {
        const game = createGame('crown') as Raid
        start(game)
        for (const kind of ['barbarian', 'archer'] as const) {
            game.selected = kind
            for (let i = 0; i < 4; i++) deploy(game, { x: i < 2 ? 45 : 315, y: 100 + (i % 2) * 55 })
        }
        const original = game.troops[0].x
        advance(game, 0.5)
        expect(game.troops[0].x).not.toBe(original)
        advance(game, 60)
        expect(game.phase).toBe('won')
        expect(stars(game)).toBe(3)
        expect(game.effects.length).toBeLessThanOrEqual(24)
    })
    it('ends a spent army as a loss instead of leaving an endless simulation', () => {
        const game = createGame('crown') as Raid
        start(game)
        game.army = { barbarian: 0, archer: 0 }
        step(game, 0.03)
        expect(game.phase).toBe('lost')
    })
})

describe('volley practice', () => {
    it('respects cooldown and allows only one hit per target from a volley', () => {
        const game = createGame('rift') as Rift
        start(game)
        game.cursor = { x: 180, y: 100 }
        expect(volley(game)).toBe(true)
        expect(volley(game)).toBe(false)
        expect(game.arrows).toHaveLength(7)
        advance(game, 0.6)
        expect(game.minions.every(m => m.hp >= 1)).toBe(true)
        advance(game, 1)
        expect(game.arrows).toHaveLength(0)
        expect(game.cooldown).toBe(0)
    })
    it('hits moving targets and finishes after six actual eliminations', () => {
        const game = createGame('rift') as Rift
        start(game)
        for (let turn = 0; turn < 32 && game.phase === 'running'; turn++) {
            const target = game.minions.find(m => m.hp > 0)
            if (target) game.cursor = { x: target.x, y: target.y }
            volley(game)
            advance(game, 1.1)
        }
        expect(game.score).toBeGreaterThanOrEqual(6)
        expect(game.phase).toBe('won')
        expect(game.arrows.length).toBeLessThanOrEqual(14)
    })
    it('clamps movement to the arena', () => {
        const game = createGame('rift') as Rift
        start(game)
        advance(game, 20, { ...emptyInput(), left: true })
        expect(game.player.x).toBe(35)
    })
})

describe('sunset drive', () => {
    it('accelerates, steers, coasts and reverses from real input', () => {
        const game = createGame('postcard') as Drive
        start(game)
        advance(game, 0.8, { ...emptyInput(), up: true })
        expect(game.car.y).toBeLessThan(218)
        expect(game.car.speed).toBeGreaterThan(0)
        const angle = game.car.angle
        advance(game, 0.2, { ...emptyInput(), right: true, up: true })
        expect(game.car.angle).toBeGreaterThan(angle)
        const speed = Math.abs(game.car.speed)
        advance(game, 0.3)
        expect(Math.abs(game.car.speed)).toBeLessThan(speed)
        advance(game, 0.6, { ...emptyInput(), down: true })
        expect(game.car.speed).toBeLessThan(0)
    })
    it('blocks buildings and keeps checkpoint order', () => {
        const game = createGame('postcard') as Drive
        start(game)
        game.car = { x: 20, y: 100, angle: -Math.PI / 2, speed: 70 }
        advance(game, 0.5, { ...emptyInput(), up: true })
        expect(game.car.y).toBeGreaterThan(85)
        game.car = { ...checkpoints[1], angle: 0, speed: 0 }
        step(game, 0.03)
        expect(game.checkpoint).toBe(0)
        for (const checkpoint of checkpoints) {
            game.car = { ...checkpoint, angle: 0, speed: 0 }
            step(game, 0.03)
        }
        expect(game.phase).toBe('won')
        expect(game.checkpoint).toBe(4)
    })
})

describe('lifecycle and bounded work', () => {
    it('does no simulation before play, while paused, or after completion', () => {
        for (const mode of ['crown', 'rift', 'postcard'] as const) {
            const game = createGame(mode)
            const initial = JSON.stringify(game)
            advance(game, 1)
            expect(JSON.stringify(game)).toBe(initial)
            start(game)
            advance(game, 0.2)
            pause(game)
            const saved = JSON.stringify(game)
            advance(game, 60)
            expect(JSON.stringify(game)).toBe(saved)
            start(game)
            step(game, 90)
            expect(game.time).toBeLessThan(0.3)
            game.phase = 'won'
            const completed = JSON.stringify(game)
            advance(game, 1)
            expect(JSON.stringify(game)).toBe(completed)
        }
    })
})
