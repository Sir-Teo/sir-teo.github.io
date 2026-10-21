export type Mode = 'crown' | 'rift' | 'postcard'
export type Point = { x: number; y: number }
export type Phase = 'ready' | 'running' | 'paused' | 'won' | 'lost'
export type Input = { left: boolean; right: boolean; up: boolean; down: boolean }
export type Effect = Point & { to?: Point; life: number; color: string }
type Base = { phase: Phase; time: number; effects: Effect[]; cursor: Point }
export type Troop = Point & { kind: 'barbarian' | 'archer'; hp: number; cooldown: number }
export type Building = Point & {
    kind: 'hall' | 'cannon' | 'gold'
    hp: number
    maxHp: number
    cooldown: number
    angle: number
}
export type Raid = Base & {
    mode: 'crown'
    selected: Troop['kind']
    army: Record<Troop['kind'], number>
    troops: Troop[]
    buildings: Building[]
}
export type Minion = Point & { home: number; hp: number; respawn: number; cast: number }
export type Arrow = Point & { vx: number; vy: number; life: number; cast: number }
export type Rift = Base & {
    mode: 'rift'
    player: Point
    minions: Minion[]
    arrows: Arrow[]
    cooldown: number
    cast: number
    score: number
    aiming: boolean
}
export type Drive = Base & {
    mode: 'postcard'
    car: Point & { angle: number; speed: number }
    checkpoint: number
    distance: number
}
export type Game = Raid | Rift | Drive
export const WIDTH = 360
export const HEIGHT = 260
export const emptyInput = (): Input => ({ left: false, right: false, up: false, down: false })
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export const checkpoints: Point[] = [
    { x: 187, y: 38 },
    { x: 310, y: 116 },
    { x: 51, y: 116 },
    { x: 187, y: 212 },
]
export const houses = [
    { x: 24, y: 29, w: 95, h: 48 },
    { x: 245, y: 25, w: 83, h: 54 },
    { x: 25, y: 165, w: 79, h: 57 },
    { x: 272, y: 170, w: 63, h: 56 },
]
export function createGame(mode: Mode): Game {
    const base: Base = { phase: 'ready', time: 0, effects: [], cursor: { x: 180, y: mode === 'crown' ? 238 : 90 } }
    if (mode === 'crown')
        return {
            ...base,
            mode,
            selected: 'barbarian',
            army: { barbarian: 4, archer: 4 },
            troops: [],
            buildings: [
                { x: 180, y: 80, kind: 'hall', hp: 125, maxHp: 125, cooldown: 0, angle: 0 },
                { x: 116, y: 143, kind: 'cannon', hp: 85, maxHp: 85, cooldown: 0.5, angle: Math.PI / 2 },
                { x: 244, y: 143, kind: 'cannon', hp: 85, maxHp: 85, cooldown: 0.9, angle: Math.PI / 2 },
                { x: 180, y: 181, kind: 'gold', hp: 70, maxHp: 70, cooldown: 0, angle: 0 },
            ],
        }
    if (mode === 'rift')
        return {
            ...base,
            mode,
            player: { x: 180, y: 221 },
            arrows: [],
            cooldown: 0,
            cast: 0,
            score: 0,
            aiming: false,
            minions: [90, 180, 270].map((home, i) => ({
                x: home,
                y: 73 + (i % 2) * 28,
                home,
                hp: 2,
                respawn: 0,
                cast: -1,
            })),
        }
    return { ...base, mode, car: { x: 187, y: 218, angle: -Math.PI / 2, speed: 0 }, checkpoint: 0, distance: 0 }
}
export function start(game: Game) {
    if (game.phase === 'ready' || game.phase === 'paused') game.phase = 'running'
}
export function pause(game: Game) {
    if (game.phase === 'running') game.phase = 'paused'
    if (game.mode === 'rift') game.aiming = false
}
export function deploy(game: Raid, point: Point): boolean {
    if (game.phase !== 'running' || !game.army[game.selected]) return false
    const { x, y } = point
    if (x > 61 && x < 299 && y > 33 && y < 221) return false
    game.army[game.selected]--
    game.troops.push({
        x: clamp(x, 12, 348),
        y: clamp(y, 12, 248),
        kind: game.selected,
        hp: game.selected === 'barbarian' ? 62 : 31,
        cooldown: 0,
    })
    return true
}
export function volley(game: Rift): boolean {
    if (game.phase !== 'running' || game.cooldown > 0) return false
    const angle = Math.atan2(game.cursor.y - game.player.y, game.cursor.x - game.player.x)
    const cast = ++game.cast
    for (let i = -3; i <= 3; i++) {
        const direction = angle + i * 0.105
        game.arrows.push({
            ...game.player,
            vx: Math.cos(direction) * 255,
            vy: Math.sin(direction) * 255,
            life: 1.25,
            cast,
        })
    }
    game.cooldown = 0.85
    game.aiming = false
    return true
}
export function stars(game: Raid) {
    const destroyed = game.buildings.filter(b => b.hp <= 0).length
    return Number(game.buildings[0].hp <= 0) + Number(destroyed >= 2) + Number(destroyed === 4)
}
function effect(game: Game, point: Point, color: string, to?: Point) {
    game.effects.push({ x: point.x, y: point.y, color, to: to && { ...to }, life: 0.25 })
    if (game.effects.length > 24) game.effects.shift()
}
function raidStep(game: Raid, dt: number) {
    for (const troop of game.troops) {
        if (troop.hp <= 0) continue
        const targets = game.buildings.filter(b => b.hp > 0).sort((a, b) => distance(troop, a) - distance(troop, b))
        const target = targets[0]
        if (!target) break
        troop.cooldown -= dt
        const gap = distance(troop, target)
        const range = troop.kind === 'archer' ? 73 : 24
        if (gap > range) {
            const travel = Math.min(gap - range, dt * (troop.kind === 'archer' ? 35 : 43))
            troop.x += ((target.x - troop.x) / gap) * travel
            troop.y += ((target.y - troop.y) / gap) * travel
        } else if (troop.cooldown <= 0) {
            target.hp = Math.max(0, target.hp - (troop.kind === 'archer' ? 14 : 23))
            troop.cooldown = troop.kind === 'archer' ? 0.8 : 0.65
            effect(game, troop, troop.kind === 'archer' ? '#f4e5b3' : '#fff4ca', target)
        }
    }
    for (const building of game.buildings) {
        if (building.kind !== 'cannon' || building.hp <= 0) continue
        building.cooldown -= dt
        const target = game.troops
            .filter(t => t.hp > 0 && distance(t, building) < 118)
            .sort((a, b) => distance(a, building) - distance(b, building))[0]
        if (!target) continue
        building.angle = Math.atan2(target.y - building.y, target.x - building.x)
        if (building.cooldown <= 0) {
            target.hp -= 12
            building.cooldown = 0.88
            effect(game, building, '#f7a866', target)
        }
    }
    game.troops = game.troops.filter(t => t.hp > 0)
    if (game.buildings.every(b => b.hp <= 0)) game.phase = 'won'
    else if (!game.troops.length && !game.army.archer && !game.army.barbarian) game.phase = 'lost'
}
function riftStep(game: Rift, dt: number, input: Input) {
    game.player.x = clamp(game.player.x + (Number(input.right) - Number(input.left)) * dt * 100, 35, 325)
    game.cooldown = Math.max(0, game.cooldown - dt)
    game.minions.forEach((minion, i) => {
        if (minion.hp <= 0) {
            minion.respawn -= dt
            if (minion.respawn <= 0) {
                minion.hp = 2
                minion.cast = -1
            }
        }
        minion.x = minion.home + Math.sin(game.time * 0.95 + i * 2) * 35
        minion.y = 73 + (i % 2) * 28 + Math.cos(game.time * 0.8 + i) * 8
    })
    for (const arrow of game.arrows) {
        arrow.x += arrow.vx * dt
        arrow.y += arrow.vy * dt
        arrow.life -= dt
        for (const minion of game.minions) {
            if (minion.hp <= 0 || minion.cast === arrow.cast || distance(arrow, minion) > 14) continue
            minion.cast = arrow.cast
            minion.hp--
            arrow.life = 0
            effect(game, minion, '#b0f2ff')
            if (minion.hp === 0) {
                game.score++
                minion.respawn = 1.8
            }
            break
        }
    }
    game.arrows = game.arrows.filter(a => a.life > 0 && a.x > 0 && a.x < WIDTH && a.y > 0 && a.y < HEIGHT)
    if (game.score >= 6) game.phase = 'won'
}
export function onRoad(point: Point) {
    return (
        (point.x >= 159 && point.x <= 215) ||
        (point.y >= 90 && point.y <= 144) ||
        distance(point, { x: 187, y: 204 }) <= 42
    )
}
function driveStep(game: Drive, dt: number, input: Input) {
    const car = game.car
    const throttle = Number(input.up) - Number(input.down)
    car.speed += (throttle * 115 - car.speed * (throttle ? 0.65 : 2.4)) * dt
    const maxSpeed = onRoad(car) ? 91 : 34
    car.speed = clamp(car.speed, -42, maxSpeed)
    if (Math.abs(car.speed) > 2)
        car.angle +=
            (Number(input.right) - Number(input.left)) *
            Math.sign(car.speed) *
            Math.min(1, Math.abs(car.speed) / 28) *
            dt *
            2.5
    const next = {
        x: clamp(car.x + Math.cos(car.angle) * car.speed * dt, 11, 349),
        y: clamp(car.y + Math.sin(car.angle) * car.speed * dt, 12, 248),
    }
    const collision = houses.some(
        h => next.x > h.x - 9 && next.x < h.x + h.w + 9 && next.y > h.y - 9 && next.y < h.y + h.h + 9
    )
    if (collision) {
        car.speed *= -0.25
        effect(game, car, '#f7d8a1')
    } else {
        game.distance += distance(car, next)
        car.x = next.x
        car.y = next.y
    }
    if (game.checkpoint < checkpoints.length && distance(car, checkpoints[game.checkpoint]) < 21) {
        effect(game, checkpoints[game.checkpoint], '#ffdf8e')
        game.checkpoint++
        if (game.checkpoint === checkpoints.length) game.phase = 'won'
    }
}
// Clamp stalled frames: backgrounding must never advance a raid or teleport a car.
export function step(game: Game, elapsed: number, input: Input = emptyInput()) {
    if (game.phase !== 'running') return
    const dt = clamp(elapsed, 0, 0.05)
    game.time += dt
    game.effects = game.effects.filter(fx => (fx.life -= dt) > 0)
    if (game.mode === 'crown') raidStep(game, dt)
    else if (game.mode === 'rift') riftStep(game, dt, input)
    else driveStep(game, dt, input)
}
export function headline(game: Game) {
    if (game.mode === 'crown') return `${stars(game)} / 3 stars · ${game.army.barbarian + game.army.archer} troops left`
    if (game.mode === 'rift') return `${Math.min(6, game.score)} / 6 targets`
    return `${game.checkpoint} / 4 checkpoints`
}
