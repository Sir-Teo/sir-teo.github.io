export type Mode = 'crown' | 'rift' | 'postcard'
export type Point = { x: number; y: number }
export type Phase = 'ready' | 'running' | 'paused' | 'won' | 'lost'
export type Input = { left: boolean; right: boolean; up: boolean; down: boolean }
export type Effect = Point & {
    to?: Point
    life: number
    duration: number
    color: string
    kind: 'hit' | 'shot' | 'spell' | 'beam'
}
type Base = { phase: Phase; time: number; effects: Effect[]; cursor: Point; message: string; messageTime: number }
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
    selected: Troop['kind'] | 'spell'
    army: Record<Troop['kind'], number>
    spells: number
    troops: Troop[]
    buildings: Building[]
}
export type Minion = Point & { home: number; hp: number; respawn: number; cast: number; frozen: number }
export type Arrow = Point & { vx: number; vy: number; life: number; cast: number; ultimate: boolean }
export type Rift = Base & {
    mode: 'rift'
    player: Point
    minions: Minion[]
    arrows: Arrow[]
    champion: 'ashe' | 'lux'
    cooldown: number
    ultimateCooldown: number
    ability: 'basic' | 'ultimate'
    cast: number
    score: number
    aiming: boolean
}
export type Traffic = { lane: number; z: number; color: string; passed: boolean }
export type Drive = Base & {
    mode: 'postcard'
    car: { x: number; speed: number; steer: number }
    traffic: Traffic[]
    distance: number
    overtakes: number
    near: number
    boost: number
    fuel: number
    hit: number
    target: number | null
}
export type Game = Raid | Rift | Drive
export const WIDTH = 360
export const HEIGHT = 280
export const ROUTE = 600
export const emptyInput = (): Input => ({ left: false, right: false, up: false, down: false })
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
// The raid uses logical ground coordinates; input and artwork share this projection.
export const project = (p: Point): Point => ({
    x: 180 + (p.x - 180 - (p.y - 140)) * 0.65,
    y: 148 + (p.x - 180 + p.y - 140) * 0.32,
})
export const unproject = (p: Point): Point => ({
    x: 180 + ((p.x - 180) / 0.65 + (p.y - 148) / 0.32) / 2,
    y: 140 + ((p.y - 148) / 0.32 - (p.x - 180) / 0.65) / 2,
})
export const roadCurve = (distance: number) => Math.sin(distance * 0.012) * 32 + Math.sin(distance * 0.024) * 12
export function createGame(mode: Mode): Game {
    const base: Base = {
        phase: 'ready',
        time: 0,
        effects: [],
        cursor: { x: 180, y: mode === 'crown' ? 245 : 85 },
        message: '',
        messageTime: 0,
    }
    if (mode === 'crown')
        return {
            ...base,
            mode,
            selected: 'barbarian',
            army: { barbarian: 4, archer: 4 },
            spells: 1,
            troops: [],
            buildings: [
                { x: 180, y: 80, kind: 'hall', hp: 125, maxHp: 125, cooldown: 0, angle: 0 },
                { x: 116, y: 143, kind: 'cannon', hp: 85, maxHp: 85, cooldown: 0.5, angle: Math.PI / 2 },
                { x: 244, y: 143, kind: 'cannon', hp: 85, maxHp: 85, cooldown: 0.9, angle: Math.PI / 2 },
                { x: 180, y: 199, kind: 'gold', hp: 70, maxHp: 70, cooldown: 0, angle: 0 },
            ],
        }
    if (mode === 'rift')
        return {
            ...base,
            mode,
            player: { x: 180, y: 229 },
            arrows: [],
            cooldown: 0,
            ultimateCooldown: 0,
            ability: 'basic',
            champion: 'ashe',
            cast: 0,
            score: 0,
            aiming: false,
            minions: [80, 180, 280].map((home, i) => ({
                x: home,
                y: 80 + (i % 2) * 40,
                home,
                hp: 2,
                respawn: 0,
                cast: -1,
                frozen: 0,
            })),
        }
    return {
        ...base,
        mode,
        car: { x: 0, speed: 80, steer: 0 },
        distance: 0,
        overtakes: 0,
        near: 0,
        boost: 0,
        fuel: 1,
        hit: 0,
        target: null,
        traffic: [-0.62, 0.62, 0].map((lane, i) => ({
            lane,
            z: 0.22 + i * 0.23,
            color: ['#e9ac61', '#a2bcbb', '#ca657f'][i],
            passed: false,
        })),
    }
}
export function start(game: Game) {
    if (game.phase === 'ready' || game.phase === 'paused') game.phase = 'running'
}
export function pause(game: Game) {
    if (game.phase === 'running') game.phase = 'paused'
    if (game.mode === 'rift') game.aiming = false
    if (game.mode === 'postcard') game.target = null
}
function say(game: Game, text: string) {
    game.message = text
    game.messageTime = 1.5
}
function effect(game: Game, point: Point, color: string, kind: Effect['kind'] = 'hit', to?: Point) {
    const duration = kind === 'spell' ? 0.65 : kind === 'beam' ? 0.5 : kind === 'hit' ? 0.55 : 0.28
    game.effects.push({ ...point, color, kind, to: to && { ...to }, life: duration, duration })
    if (game.effects.length > 32) game.effects.shift()
}
export function deploy(game: Raid, point: Point): boolean {
    if (game.phase !== 'running') return false
    if (game.selected === 'spell') {
        if (!game.spells) return false
        const targets = game.buildings.filter(b => b.hp > 0 && distance(b, point) < 70)
        if (!targets.length) return false
        game.spells--
        targets.forEach(b => {
            b.hp = Math.max(0, b.hp - 48)
            b.cooldown = 2.5
        })
        effect(game, point, '#d5b9ff', 'spell')
        say(game, 'LIGHTNING!')
        return true
    }
    if (!game.army[game.selected]) return false
    const { x, y } = point
    if (x > 61 && x < 299 && y > 33 && y < 231) return false
    game.army[game.selected]--
    game.troops.push({
        x: clamp(x, 12, 348),
        y: clamp(y, 12, 268),
        kind: game.selected,
        hp: game.selected === 'barbarian' ? 62 : 31,
        cooldown: 0,
    })
    effect(game, point, '#fff1a8')
    return true
}
export function stars(game: Raid) {
    const destroyed = game.buildings.filter(b => b.hp <= 0).length
    return Number(game.buildings[0].hp <= 0) + Number(destroyed >= 2) + Number(destroyed === 4)
}
function raidStep(game: Raid, dt: number) {
    const before = stars(game)
    for (const troop of game.troops) {
        if (troop.hp <= 0) continue
        const target = game.buildings.filter(b => b.hp > 0).sort((a, b) => distance(troop, a) - distance(troop, b))[0]
        if (!target) break
        troop.cooldown -= dt
        const gap = distance(troop, target),
            range = troop.kind === 'archer' ? 73 : 24
        if (gap > range) {
            const travel = Math.min(gap - range, dt * (troop.kind === 'archer' ? 42 : 51))
            troop.x += ((target.x - troop.x) / gap) * travel
            troop.y += ((target.y - troop.y) / gap) * travel
        } else if (troop.cooldown <= 0) {
            target.hp = Math.max(0, target.hp - (troop.kind === 'archer' ? 14 : 23))
            troop.cooldown = troop.kind === 'archer' ? 0.8 : 0.65
            effect(game, troop, '#ffe7a0', 'shot', target)
            if (!target.hp) effect(game, target, '#ffd078')
        }
    }
    for (const b of game.buildings) {
        if (b.kind !== 'cannon' || b.hp <= 0) continue
        b.cooldown -= dt
        const target = game.troops
            .filter(t => t.hp > 0 && distance(t, b) < 118)
            .sort((a, d) => distance(a, b) - distance(d, b))[0]
        if (!target) continue
        b.angle = Math.atan2(target.y - b.y, target.x - b.x)
        if (b.cooldown <= 0) {
            target.hp -= 12
            b.cooldown = 0.88
            effect(game, b, '#ffa259', 'shot', target)
        }
    }
    game.troops = game.troops.filter(t => t.hp > 0)
    if (stars(game) > before) say(game, `${stars(game)} STAR${stars(game) > 1 ? 'S' : ''}!`)
    if (game.buildings.every(b => b.hp <= 0)) game.phase = 'won'
    else if (!game.troops.length && !game.army.archer && !game.army.barbarian) game.phase = 'lost'
}
function hitMinion(game: Rift, minion: Minion, cast: number, damage: number, frozen: number) {
    if (minion.hp <= 0 || minion.cast === cast) return
    minion.cast = cast
    minion.hp = Math.max(0, minion.hp - damage)
    minion.frozen = frozen
    effect(game, minion, game.champion === 'ashe' ? '#b1efff' : '#fff1af')
    if (!minion.hp) {
        game.score++
        minion.respawn = 1.3
        say(game, game.score > 1 ? `${game.score} TAKEDOWNS` : 'FIRST BLOOD')
    } else if (frozen) say(game, game.champion === 'ashe' ? 'FROZEN' : 'ROOTED')
}
export function volley(game: Rift, ultimate = game.ability === 'ultimate'): boolean {
    if (game.phase !== 'running' || (ultimate ? game.ultimateCooldown : game.cooldown) > 0) return false
    const angle = Math.atan2(game.cursor.y - game.player.y, game.cursor.x - game.player.x),
        cast = ++game.cast
    if (ultimate && game.champion === 'lux') {
        const end = { x: game.player.x + Math.cos(angle) * 410, y: game.player.y + Math.sin(angle) * 410 }
        effect(game, game.player, '#fff2b5', 'beam', end)
        for (const m of game.minions) {
            const dx = m.x - game.player.x,
                dy = m.y - game.player.y
            if (
                dx * Math.cos(angle) + dy * Math.sin(angle) > 0 &&
                Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle)) < 22
            )
                hitMinion(game, m, cast, 2, 0)
        }
        say(game, 'FINAL SPARK')
    } else {
        const spread = !ultimate && game.champion === 'ashe' ? 3 : 0
        for (let i = -spread; i <= spread; i++) {
            const direction = angle + i * 0.1
            game.arrows.push({
                ...game.player,
                vx: Math.cos(direction) * (ultimate ? 240 : 270),
                vy: Math.sin(direction) * (ultimate ? 240 : 270),
                life: 1.6,
                cast,
                ultimate,
            })
        }
    }
    if (ultimate) game.ultimateCooldown = 3.8
    else game.cooldown = 0.65
    game.aiming = false
    return true
}
function riftStep(game: Rift, dt: number, input: Input) {
    game.player.x = clamp(game.player.x + (Number(input.right) - Number(input.left)) * dt * 120, 35, 325)
    game.cooldown = Math.max(0, game.cooldown - dt)
    game.ultimateCooldown = Math.max(0, game.ultimateCooldown - dt)
    game.minions.forEach((m, i) => {
        if (m.hp <= 0) {
            m.respawn -= dt
            if (m.respawn <= 0) {
                m.hp = 2
                m.cast = -1
            }
        }
        m.frozen = Math.max(0, m.frozen - dt)
        if (!m.frozen) {
            m.x = m.home + Math.sin(game.time * 0.95 + i * 2) * 32
            m.y = 80 + (i % 2) * 40 + Math.cos(game.time * 0.8 + i) * 10
        }
    })
    for (const arrow of game.arrows) {
        arrow.x += arrow.vx * dt
        arrow.y += arrow.vy * dt
        arrow.life -= dt
        for (const m of game.minions) {
            if (m.hp <= 0 || m.cast === arrow.cast || distance(arrow, m) > (arrow.ultimate ? 23 : 15)) continue
            hitMinion(game, m, arrow.cast, arrow.ultimate ? 2 : 1, game.champion === 'lux' ? 1.8 : 0.65)
            if (arrow.ultimate || game.champion === 'ashe') arrow.life = 0
            break
        }
    }
    game.arrows = game.arrows.filter(a => a.life > 0 && a.x > -20 && a.x < WIDTH + 20 && a.y > -20 && a.y < HEIGHT)
    if (game.score >= 8) game.phase = 'won'
}
export function nitro(game: Drive) {
    if (game.phase !== 'running' || game.fuel < 0.98 || game.boost > 0) return false
    game.fuel = 0
    game.boost = 2.5
    say(game, 'NITRO')
    return true
}
function driveStep(game: Drive, dt: number, input: Input) {
    const car = game.car
    game.boost = Math.max(0, game.boost - dt)
    game.hit = Math.max(0, game.hit - dt)
    game.fuel = Math.min(1, game.fuel + dt * 0.12)
    const desired = game.hit ? 36 : input.down ? 52 : game.boost ? 170 : 105
    car.speed += (desired - car.speed) * Math.min(1, dt * 1.7)
    const direction = Number(input.right) - Number(input.left)
    const steer = direction || (game.target === null ? 0 : clamp((game.target - car.x) * 3, -1, 1))
    car.steer += (steer - car.steer) * Math.min(1, dt * 10)
    car.x = clamp(car.x + steer * dt * 1.3, -1.08, 1.08)
    if (Math.abs(car.x) > 0.94) car.speed -= dt * 40
    game.distance += (car.speed * dt) / 3.6
    for (const traffic of game.traffic) {
        traffic.z += ((car.speed - 28) * dt) / 470
        if (traffic.z >= 0.94 && !traffic.passed) {
            traffic.passed = true
            const gap = Math.abs(car.x - traffic.lane)
            if (gap < 0.25) {
                game.hit = 0.8
                car.speed = 34
                game.boost = 0
                say(game, 'EASY ON THE PAINT')
            } else {
                game.overtakes++
                if (gap < 0.48) {
                    game.near++
                    say(game, 'CLOSE CALL +1')
                }
            }
        }
        if (traffic.z > 1.16) {
            traffic.z = 0.06
            traffic.passed = false
            traffic.lane = [-0.62, 0, 0.62][
                (game.overtakes + Math.floor(game.distance / 75) + Math.round(traffic.z * 10)) % 3
            ]
        }
    }
    if (game.distance >= ROUTE) game.phase = 'won'
}
// Never catch up hidden-tab time. Every loop and transient collection is bounded.
export function step(game: Game, elapsed: number, input: Input = emptyInput()) {
    if (game.phase !== 'running') return
    const dt = clamp(elapsed, 0, 0.05)
    game.time += dt
    game.messageTime = Math.max(0, game.messageTime - dt)
    game.effects = game.effects.filter(fx => (fx.life -= dt) > 0)
    if (game.mode === 'crown') raidStep(game, dt)
    else if (game.mode === 'rift') riftStep(game, dt, input)
    else driveStep(game, dt, input)
}
export function headline(game: Game) {
    if (game.mode === 'crown') return `${stars(game)} / 3 stars`
    if (game.mode === 'rift') return `${Math.min(8, game.score)} / 8 takedowns`
    return `${Math.min(ROUTE, Math.floor(game.distance))} / ${ROUTE} m`
}
