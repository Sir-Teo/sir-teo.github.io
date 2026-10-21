export type Stone = 'black' | 'white' | null

export function neighbors(index: number, size: number): number[] {
    const x = index % size
    const y = Math.floor(index / size)
    return [
        x > 0 ? index - 1 : -1,
        x < size - 1 ? index + 1 : -1,
        y > 0 ? index - size : -1,
        y < size - 1 ? index + size : -1,
    ].filter(i => i >= 0)
}

export function groupAt(board: Stone[], start: number, size: number) {
    const stones = new Set<number>()
    const liberties = new Set<number>()
    const color = board[start]
    const visit = (index: number) => {
        if (stones.has(index)) return
        stones.add(index)
        for (const next of neighbors(index, size)) {
            if (!board[next]) liberties.add(next)
            else if (board[next] === color) visit(next)
        }
    }
    if (color) visit(start)
    return { stones, liberties }
}

// This little capture puzzle has no alternating opponent or ko position.
export function playGo(board: Stone[], index: number, size = 9) {
    if (index < 0 || index >= board.length || board[index]) return null
    const next = [...board]
    next[index] = 'black'
    const captured = new Set<number>()
    for (const adjacent of neighbors(index, size)) {
        if (next[adjacent] !== 'white') continue
        const group = groupAt(next, adjacent, size)
        if (group.liberties.size === 0) group.stones.forEach(stone => captured.add(stone))
    }
    captured.forEach(stone => {
        next[stone] = null
    })
    if (groupAt(next, index, size).liberties.size === 0) return null
    return { board: next, captured: captured.size }
}

export function goPuzzle(): Stone[] {
    const board: Stone[] = Array(81).fill(null)
    for (const index of [30, 31, 32, 38, 42, 48, 50]) board[index] = 'black'
    for (const index of [39, 40, 41]) board[index] = 'white'
    return board
}

export function rookMoves(from: number, occupied: Record<number, string>) {
    const moves: number[] = []
    const x = from % 8
    const y = Math.floor(from / 8)
    for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
    ]) {
        for (let step = 1; step < 8; step++) {
            const nx = x + dx * step
            const ny = y + dy * step
            if (nx < 0 || nx > 7 || ny < 0 || ny > 7) break
            const target = ny * 8 + nx
            if (occupied[target]) break
            moves.push(target)
        }
    }
    return moves
}

export function cannonCanCapture(from: number, target: number, occupied: Set<number>) {
    if (from === target || !occupied.has(target)) return false
    const sameRow = Math.floor(from / 9) === Math.floor(target / 9)
    const sameColumn = from % 9 === target % 9
    if (!sameRow && !sameColumn) return false
    const step = (sameRow ? 1 : 9) * Math.sign(target - from)
    let screens = 0
    for (let i = from + step; i !== target; i += step) if (occupied.has(i)) screens++
    return screens === 1
}

export type Car = { x: number; y: number; angle: number }
export type DriveKey = 'up' | 'down' | 'left' | 'right'
export const START_CAR: Car = { x: 64, y: 208, angle: 0 }
export const CITY_STOPS = [
    { x: 200, y: 48 },
    { x: 336, y: 208 },
    { x: 64, y: 48 },
]

export function onRoad(x: number, y: number) {
    return (
        x >= 42 &&
        x <= 358 &&
        y >= 26 &&
        y <= 230 &&
        (Math.abs(y - 48) <= 19 || Math.abs(y - 208) <= 19 || [64, 200, 336].some(road => Math.abs(x - road) <= 19))
    )
}

export function drive(car: Car, keys: ReadonlySet<DriveKey>, dt: number): Car {
    const turn = Number(keys.has('right')) - Number(keys.has('left'))
    const throttle = Number(keys.has('up')) - Number(keys.has('down'))
    const angle = car.angle + turn * dt * 2.6
    const distance = throttle * dt * 92
    const x = car.x + Math.cos(angle) * distance
    const y = car.y + Math.sin(angle) * distance
    return onRoad(x, y) ? { x, y, angle } : { ...car, angle }
}
