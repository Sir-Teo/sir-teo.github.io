import {
    checkpoints,
    houses,
    HEIGHT,
    WIDTH,
    type Game,
    type Raid,
    type Rift,
    type Drive,
    type Point,
} from './simulation'

type Ctx = CanvasRenderingContext2D
const circle = (c: Ctx, x: number, y: number, r: number, fill: string) => {
    c.fillStyle = fill
    c.beginPath()
    c.arc(x, y, r, 0, Math.PI * 2)
    c.fill()
}
const box = (c: Ctx, x: number, y: number, w: number, h: number, fill: string | CanvasGradient, radius = 0) => {
    c.fillStyle = fill
    c.beginPath()
    c.roundRect(x, y, w, h, radius)
    c.fill()
}
function path(c: Ctx, points: number[][], fill: string, stroke?: string) {
    c.beginPath()
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
    c.closePath()
    c.fillStyle = fill
    c.fill()
    if (stroke) {
        c.strokeStyle = stroke
        c.lineWidth = 1
        c.stroke()
    }
}
function line(c: Ctx, a: Point, b: Point, color: string, width = 1) {
    c.strokeStyle = color
    c.lineWidth = width
    c.beginPath()
    c.moveTo(a.x, a.y)
    c.lineTo(b.x, b.y)
    c.stroke()
}
function label(c: Ctx, text: string, x: number, y: number, color: string, size = 8) {
    c.fillStyle = color
    c.font = `500 ${size}px ui-monospace, monospace`
    c.textAlign = 'center'
    c.fillText(text, x, y)
}
function health(c: Ctx, x: number, y: number, fraction: number, width = 25) {
    box(c, x - width / 2, y, width, 3, '#142f36aa', 1)
    box(c, x - width / 2, y, width * Math.max(0, fraction), 3, '#b7de83', 1)
}
function pine(c: Ctx, x: number, y: number, size: number, color: string) {
    path(
        c,
        [
            [x, y - size],
            [x + size * 0.65, y + size * 0.5],
            [x - size * 0.65, y + size * 0.5],
        ],
        color
    )
    path(
        c,
        [
            [x, y - size * 0.6],
            [x + size * 0.82, y + size],
            [x - size * 0.82, y + size],
        ],
        color
    )
}
function raid(c: Ctx, game: Raid) {
    box(c, 0, 0, WIDTH, HEIGHT, '#c9d4a7')
    // Quiet paper-like field; all marks are generated, with no texture downloads.
    for (let i = 0; i < 78; i++) {
        const x = (i * 67 + 12) % WIDTH,
            y = (i * 43 + 8) % HEIGHT
        line(c, { x, y }, { x: x + 2, y: y - 3 }, '#a3b881', 0.7)
    }
    box(c, 64, 36, 232, 184, '#a5bc88', 28)
    box(c, 84, 52, 192, 153, '#d5cfaa', 19)
    for (let i = 0; i < 5; i++) {
        box(c, 165, 58 + i * 29, 30, 25, '#e0d7b5', 3)
        line(c, { x: 96 + i * 34, y: 142 }, { x: 125 + i * 34, y: 142 }, '#e0d7b5', 16)
    }
    c.setLineDash([4, 6])
    c.strokeStyle = '#5f805c80'
    c.lineWidth = 1
    c.strokeRect(61, 33, 238, 188)
    c.setLineDash([])
    for (const [x, y] of [
        [30, 48],
        [332, 207],
        [27, 190],
        [331, 45],
    ]) {
        circle(c, x + 2, y + 5, 14, '#718a5d30')
        pine(c, x, y, 14, '#709065')
        pine(c, x - 3, y - 2, 9, '#87a878')
    }
    // Stone boundary and two open entrances.
    for (let i = 0; i < 7; i++) {
        if (i !== 3) {
            box(c, 88 + i * 28, 53, 19, 7, '#8e987b', 2)
            box(c, 88 + i * 28, 199, 19, 7, '#8e987b', 2)
        }
    }
    for (const b of game.buildings) {
        if (b.hp <= 0) {
            circle(c, b.x, b.y + 5, 19, '#a2967b')
            for (let i = 0; i < 5; i++) box(c, b.x - 17 + i * 7, b.y + (i % 2) * 6, 7, 5, '#c3baa0', 2)
            continue
        }
        box(c, b.x - 23, b.y - 10, 49, 32, '#53684f26', 5)
        if (b.kind === 'hall') {
            box(c, b.x - 23, b.y - 13, 46, 34, '#f1dcaa', 3)
            box(c, b.x - 22, b.y + 15, 44, 6, '#b09a70', 1)
            path(
                c,
                [
                    [b.x - 29, b.y - 12],
                    [b.x, b.y - 36],
                    [b.x + 29, b.y - 12],
                ],
                '#a65e48',
                '#7b5142'
            )
            path(
                c,
                [
                    [b.x - 20, b.y - 13],
                    [b.x, b.y - 30],
                    [b.x + 20, b.y - 13],
                ],
                '#cf8560'
            )
            box(c, b.x - 7, b.y + 3, 14, 18, '#715d43', 6)
            box(c, b.x - 18, b.y - 3, 7, 8, '#ae945d', 1)
            box(c, b.x + 11, b.y - 3, 7, 8, '#ae945d', 1)
            line(c, { x: b.x, y: b.y - 33 }, { x: b.x, y: b.y - 48 }, '#746348', 2)
            path(
                c,
                [
                    [b.x, b.y - 48],
                    [b.x + 15, b.y - 43],
                    [b.x, b.y - 39],
                ],
                '#b65c54'
            )
        } else if (b.kind === 'cannon') {
            box(c, b.x - 18, b.y - 13, 36, 29, '#8c9281', 5)
            box(c, b.x - 15, b.y - 16, 30, 27, '#e1d9b9', 5)
            circle(c, b.x, b.y, 12, '#665e49')
            circle(c, b.x, b.y - 2, 10, '#414d48')
            c.save()
            c.translate(b.x, b.y - 2)
            c.rotate(b.angle)
            box(c, 0, -6, 24, 12, '#344441', 3)
            box(c, 7, -5, 14, 3, '#71847a', 1)
            box(c, 22, -7, 4, 14, '#263834', 1)
            c.restore()
        } else {
            box(c, b.x - 20, b.y - 15, 40, 30, '#a98047', 3)
            box(c, b.x - 23, b.y - 19, 46, 10, '#9a6f3e', 3)
            box(c, b.x - 16, b.y - 12, 32, 24, '#e1b65c', 2)
            for (const dx of [-10, 0, 10]) {
                circle(c, b.x + dx, b.y + 1, 6, '#f5d079')
                circle(c, b.x + dx, b.y - 3, 6, '#ffe39b')
            }
            box(c, b.x - 22, b.y + 10, 44, 5, '#8a673e', 1)
        }
        if (b.hp < b.maxHp) health(c, b.x, b.y + 25, b.hp / b.maxHp, 36)
    }
    for (const t of game.troops) {
        circle(c, t.x + 1, t.y + 5, 6, '#294c3d28')
        box(c, t.x - 4, t.y - 1, 8, 9, t.kind === 'archer' ? '#6e587b' : '#9a6b45', 2)
        circle(c, t.x, t.y - 4, 5, '#f6d2aa')
        path(
            c,
            [
                [t.x - 5, t.y - 4],
                [t.x - 4, t.y - 9],
                [t.x + 4, t.y - 9],
                [t.x + 5, t.y - 3],
            ],
            t.kind === 'archer' ? '#b17eaf' : '#edcd60'
        )
        line(c, { x: t.x + 6, y: t.y + 2 }, { x: t.x + 8, y: t.y - 7 }, t.kind === 'archer' ? '#886341' : '#e5e6d1', 2)
        if (t.hp < (t.kind === 'archer' ? 31 : 62)) health(c, t.x, t.y - 14, t.hp / (t.kind === 'archer' ? 31 : 62), 14)
    }
    if (game.phase === 'running') {
        const p = game.cursor
        c.strokeStyle = '#496950'
        c.lineWidth = 1.2
        c.setLineDash([3, 3])
        c.beginPath()
        c.arc(p.x, p.y, 11, 0, Math.PI * 2)
        c.stroke()
        c.setLineDash([])
        if (!game.troops.length) label(c, 'DEPLOY ALONG THE EDGE', 180, 247, '#4e674c', 9)
    }
}
function rift(c: Ctx, game: Rift) {
    const wash = c.createLinearGradient(0, 0, WIDTH, HEIGHT)
    wash.addColorStop(0, '#112f37')
    wash.addColorStop(1, '#17353e')
    box(c, 0, 0, WIDTH, HEIGHT, wash)
    path(
        c,
        [
            [0, 104],
            [37, 74],
            [91, 119],
            [59, 168],
            [12, 191],
            [0, 175],
        ],
        '#245362'
    )
    for (let i = 0; i < 7; i++) line(c, { x: 4, y: 119 + i * 9 }, { x: 40 + i * 2, y: 103 + i * 9 }, '#3f738055', 1)
    path(
        c,
        [
            [49, 260],
            [112, 0],
            [271, 0],
            [323, 260],
        ],
        '#51605c'
    )
    path(
        c,
        [
            [69, 260],
            [129, 0],
            [254, 0],
            [300, 260],
        ],
        '#66736a'
    )
    for (let row = 0; row < 7; row++)
        for (let col = 0; col < 4; col++) {
            const x = 99 + col * 41 + (row % 2) * 7,
                y = row * 39
            path(
                c,
                [
                    [x, y],
                    [x + 35, y + 2],
                    [x + 32, y + 32],
                    [x - 4, y + 29],
                ],
                (col + row) % 2 ? '#718075' : '#768278'
            )
        }
    for (let i = 0; i < 9; i++) {
        pine(c, 15 + (i % 3) * 23, 15 + Math.floor(i / 3) * 83, 22, '#173d3b')
        pine(c, 308 + (i % 2) * 25, 28 + i * 26, 23, '#1d4541')
    }
    // A turret silhouette, crystal and lane banners give the drill its setting.
    box(c, 304, 26, 29, 31, '#5c6a68', 3)
    path(
        c,
        [
            [300, 27],
            [318, 10],
            [337, 27],
        ],
        '#87958a'
    )
    path(
        c,
        [
            [318, 0],
            [325, 11],
            [318, 25],
            [311, 11],
        ],
        '#ca757c'
    )
    for (const x of [86, 278]) {
        line(c, { x, y: 135 }, { x, y: 171 }, '#b8a679', 2)
        path(
            c,
            [
                [x, 137],
                [x + (x < 180 ? -15 : 15), 139],
                [x + (x < 180 ? -11 : 11), 154],
                [x, 151],
            ],
            '#487889'
        )
    }
    if (game.aiming && game.phase === 'running') {
        const angle = Math.atan2(game.cursor.y - game.player.y, game.cursor.x - game.player.x)
        const a = { x: game.player.x + Math.cos(angle - 0.315) * 200, y: game.player.y + Math.sin(angle - 0.315) * 200 }
        const b = { x: game.player.x + Math.cos(angle + 0.315) * 200, y: game.player.y + Math.sin(angle + 0.315) * 200 }
        path(
            c,
            [
                [game.player.x, game.player.y],
                [a.x, a.y],
                [b.x, b.y],
            ],
            '#9ce8ed1a'
        )
        line(c, game.player, game.cursor, '#b9eeee90', 1)
    }
    for (const m of game.minions) {
        if (m.hp <= 0) continue
        circle(c, m.x, m.y + 9, 12, '#102d343b')
        path(
            c,
            [
                [m.x - 9, m.y - 3],
                [m.x + 9, m.y - 3],
                [m.x + 11, m.y + 10],
                [m.x - 11, m.y + 10],
            ],
            '#9f565e'
        )
        circle(c, m.x, m.y - 4, 8, '#c4b3a0')
        box(c, m.x - 8, m.y - 8, 16, 6, '#747e7c', 3)
        path(
            c,
            [
                [m.x - 3, m.y - 8],
                [m.x, m.y - 17],
                [m.x + 3, m.y - 8],
            ],
            '#d98891'
        )
        line(c, { x: m.x - 4, y: m.y - 2 }, { x: m.x + 4, y: m.y - 2 }, '#2d4149', 2)
        health(c, m.x, m.y - 23, m.hp / 2, 24)
    }
    const p = game.player
    circle(c, p.x, p.y + 7, 14, '#122f3b44')
    path(
        c,
        [
            [p.x - 7, p.y - 4],
            [p.x + 7, p.y - 4],
            [p.x + 12, p.y + 15],
            [p.x, p.y + 11],
            [p.x - 12, p.y + 15],
        ],
        '#79b7c8'
    )
    path(
        c,
        [
            [p.x, p.y - 8],
            [p.x + 5, p.y + 8],
            [p.x - 6, p.y + 10],
        ],
        '#d3e5dc'
    )
    circle(c, p.x, p.y - 8, 5, '#e4d6bb')
    path(
        c,
        [
            [p.x - 7, p.y - 4],
            [p.x - 6, p.y - 14],
            [p.x + 5, p.y - 14],
            [p.x + 7, p.y - 3],
            [p.x + 2, p.y - 10],
        ],
        '#c3e2df'
    )
    c.strokeStyle = '#c1f1f2'
    c.lineWidth = 2
    c.beginPath()
    c.arc(p.x, p.y - 4, 18, Math.PI * 1.12, Math.PI * 1.88)
    c.stroke()
    line(c, { x: p.x - 16, y: p.y - 11 }, { x: p.x + 16, y: p.y - 11 }, '#d6f3e0', 0.8)
    for (const a of game.arrows) {
        const length = Math.hypot(a.vx, a.vy)
        line(c, { x: a.x - (a.vx / length) * 14, y: a.y - (a.vy / length) * 14 }, a, '#b2f2ff', 2)
        circle(c, a.x, a.y, 2, '#ecffff')
    }
}
function palm(c: Ctx, x: number, y: number, size: number) {
    line(c, { x: x + 3, y: y + size }, { x, y }, '#7c765b', 3)
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        path(
            c,
            [
                [x, y],
                [x + Math.cos(angle + 0.24) * size * 0.6, y + Math.sin(angle + 0.24) * size * 0.6],
                [x + Math.cos(angle) * size, y + Math.sin(angle) * size],
                [x + Math.cos(angle - 0.24) * size * 0.6, y + Math.sin(angle - 0.24) * size * 0.6],
            ],
            i % 2 ? '#4e7864' : '#65866a'
        )
    }
}
function drive(c: Ctx, game: Drive) {
    box(c, 0, 0, WIDTH, HEIGHT, '#d6b999')
    box(c, 0, 83, 360, 68, '#e8ceb1')
    box(c, 152, 0, 70, 260, '#e8ceb1')
    circle(c, 187, 204, 49, '#e8ceb1')
    box(c, 0, 90, 360, 54, '#686d70')
    box(c, 159, 0, 56, 260, '#686d70')
    circle(c, 187, 204, 42, '#686d70')
    c.setLineDash([9, 9])
    line(c, { x: 0, y: 116 }, { x: 360, y: 116 }, '#dcce91', 1)
    line(c, { x: 187, y: 0 }, { x: 187, y: 190 }, '#dcce91', 1)
    c.setLineDash([])
    box(c, 162, 93, 50, 48, '#686d70')
    for (let i = 0; i < 4; i++) {
        box(c, 142, 96 + i * 11, 5, 6, '#d0c8b8')
        box(c, 226, 96 + i * 11, 5, 6, '#d0c8b8')
    }
    houses.forEach((h, i) => {
        box(c, h.x + 4, h.y + 8, h.w, h.h, '#907f683b', 3)
        box(c, h.x, h.y, h.w, h.h, ['#b8957b', '#9d9c86', '#ac957a', '#bfad87'][i], 2)
        box(c, h.x + 3, h.y + 3, h.w - 6, h.h - 6, ['#d1b596', '#b5b49b', '#c6ab8a', '#dcc29e'][i], 1)
        line(c, { x: h.x + 7, y: h.y + h.h / 2 }, { x: h.x + h.w - 7, y: h.y + h.h / 2 }, '#95826b', 2)
        box(c, h.x + 12, h.y + 7, 14, 10, '#96a4a0', 1)
        box(c, h.x + h.w - 22, h.y + 8, 10, 9, '#e4c8a1', 1)
        box(c, h.x + h.w / 2 - 10, h.y + h.h - 4, 20, 8, '#a78f75')
    })
    for (const [x, y, size] of [
        [135, 45, 18],
        [239, 205, 18],
        [17, 237, 14],
        [339, 151, 15],
        [7, 58, 15],
    ])
        palm(c, x, y, size)
    box(c, 245, 155, 15, 8, '#a17d69', 2)
    box(c, 246, 156, 12, 5, '#e3c5a3', 1)
    label(c, 'GROVE STREET', 73, 137, '#d8d1c4', 7)
    label(c, 'LOS SANTOS', 286, 249, '#8c7660', 7)
    const point = checkpoints[game.checkpoint]
    if (point) {
        circle(c, point.x, point.y, 19, '#f9df7f25')
        c.strokeStyle = '#f4dc8d'
        c.lineWidth = 2
        c.beginPath()
        c.arc(point.x, point.y, 17, 0, Math.PI * 2)
        c.stroke()
        label(c, String(game.checkpoint + 1), point.x, point.y + 4, '#fff1b6', 12)
    }
    c.save()
    c.translate(game.car.x, game.car.y)
    c.rotate(game.car.angle + Math.PI / 2)
    box(c, -10, -16, 23, 38, '#253b3d33', 5)
    box(c, -11, -10, 4, 9, '#304040', 1)
    box(c, 7, -10, 4, 9, '#304040', 1)
    box(c, -11, 10, 4, 9, '#304040', 1)
    box(c, 7, 10, 4, 9, '#304040', 1)
    box(c, -9, -20, 18, 40, '#d9e3c5', 4)
    box(c, -8, -18, 16, 35, '#719c85', 3)
    box(c, -6, -9, 12, 19, '#d0d2b4', 3)
    path(
        c,
        [
            [-6, -7],
            [6, -7],
            [5, -2],
            [-5, -2],
        ],
        '#42666c'
    )
    path(
        c,
        [
            [-5, 5],
            [5, 5],
            [6, 9],
            [-6, 9],
        ],
        '#527879'
    )
    box(c, -8, -19, 5, 2, '#fff1b7', 1)
    box(c, 3, -19, 5, 2, '#fff1b7', 1)
    box(c, -8, 17, 4, 2, '#b46656')
    box(c, 4, 17, 4, 2, '#b46656')
    c.restore()
}
export function draw(c: Ctx, game: Game, reducedMotion: boolean) {
    c.save()
    c.setTransform(c.canvas.width / WIDTH, 0, 0, c.canvas.height / HEIGHT, 0, 0)
    c.lineCap = 'round'
    c.lineJoin = 'round'
    if (game.mode === 'crown') raid(c, game)
    else if (game.mode === 'rift') rift(c, game)
    else drive(c, game)
    if (!reducedMotion)
        for (const fx of game.effects) {
            c.globalAlpha = Math.max(0, fx.life / 0.25)
            if (fx.to) line(c, fx, fx.to, fx.color, 2)
            else {
                c.strokeStyle = fx.color
                c.lineWidth = 2
                c.beginPath()
                c.arc(fx.x, fx.y, 7 + (1 - fx.life / 0.25) * 12, 0, Math.PI * 2)
                c.stroke()
            }
        }
    c.restore()
}
