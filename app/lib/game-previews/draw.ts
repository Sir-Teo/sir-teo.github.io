import {
    HEIGHT,
    WIDTH,
    ROUTE,
    project,
    roadCurve,
    stars,
    type Game,
    type Raid,
    type Rift,
    type Drive,
    type Point,
} from './simulation'
type Ctx = CanvasRenderingContext2D
const circle = (c: Ctx, x: number, y: number, r: number, color: string | CanvasGradient) => {
    c.fillStyle = color
    c.beginPath()
    c.arc(x, y, Math.max(0, r), 0, Math.PI * 2)
    c.fill()
}
const box = (c: Ctx, x: number, y: number, w: number, h: number, color: string | CanvasGradient, radius = 0) => {
    c.fillStyle = color
    c.beginPath()
    c.roundRect(x, y, Math.max(0, w), Math.max(0, h), radius)
    c.fill()
}
function polygon(c: Ctx, points: number[][], color: string) {
    c.fillStyle = color
    c.beginPath()
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
    c.closePath()
    c.fill()
}
function line(c: Ctx, a: Point, b: Point, color: string, width = 1) {
    c.strokeStyle = color
    c.lineWidth = width
    c.beginPath()
    c.moveTo(a.x, a.y)
    c.lineTo(b.x, b.y)
    c.stroke()
}
function text(c: Ctx, value: string, x: number, y: number, color: string, size = 9, font = 'ui-monospace, monospace') {
    c.fillStyle = color
    c.font = `600 ${size}px ${font}`
    c.textAlign = 'center'
    c.fillText(value, x, y)
}
function ellipse(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
    c.fillStyle = color
    c.beginPath()
    c.ellipse(x, y, w, h, 0, 0, Math.PI * 2)
    c.fill()
}
function glow(c: Ctx, x: number, y: number, radius: number, color: string) {
    const g = c.createRadialGradient(x, y, 0, x, y, radius)
    g.addColorStop(0, color)
    g.addColorStop(1, color.slice(0, 7) + '00')
    circle(c, x, y, radius, g)
}
function health(c: Ctx, x: number, y: number, fraction: number, w = 27, color = '#a7ec77') {
    box(c, x - w / 2, y, w, 3, '#152b39b0', 1.5)
    box(c, x - w / 2, y, w * Math.max(0, fraction), 3, color, 1.5)
}
function star(c: Ctx, x: number, y: number, size: number, color: string) {
    polygon(
        c,
        Array.from({ length: 10 }, (_, i) => [
            x + Math.sin((i * Math.PI) / 5) * (i % 2 ? size * 0.45 : size),
            y - Math.cos((i * Math.PI) / 5) * (i % 2 ? size * 0.45 : size),
        ]),
        color
    )
}
function ground(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
    polygon(
        c,
        [
            [x, y],
            [x + w, y],
            [x + w, y + h],
            [x, y + h],
        ].map(([a, b]) => {
            const p = project({ x: a, y: b })
            return [p.x, p.y]
        }),
        color
    )
}
function block(c: Ctx, x: number, y: number, w: number, d: number, h: number, colors: string[]) {
    polygon(
        c,
        [
            [x - w, y - h],
            [x, y + d - h],
            [x, y + d],
            [x - w, y],
        ],
        colors[1]
    )
    polygon(
        c,
        [
            [x, y + d - h],
            [x + w, y - h],
            [x + w, y],
            [x, y + d],
        ],
        colors[2]
    )
    polygon(
        c,
        [
            [x, y - d - h],
            [x + w, y - h],
            [x, y + d - h],
            [x - w, y - h],
        ],
        colors[0]
    )
}
function tree(c: Ctx, x: number, y: number, scale = 1) {
    ellipse(c, x + 4, y + 3, 12 * scale, 5 * scale, '#203d2e28')
    box(c, x - 2, y - 6, 4, 9, '#67583e')
    for (let i = 0; i < 3; i++) {
        const h = y - i * 7 * scale
        polygon(
            c,
            [
                [x, h - 22 * scale],
                [x + (13 - i * 2) * scale, h],
                [x, h + 5 * scale],
                [x - (13 - i * 2) * scale, h],
            ],
            i % 2 ? '#3d805d' : '#2c674e'
        )
        polygon(
            c,
            [
                [x, h - 22 * scale],
                [x, h + 5 * scale],
                [x - (13 - i * 2) * scale, h],
            ],
            '#52946a'
        )
    }
}
function raid(c: Ctx, g: Raid, still: boolean) {
    const sky = c.createLinearGradient(0, 0, 0, HEIGHT)
    sky.addColorStop(0, '#d3ece5')
    sky.addColorStop(1, '#f8ecd0')
    box(c, 0, 0, WIDTH, HEIGHT, sky)
    glow(c, 294, 43, 80, '#fff5ce99')
    ellipse(c, 184, 225, 145, 24, '#315c4525')
    const corners = [
        [25, 12],
        [335, 12],
        [335, 268],
        [25, 268],
    ].map(([x, y]) => project({ x, y }))
    polygon(
        c,
        corners.map(p => [p.x, p.y + 17]),
        '#497550'
    )
    polygon(
        c,
        corners.map(p => [p.x, p.y + 7]),
        '#638e53'
    )
    polygon(
        c,
        corners.map(p => [p.x, p.y]),
        '#91b565'
    )
    ground(c, 65, 35, 232, 196, '#b0c17a')
    ground(c, 154, 49, 43, 178, '#d7c18a')
    ground(c, 80, 131, 210, 26, '#d7c18a')
    for (let i = 0; i < 25; i++) {
        const p = project({ x: 33 + ((i * 67) % 296), y: 20 + ((i * 43) % 239) })
        ellipse(c, p.x, p.y, 2.5, 1, '#d6d686')
    }
    for (const [x, y, s] of [
        [40, 45, 0.85],
        [82, 28, 0.7],
        [304, 33, 0.9],
        [322, 228, 0.75],
        [31, 204, 0.7],
    ]) {
        const p = project({ x, y })
        tree(c, p.x, p.y, s)
    }
    // Low walls leave the three deployment approaches readable.
    for (let i = 0; i < 7; i++)
        for (const side of [0, 1]) {
            if (i === 3) continue
            const p = project(side ? { x: 70 + i * 26, y: 230 } : { x: 300, y: 40 + i * 27 })
            block(c, p.x, p.y, 7, 4, 7, ['#e6dbb6', '#a4a37c', '#8a956f'])
        }
    const objects = [
        ...g.buildings.map(b => ({ p: b, building: b, troop: null })),
        ...g.troops.map(t => ({ p: t, troop: t, building: null })),
    ].sort((a, b) => a.p.x + a.p.y - b.p.x - b.p.y)
    for (const item of objects) {
        const p = project(item.p),
            x = p.x,
            y = p.y,
            b = item.building,
            t = item.troop
        if (b) {
            if (b.hp <= 0) {
                ellipse(c, x, y, 23, 12, '#8e947061')
                for (let i = 0; i < 5; i++)
                    block(c, x - 13 + i * 6, y - 4 + (i % 2) * 7, 5, 3, 4, ['#d4bd87', '#aa9b6d', '#888f63'])
                continue
            }
            polygon(
                c,
                [
                    [x - 20, y],
                    [x + 20, y - 4],
                    [x + 40, y + 13],
                    [x + 5, y + 22],
                ],
                '#365e3c25'
            )
            if (b.kind === 'hall') {
                block(c, x, y, 30, 16, 29, ['#f6dda1', '#e6ba71', '#b88a4f'])
                block(c, x, y + 6, 13, 7, 3, ['#e9d298', '#b69b65', '#9d8657'])
                polygon(
                    c,
                    [
                        [x - 35, y - 27],
                        [x - 7, y - 61],
                        [x + 35, y - 27],
                        [x, y - 7],
                    ],
                    '#a8483e'
                )
                polygon(
                    c,
                    [
                        [x - 35, y - 27],
                        [x - 7, y - 61],
                        [x, y - 7],
                    ],
                    '#df7851'
                )
                line(c, { x: x - 7, y: y - 61 }, { x: x + 35, y: y - 27 }, '#efb473', 2)
                polygon(
                    c,
                    [
                        [x + 4, y - 13],
                        [x + 15, y - 19],
                        [x + 15, y + 7],
                        [x + 4, y + 13],
                    ],
                    '#65583b'
                )
                polygon(
                    c,
                    [
                        [x - 23, y - 21],
                        [x - 15, y - 17],
                        [x - 15, y - 8],
                        [x - 23, y - 12],
                    ],
                    '#fff2b4'
                )
                line(c, { x: x - 7, y: y - 60 }, { x: x - 7, y: y - 79 }, '#6e6242', 2)
                polygon(
                    c,
                    [
                        [x - 6, y - 79],
                        [x + 13, y - 73 + (still ? 0 : Math.sin(g.time * 3) * 2)],
                        [x - 6, y - 66],
                    ],
                    '#d15450'
                )
            } else if (b.kind === 'cannon') {
                block(c, x, y, 22, 12, 11, ['#e4dcb7', '#b5b18d', '#8c977d'])
                ellipse(c, x, y - 11, 15, 9, '#485655')
                circle(c, x, y - 15, 10, '#596a65')
                const end = project({ x: b.x + Math.cos(b.angle) * 28, y: b.y + Math.sin(b.angle) * 28 })
                line(c, { x, y: y - 19 }, { x: end.x, y: end.y - 19 }, '#2d4141', 11)
                circle(c, end.x, end.y - 19, 6, '#314342')
                circle(c, end.x, end.y - 19, 3, '#142c2d')
            } else {
                block(c, x, y, 23, 13, 18, ['#c89a53', '#b78948', '#8e6b3d'])
                for (let i = 0; i < 8; i++) {
                    const gx = x - 13 + (i % 4) * 8,
                        gy = y - 16 + Math.floor(i / 4) * 6
                    ellipse(c, gx, gy, 6, 3, '#b58c38')
                    ellipse(c, gx, gy - 2, 6, 3, '#ffe48b')
                }
                line(c, { x: x - 22, y: y - 16 }, { x, y: y - 3 }, '#e8bd69', 3)
            }
            if (b.hp < b.maxHp) health(c, x, y + 19, b.hp / b.maxHp, 30)
        }
        if (t) {
            const bob = still ? 0 : Math.sin(g.time * 14 + t.x) * 1.1
            ellipse(c, x, y + 2, 5, 2.5, '#284c3545')
            box(c, x - 4, y - 9 + bob, 8, 9, t.kind === 'archer' ? '#6b5281' : '#9e683e', 2)
            circle(c, x, y - 12 + bob, 4, '#fbd59f')
            box(c, x - 4, y - 17 + bob, 8, 5, t.kind === 'archer' ? '#d08ac1' : '#ffdb61', 2)
            line(
                c,
                { x: x + 5, y: y - 4 + bob },
                { x: x + 8, y: y - 14 + bob },
                t.kind === 'archer' ? '#d9b074' : '#f5f6cf',
                2
            )
            if (t.hp < (t.kind === 'archer' ? 31 : 62)) health(c, x, y - 23, t.hp / (t.kind === 'archer' ? 31 : 62), 13)
        }
    }
    if (g.phase === 'running') {
        if (g.selected === 'spell') {
            const p = project(g.cursor)
            ellipse(c, p.x, p.y, 50, 26, '#b89af02b')
            ellipse(c, p.x, p.y, 12, 6, '#e6d5ff77')
        } else
            for (const [x, y] of [
                [42, 140],
                [320, 140],
                [180, 254],
            ]) {
                const p = project({ x, y })
                ellipse(c, p.x, p.y, 14, 7, '#f9eeb54f')
                text(c, '+', p.x, p.y + 3, '#365e3b', 14)
            }
    }
    if (g.phase === 'running' && g.selected !== 'spell') {
        const p = project(g.cursor)
        const valid = g.cursor.x <= 61 || g.cursor.x >= 299 || g.cursor.y <= 33 || g.cursor.y >= 231
        c.strokeStyle = valid ? '#fffbe0' : '#c06a50'
        c.lineWidth = 1.5
        c.beginPath()
        c.ellipse(p.x, p.y, 10, 5, 0, 0, Math.PI * 2)
        c.stroke()
    }
    for (let i = 0; i < 3; i++) star(c, 163 + i * 17, 22, 6, i < stars(g) ? '#c48d31' : '#658a6950')
}
function crystal(c: Ctx, x: number, y: number, size: number, color: string) {
    polygon(
        c,
        [
            [x, y - size],
            [x + size * 0.55, y],
            [x, y + size],
            [x - size * 0.55, y],
        ],
        color
    )
    polygon(
        c,
        [
            [x, y - size],
            [x + size * 0.55, y],
            [x, y + size],
        ],
        '#ffffff66'
    )
}
function rift(c: Ctx, g: Rift, still: boolean) {
    const gold = g.champion === 'lux',
        color = gold ? '#ffe3a1' : '#9be8ff'
    const sky = c.createLinearGradient(0, 0, 0, HEIGHT)
    sky.addColorStop(0, '#112b37')
    sky.addColorStop(1, '#204b51')
    box(c, 0, 0, WIDTH, HEIGHT, sky)
    // A moonlit lane, carved stone and a luminous river.
    polygon(
        c,
        [
            [0, 62],
            [55, 92],
            [96, 167],
            [44, 219],
            [0, 230],
        ],
        '#246575'
    )
    for (let i = 0; i < 8; i++) line(c, { x: 0, y: 119 + i * 11 }, { x: 39 + i * 4, y: 112 + i * 11 }, '#80d5dd27', 1.5)
    polygon(
        c,
        [
            [107, 35],
            [251, 35],
            [323, 280],
            [36, 280],
        ],
        '#596858'
    )
    polygon(
        c,
        [
            [116, 35],
            [242, 35],
            [305, 280],
            [54, 280],
        ],
        '#7b7c5d'
    )
    for (let row = 0; row < 9; row++) {
        const y = 35 + row * 29,
            w = 116 + row * 15
        for (let col = 0; col < 4; col++) {
            const x = 180 - w / 2 + (col * w) / 4
            polygon(
                c,
                [
                    [x + 2, y],
                    [x + w / 4 - 2, y],
                    [x + w / 4 + 1, y + 24],
                    [x - 2, y + 24],
                ],
                (row + col) % 3 ? '#66725c' : '#71816a'
            )
            line(c, { x: x + 3, y: y + 2 }, { x: x + w / 4 - 3, y: y + 2 }, '#9fa58135')
        }
    }
    for (const [x, y, s] of [
        [21, 46, 1.2],
        [68, 71, 1],
        [324, 46, 1.25],
        [295, 105, 1.1],
        [342, 169, 1.3],
        [27, 260, 1],
    ])
        tree(c, x, y, s)
    for (const x of [91, 270]) {
        block(c, x, 51, 17, 9, 20, ['#738478', '#3d5552', '#2f494a'])
        crystal(c, x, 22, 15, '#6bc0d7')
        glow(c, x, 22, 25, '#7ed8fb44')
    }
    if (!still)
        for (let i = 0; i < 10; i++) {
            const x = 20 + ((i * 83) % 320),
                y = 30 + ((i * 47 + g.time * 4) % 230)
            circle(c, x, y, 1, '#c2e4ae66')
        }
    for (const m of g.minions) {
        if (m.hp <= 0) {
            ellipse(c, m.x, m.y + 4, 13, 5, '#121c2455')
            continue
        }
        ellipse(c, m.x, m.y + 10, 12, 5, '#152e3a66')
        polygon(
            c,
            [
                [m.x, m.y - 13],
                [m.x + 9, m.y - 5],
                [m.x + 10, m.y + 8],
                [m.x - 10, m.y + 8],
                [m.x - 9, m.y - 5],
            ],
            m.frozen ? '#72c2d8' : '#9e435b'
        )
        box(c, m.x - 7, m.y - 6, 14, 9, '#293641', 4)
        line(c, { x: m.x - 4, y: m.y - 2 }, { x: m.x + 4, y: m.y - 2 }, '#ffc69e', 2)
        polygon(
            c,
            [
                [m.x - 14, m.y - 5],
                [m.x - 8, m.y - 8],
                [m.x - 6, m.y + 3],
                [m.x - 14, m.y + 7],
            ],
            '#c97771'
        )
        line(c, { x: m.x + 12, y: m.y + 6 }, { x: m.x + 12, y: m.y - 14 }, '#b49a78', 2)
        crystal(c, m.x + 12, m.y - 16, 4, '#f194aa')
        health(c, m.x, m.y - 22, m.hp / 2, 24, m.frozen ? '#b3edfa' : '#f49194')
        if (m.frozen) {
            polygon(
                c,
                [
                    [m.x - 13, m.y + 10],
                    [m.x - 17, m.y - 10],
                    [m.x, m.y - 22],
                    [m.x + 17, m.y - 5],
                    [m.x + 12, m.y + 12],
                ],
                gold ? '#fff1b733' : '#a6ebff55'
            )
            crystal(c, m.x - 11, m.y + 4, 10, gold ? '#ffefb588' : '#c0f0ff88')
        }
    }
    const p = g.player,
        angle = Math.atan2(g.cursor.y - p.y, g.cursor.x - p.x)
    if (g.phase === 'running') {
        c.save()
        c.translate(p.x, p.y)
        c.rotate(angle)
        const wide = g.ability === 'ultimate' || gold ? 0.035 : 0.32
        polygon(
            c,
            [
                [8, 0],
                [Math.cos(wide) * 190, Math.sin(wide) * 190],
                [Math.cos(wide) * 190, -Math.sin(wide) * 190],
            ],
            gold ? '#fff0a716' : '#9de4ff20'
        )
        c.setLineDash([4, 7])
        line(c, { x: 19, y: 0 }, { x: 200, y: 0 }, gold ? '#fff0bb77' : '#9ae6ff99', 1)
        c.setLineDash([])
        c.restore()
        c.strokeStyle = color
        c.lineWidth = 1
        c.beginPath()
        c.arc(g.cursor.x, g.cursor.y, g.aiming ? 11 : 7, 0, Math.PI * 2)
        c.stroke()
    }
    ellipse(c, p.x, p.y + 9, 17, 7, '#102f3e88')
    glow(c, p.x, p.y, 29, gold ? '#ffe2a02a' : '#80cfff33')
    ellipse(c, p.x, p.y + 8, 17, 5, gold ? '#ffde8a44' : '#71d3ff44')
    polygon(
        c,
        [
            [p.x - 5, p.y - 10],
            [p.x + 7, p.y - 8],
            [p.x + 13, p.y + 12],
            [p.x - 13, p.y + 11],
        ],
        gold ? '#eee7cc' : '#347eac'
    )
    polygon(
        c,
        [
            [p.x - 6, p.y - 9],
            [p.x - 12, p.y + 11],
            [p.x, p.y + 7],
        ],
        gold ? '#b28e50' : '#204f76'
    )
    circle(c, p.x, p.y - 14, 5, '#f4cbb1')
    box(c, p.x - 6, p.y - 21, 12, 6, gold ? '#efd084' : '#d4e9ef', 4)
    if (gold) {
        line(c, { x: p.x + 12, y: p.y + 7 }, { x: p.x + 12, y: p.y - 24 }, '#e3c585', 2)
        crystal(c, p.x + 12, p.y - 24, 6, '#fff4b6')
    } else {
        c.strokeStyle = '#c1e8e9'
        c.lineWidth = 2
        c.beginPath()
        c.arc(p.x + 6, p.y - 5, 12, -0.9, 1.2)
        c.stroke()
        line(c, { x: p.x + 13, y: p.y - 15 }, { x: p.x + 10, y: p.y + 6 }, '#afcbd8')
    }
    for (const a of g.arrows) {
        const angle = Math.atan2(a.vy, a.vx)
        c.save()
        c.translate(a.x, a.y)
        c.rotate(angle)
        if (a.ultimate) {
            glow(c, 0, 0, 23, '#77dfff77')
            polygon(
                c,
                [
                    [19, 0],
                    [-5, -11],
                    [-1, 0],
                    [-5, 11],
                ],
                '#c1f5ff'
            )
            line(c, { x: -27, y: 0 }, { x: 4, y: 0 }, '#9defff', 5)
        } else {
            line(c, { x: -16, y: 0 }, { x: 5, y: 0 }, color, gold ? 4 : 2)
            polygon(
                c,
                [
                    [8, 0],
                    [1, -3],
                    [1, 3],
                ],
                '#f3ffff'
            )
        }
        c.restore()
    }
}
function palm(c: Ctx, x: number, y: number, s: number) {
    line(c, { x, y }, { x: x + 7 * s, y: y - 47 * s }, '#343847', 4 * s)
    const top = { x: x + 7 * s, y: y - 47 * s }
    for (const [dx, dy] of [
        [-27, 4],
        [-20, -10],
        [0, -17],
        [24, -9],
        [29, 6],
        [17, 17],
        [-19, 18],
    ])
        polygon(
            c,
            [
                [top.x, top.y],
                [top.x + dx * s * 0.65, top.y + dy * s - 5 * s],
                [top.x + dx * s, top.y + dy * s + 7 * s],
                [top.x + dx * s * 0.45, top.y + dy * s * 0.3],
            ],
            '#263d47'
        )
}
function car(c: Ctx, x: number, y: number, s: number, color: string, steer = 0, boost = false) {
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    c.rotate(steer * 0.035)
    ellipse(c, 0, 3, 24, 6, '#201f3544')
    if (boost) {
        polygon(
            c,
            [
                [-13, 2],
                [-9, 25],
                [-5, 2],
            ],
            '#77e0ff'
        )
        polygon(
            c,
            [
                [5, 2],
                [9, 25],
                [13, 2],
            ],
            '#77e0ff'
        )
        glow(c, 0, 10, 28, '#7ecfff77')
    }
    box(c, -24, -18, 6, 20, '#252b39', 2)
    box(c, 18, -18, 6, 20, '#252b39', 2)
    polygon(
        c,
        [
            [-22, -9],
            [-17, -37],
            [-10, -45],
            [10, -45],
            [17, -37],
            [22, -9],
        ],
        color
    )
    polygon(
        c,
        [
            [-13, -35],
            [-9, -42],
            [9, -42],
            [13, -35],
        ],
        '#f5c39c'
    )
    polygon(
        c,
        [
            [-16, -31],
            [-12, -36],
            [12, -36],
            [16, -31],
            [17, -20],
            [-17, -20],
        ],
        '#28404a'
    )
    line(c, { x: -12, y: -33 }, { x: 12, y: -33 }, '#efac96', 1)
    box(c, -23, -14, 46, 15, color, 3)
    line(c, { x: -21, y: -11 }, { x: 21, y: -11 }, '#ffeadba0', 1)
    box(c, -21, -9, 10, 4, '#ff8b77', 1)
    box(c, 11, -9, 10, 4, '#ff8b77', 1)
    box(c, -5, -7, 10, 4, '#e5dfca', 1)
    box(c, -22, -2, 44, 3, '#d6b7a4', 1)
    c.restore()
}
function drive(c: Ctx, g: Drive, still: boolean) {
    const sky = c.createLinearGradient(0, 0, 0, HEIGHT)
    sky.addColorStop(0, '#676b9b')
    sky.addColorStop(0.32, '#eeab9a')
    sky.addColorStop(0.55, '#f9c699')
    sky.addColorStop(1, '#584955')
    box(c, 0, 0, WIDTH, HEIGHT, sky)
    circle(c, 248, 66, 31, '#ffe3a6')
    for (let i = 0; i < 5; i++) box(c, 213, 71 + i * 6, 70, 1 + i * 0.4, '#eeb79a')
    const bend = roadCurve(g.distance)
    polygon(
        c,
        [
            [0, 115],
            [36, 90],
            [72, 98],
            [107, 78],
            [148, 112],
            [192, 94],
            [247, 107],
            [288, 84],
            [360, 107],
            [360, 140],
            [0, 140],
        ],
        '#8b7e91'
    )
    for (let i = 0; i < 17; i++) {
        const x = i * 24 - bend * 0.15,
            h = 7 + ((i * 17) % 27)
        box(c, x, 124 - h, 13 + (i % 3) * 5, h, '#6e7382')
        if (i % 3 === 0) line(c, { x: x + 7, y: 124 - h }, { x: x + 7, y: 115 - h }, '#6e7382')
    }
    const road = (z: number) => ({
        x: 180 + bend * (1 - z) ** 2 - g.car.x * 12 * z,
        y: 124 + z * z * 164,
        width: 5 + z * 172,
    })
    for (let i = 0; i < 48; i++) {
        const z = i / 48,
            next = (i + 1) / 48,
            a = road(z),
            b = road(next),
            stripe = Math.floor(g.distance * 0.21 + i / 3) % 2 === 0
        box(c, 0, a.y, WIDTH, b.y - a.y + 0.5, stripe ? '#bf9b86' : '#b99482')
        polygon(
            c,
            [
                [a.x - a.width * 1.09, a.y],
                [a.x + a.width * 1.09, a.y],
                [b.x + b.width * 1.09, b.y + 0.7],
                [b.x - b.width * 1.09, b.y + 0.7],
            ],
            stripe ? '#e5bca2' : '#a77772'
        )
        polygon(
            c,
            [
                [a.x - a.width, a.y],
                [a.x + a.width, a.y],
                [b.x + b.width, b.y + 0.7],
                [b.x - b.width, b.y + 0.7],
            ],
            stripe ? '#625e6b' : '#66616e'
        )
        if (stripe)
            for (const lane of [-1 / 3, 1 / 3])
                polygon(
                    c,
                    [
                        [a.x + a.width * lane - z, a.y],
                        [a.x + a.width * lane + z, a.y],
                        [b.x + b.width * lane + next, b.y],
                        [b.x + b.width * lane - next, b.y],
                    ],
                    '#e9d7bd'
                )
    }
    for (let i = 0; i < 7; i++) {
        const z = (i / 7 + g.distance / 155) % 1,
            p = road(z),
            size = 0.2 + z * 1.2
        palm(c, p.x - p.width * 1.45, p.y, size)
        palm(c, p.x + p.width * 1.5, p.y, size)
    }
    // Objects share the road's perspective so steering and collisions read consistently.
    for (const t of [...g.traffic].sort((a, b) => a.z - b.z)) {
        if (t.z > 1.1) continue
        const p = road(t.z)
        car(c, p.x + t.lane * p.width * 0.82, p.y, 0.18 + t.z * 0.82, t.color)
    }
    const playerRoad = road(0.94),
        bounce = still ? 0 : Math.sin(g.time * 24) * 0.5
    car(
        c,
        playerRoad.x + g.car.x * playerRoad.width * 0.82,
        playerRoad.y + bounce,
        1.12,
        '#467f70',
        g.car.steer,
        g.boost > 0 && !still
    )
    if (g.hit && !still) box(c, 0, 0, WIDTH, HEIGHT, '#ffb29c22')
    // An in-scene route strip keeps progress visible without another control row.
    box(c, 118, 263, 124, 3, '#271f3955', 2)
    box(c, 118, 263, 124 * Math.min(1, g.distance / ROUTE), 3, '#ffe6af', 2)
    text(c, 'LOS SANTOS', 54, 23, '#fff0d7', 8)
    text(c, '→ THE COAST', 292, 23, '#fff0d7', 8)
}
function effects(c: Ctx, g: Game, still: boolean) {
    if (still) return
    for (const fx of g.effects) {
        const p = g.mode === 'crown' ? project(fx) : fx,
            progress = 1 - fx.life / fx.duration
        c.save()
        c.globalAlpha = Math.min(1, (fx.life / fx.duration) * 2)
        if (fx.kind === 'spell') {
            glow(c, p.x, p.y - 15, 65, '#dfc4ff88')
            const points = [
                [p.x + 8, p.y - 105],
                [p.x - 9, p.y - 68],
                [p.x + 4, p.y - 64],
                [p.x - 8, p.y - 24],
                [p.x + 1, p.y - 32],
                [p.x, p.y],
            ]
            polygon(c, points, '#faf0ff')
            ellipse(c, p.x, p.y, 50 * progress, 25 * progress, '#dcc0ff44')
        } else if (fx.to) {
            const end = g.mode === 'crown' ? project(fx.to) : fx.to
            if (fx.kind === 'beam') {
                line(c, p, end, '#eac1ff44', 30 * (1 - progress))
                line(c, p, end, '#fff1a6', 11 * (1 - progress))
                line(c, p, end, '#fffef3', 4)
                glow(c, p.x, p.y, 38, '#fff0b777')
            } else {
                const x = p.x + (end.x - p.x) * progress,
                    y = p.y + (end.y - p.y) * progress - Math.sin(progress * Math.PI) * 15
                circle(c, x, y - 8, 3, fx.color)
                line(c, { x: x - 4, y: y - 12 }, { x, y: y - 8 }, '#fff6cf99', 2)
            }
        } else {
            for (let i = 0; i < 9; i++) {
                const angle = i * 2.4,
                    r = 4 + progress * 24
                circle(
                    c,
                    p.x + Math.cos(angle) * r,
                    p.y - 8 + Math.sin(angle) * r * 0.7 + progress * progress * 13,
                    (1 - progress) * 2.8,
                    fx.color
                )
            }
        }
        c.restore()
    }
}
export function draw(c: Ctx, game: Game, reducedMotion: boolean) {
    c.setTransform(c.canvas.width / WIDTH, 0, 0, c.canvas.height / HEIGHT, 0, 0)
    c.clearRect(0, 0, WIDTH, HEIGHT)
    if (game.mode === 'crown') raid(c, game, reducedMotion)
    else if (game.mode === 'rift') rift(c, game, reducedMotion)
    else drive(c, game, reducedMotion)
    effects(c, game, reducedMotion)
    if (game.messageTime > 0) {
        const width = Math.min(240, game.message.length * 6 + 24)
        box(c, 180 - width / 2, game.mode === 'crown' ? 246 : 34, width, 22, '#142d3cdd', 11)
        text(c, game.message, 180, game.mode === 'crown' ? 260 : 48, '#fff2cf', 9)
    }
}
