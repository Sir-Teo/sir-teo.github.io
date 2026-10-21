import { describe, expect, it } from 'vitest'
import {
    ROUTE,
    createGame,
    deploy,
    emptyInput,
    nitro,
    pause,
    project,
    stars,
    start,
    step,
    unproject,
    volley,
    type Raid,
    type Rift,
    type Drive,
} from './simulation'
const advance = (game: ReturnType<typeof createGame>, seconds: number, input = emptyInput()) => {
    for (let i = 0; i < seconds * 60; i++) step(game, 1 / 60, input)
}

describe('isometric raid', () => {
    it('maps visual taps back to the correct ground location', () => {
        for (const point of [
            { x: 42, y: 140 },
            { x: 320, y: 140 },
            { x: 180, y: 254 },
            { x: 180, y: 80 },
        ]) {
            const restored = unproject(project(point))
            expect(restored.x).toBeCloseTo(point.x)
            expect(restored.y).toBeCloseTo(point.y)
        }
    })
    it('accepts deployment only outside the village and consumes the selected army', () => {
        const game = createGame('crown') as Raid
        expect(deploy(game, { x: 20, y: 120 })).toBe(false)
        start(game)
        expect(deploy(game, { x: 180, y: 150 })).toBe(false)
        expect(game.army.barbarian).toBe(4)
        for (let i = 0; i < 4; i++) expect(deploy(game, { x: 40, y: 120 + i * 20 })).toBe(true)
        expect(deploy(game, { x: 40, y: 200 })).toBe(false)
        expect(game.troops).toHaveLength(4)
    })
    it('simulates a winnable raid with real troop movement and damage', () => {
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
        expect(game.effects.length).toBeLessThanOrEqual(32)
    })
    it('requires a spell target, damages nearby buildings and stuns defenses only once', () => {
        const game = createGame('crown') as Raid
        start(game)
        game.selected = 'spell'
        expect(deploy(game, { x: 0, y: 0 })).toBe(false)
        expect(game.spells).toBe(1)
        const cannon = game.buildings[1]
        expect(deploy(game, cannon)).toBe(true)
        expect(cannon.hp).toBe(37)
        expect(cannon.cooldown).toBe(2.5)
        expect(deploy(game, cannon)).toBe(false)
        expect(game.buildings[2].hp).toBe(85)
    })
    it('ends an exhausted army instead of leaving an endless simulation', () => {
        const game = createGame('crown') as Raid
        start(game)
        game.army = { barbarian: 0, archer: 0 }
        game.spells = 0
        step(game, 0.03)
        expect(game.phase).toBe('lost')
    })
})
describe('skillshot lab', () => {
    it('keeps volley hits and cooldown bounded, and freezes a hit target', () => {
        const game = createGame('rift') as Rift
        start(game)
        game.cursor = { x: 180, y: 100 }
        expect(volley(game)).toBe(true)
        expect(volley(game)).toBe(false)
        expect(game.arrows).toHaveLength(7)
        advance(game, 0.5)
        expect(game.minions.every(m => m.hp >= 1)).toBe(true)
        expect(game.minions.some(m => m.frozen > 0)).toBe(true)
        advance(game, 1.2)
        expect(game.arrows).toHaveLength(0)
        expect(game.cooldown).toBe(0)
    })
    it('Ashe crystal arrows eliminate targets and have an independent cooldown', () => {
        const game = createGame('rift') as Rift
        start(game)
        game.cursor = { x: 180, y: 120 }
        game.minions[1].frozen = 2
        expect(volley(game, true)).toBe(true)
        expect(volley(game, true)).toBe(false)
        expect(volley(game, false)).toBe(true)
        advance(game, 0.7)
        expect(game.score).toBeGreaterThan(0)
        expect(game.ultimateCooldown).toBeGreaterThan(3)
    })
    it('Lux laser hits along the aimed ray, without damaging targets behind the player', () => {
        const game = createGame('rift') as Rift
        start(game)
        game.champion = 'lux'
        game.cursor = { x: 180, y: 40 }
        game.minions[0].x = 180
        game.minions[0].y = 70
        game.minions[1].x = 180
        game.minions[1].y = 130
        game.minions[2].x = 180
        game.minions[2].y = 260
        volley(game, true)
        expect(game.score).toBe(2)
        expect(game.minions[2].hp).toBe(2)
        expect(game.effects.some(e => e.kind === 'beam')).toBe(true)
    })
    it('allows a complete challenge using aim and actual projectiles', () => {
        const game = createGame('rift') as Rift
        start(game)
        for (let turn = 0; turn < 45 && game.phase === 'running'; turn++) {
            const target = game.minions.find(m => m.hp > 0)
            if (target) game.cursor = { x: target.x, y: target.y }
            volley(game, game.ultimateCooldown === 0)
            advance(game, 0.85)
        }
        expect(game.score).toBeGreaterThanOrEqual(8)
        expect(game.phase).toBe('won')
        expect(game.arrows.length).toBeLessThanOrEqual(21)
    })
})
describe('coast run', () => {
    it('steers smoothly from touch or keys, supports braking, and bounds the road', () => {
        const game = createGame('postcard') as Drive
        start(game)
        game.target = 0.7
        advance(game, 1)
        expect(game.car.x).toBeGreaterThan(0.5)
        expect(game.distance).toBeGreaterThan(20)
        game.target = null
        advance(game, 0.5, { ...emptyInput(), left: true })
        expect(game.car.x).toBeLessThan(0.1)
        const speed = game.car.speed
        advance(game, 0.5, { ...emptyInput(), down: true })
        expect(game.car.speed).toBeLessThan(speed)
        advance(game, 3, { ...emptyInput(), right: true })
        expect(game.car.x).toBeLessThanOrEqual(1.08)
    })
    it('boosts with a regenerating resource and cannot repeatedly activate', () => {
        const game = createGame('postcard') as Drive
        start(game)
        expect(nitro(game)).toBe(true)
        expect(nitro(game)).toBe(false)
        advance(game, 0.8)
        expect(game.car.speed).toBeGreaterThan(135)
        advance(game, 8)
        expect(game.fuel).toBe(1)
        expect(nitro(game)).toBe(true)
    })
    it('distinguishes collisions, overtakes and close calls once per car', () => {
        const game = createGame('postcard') as Drive
        start(game)
        game.traffic = [{ lane: 0, z: 0.939, color: '#fff', passed: false }]
        step(game, 0.03)
        expect(game.hit).toBeGreaterThan(0)
        expect(game.car.speed).toBe(34)
        expect(game.overtakes).toBe(0)
        game.hit = 0
        game.car.speed = 105
        game.traffic = [{ lane: 0.35, z: 0.939, color: '#fff', passed: false }]
        step(game, 0.03)
        expect(game.near).toBe(1)
        expect(game.overtakes).toBe(1)
        advance(game, 0.2)
        expect(game.overtakes).toBe(1)
    })
    it('finishes the drive and keeps traffic bounded during a whole route', () => {
        const game = createGame('postcard') as Drive
        start(game)
        advance(game, 90)
        expect(game.phase).toBe('won')
        expect(game.distance).toBeGreaterThanOrEqual(ROUTE)
        expect(game.traffic).toHaveLength(3)
    })
})
it('does no simulation before play, while paused, or after completion', () => {
    for (const mode of ['crown', 'rift', 'postcard'] as const) {
        const game = createGame(mode),
            initial = JSON.stringify(game)
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
