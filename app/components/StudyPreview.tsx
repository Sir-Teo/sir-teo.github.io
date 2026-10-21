'use client'

import { useId, useState } from 'react'
import ProjectIllustration from './ProjectIllustration'

type Scene = 'chess' | 'xiangqi' | 'go'
type Point = [number, number]
type Line = { move: string; name: string; from?: Point; to: Point; replies?: Point[] }

// Curated, legal examples illustrate exploring alternatives. They are not engine
// rankings or evaluations; the full linked apps run their own browser engines.
const lines: Record<Scene, Line[]> = {
    chess: [
        { move: 'Bb5', name: 'Ruy López', from: [5, 7], to: [1, 3] },
        { move: 'Bc4', name: 'Italian Game', from: [5, 7], to: [2, 4] },
        { move: 'd4', name: 'Scotch Game', from: [3, 6], to: [3, 4] },
    ],
    xiangqi: [
        { move: 'C2=5', name: 'Central Cannon', from: [7, 7], to: [4, 7] },
        { move: 'H2+3', name: 'Develop a horse', from: [7, 9], to: [6, 7] },
        { move: 'P7+1', name: 'Gain space', from: [2, 6], to: [2, 5] },
    ],
    go: [
        {
            move: 'F4',
            name: 'Approach',
            to: [5, 5],
            replies: [
                [5, 6],
                [6, 6],
            ],
        },
        {
            move: 'D6',
            name: 'Other side',
            to: [3, 3],
            replies: [
                [2, 3],
                [2, 4],
            ],
        },
        {
            move: 'E5',
            name: 'Take the center',
            to: [4, 4],
            replies: [
                [4, 3],
                [5, 4],
            ],
        },
    ],
}

export default function StudyPreview({ scene, reducedMotion }: { scene: Scene; reducedMotion: boolean }) {
    const [analyzing, setAnalyzing] = useState(false)
    const [selected, setSelected] = useState(0)
    const id = `study-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
    const line = lines[scene][selected]
    return (
        <div className={`study-preview study-${scene}`}>
            <div className="study-toolbar">
                <span>Play. Analyze. Learn.</span>
                <div role="group" aria-label="Preview view" className="study-view-toggle">
                    <button type="button" aria-pressed={!analyzing} onClick={() => setAnalyzing(false)}>
                        Explore
                    </button>
                    <button type="button" aria-pressed={analyzing} onClick={() => setAnalyzing(true)}>
                        <svg viewBox="0 0 14 14" width="12" height="12" fill="none" aria-hidden="true">
                            <path d="M3 2v8m0-3h5l3-4M3 10h8" stroke="currentColor" strokeWidth="1.3" />
                            <circle cx="3" cy="2" r="1.5" fill="currentColor" />
                            <circle cx="11" cy="3" r="1.5" fill="currentColor" />
                            <circle cx="11" cy="10" r="1.5" fill="currentColor" />
                        </svg>
                        Analyze
                    </button>
                </div>
            </div>
            {analyzing ? (
                <div className="study-analysis">
                    <svg
                        className="study-board"
                        viewBox="0 0 240 260"
                        role="img"
                        aria-label={
                            scene === 'go'
                                ? `Example variation beginning ${line.move}, with three numbered moves`
                                : `Example position after ${line.move}`
                        }
                    >
                        <defs>
                            <marker
                                id={`${id}-arrow`}
                                viewBox="0 0 10 10"
                                refX="7"
                                refY="5"
                                markerWidth="4"
                                markerHeight="4"
                                orient="auto-start-reverse"
                            >
                                <path d="M0 0 10 5 0 10Z" fill="currentColor" />
                            </marker>
                            <radialGradient id={`${id}-stone`} cx="30%" cy="25%" r="80%">
                                <stop stopColor="#6b7c80" />
                                <stop offset=".45" stopColor="#253b41" />
                                <stop offset="1" stopColor="#10262c" />
                            </radialGradient>
                        </defs>
                        {scene === 'chess' && <ChessPosition line={line} id={id} />}
                        {scene === 'xiangqi' && <XiangqiPosition line={line} id={id} />}
                        {scene === 'go' && <GoPosition line={line} id={id} />}
                        <text x="120" y="246" textAnchor="middle" className="study-example-label">
                            EXAMPLE {scene === 'go' ? 'VARIATION' : 'POSITION'}
                        </text>
                    </svg>
                    <div className="study-lines">
                        <span className="study-question">What if…</span>
                        <div role="group" aria-label="Example continuations">
                            {lines[scene].map((item, index) => (
                                <button
                                    key={item.move}
                                    type="button"
                                    aria-pressed={index === selected}
                                    aria-label={`Explore ${item.move}: ${item.name}`}
                                    onPointerEnter={event => {
                                        if (event.pointerType !== 'touch') setSelected(index)
                                    }}
                                    onFocus={() => setSelected(index)}
                                    onClick={() => setSelected(index)}
                                >
                                    <strong>
                                        {item.move}
                                        <span aria-hidden="true">↗</span>
                                    </strong>
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </div>
                        <span className="study-lines-hint">Try another line.</span>
                    </div>
                </div>
            ) : (
                <ProjectIllustration scene={scene} reducedMotion={reducedMotion} />
            )}
        </div>
    )
}

function MoveArrow({
    line,
    id,
    start,
    step,
    center = 0,
}: {
    line: Line
    id: string
    start: Point
    step: number
    center?: number
}) {
    if (!line.from) return null
    const from = [start[0] + line.from[0] * step + center, start[1] + line.from[1] * step + center]
    const to = [start[0] + line.to[0] * step + center, start[1] + line.to[1] * step + center]
    return (
        <g className="study-move-arrow" key={line.move}>
            <circle cx={from[0]} cy={from[1]} r="5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
            <path
                d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                opacity=".65"
                markerEnd={`url(#${id}-arrow)`}
            />
        </g>
    )
}

const chessBack = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
const chessGlyph: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
function ChessPosition({ line, id }: { line: Line; id: string }) {
    const pieces = [
        ...chessBack.map((piece, x) => ({ piece, white: false, x: x === 1 ? 2 : x, y: x === 1 ? 2 : 0 })),
        ...chessBack.map((piece, x) => ({ piece, white: true, x: x === 6 ? 5 : x, y: x === 6 ? 5 : 7 })),
        ...Array.from({ length: 8 }, (_, x) => ({ piece: 'p', white: false, x, y: x === 4 ? 3 : 1 })),
        ...Array.from({ length: 8 }, (_, x) => ({ piece: 'p', white: true, x, y: x === 4 ? 4 : 6 })),
    ]
    return (
        <>
            <rect x="20" y="25" width="200" height="200" rx="5" fill="#abc3b2" />
            {Array.from({ length: 64 }, (_, i) => (
                <rect
                    key={i}
                    x={24 + (i % 8) * 24}
                    y={29 + Math.floor(i / 8) * 24}
                    width="24"
                    height="24"
                    fill={((i % 8) + Math.floor(i / 8)) % 2 ? '#b2c9b9' : '#eff2e8'}
                />
            ))}
            <rect x={24 + line.to[0] * 24} y={29 + line.to[1] * 24} width="24" height="24" fill="#91b879" />
            <MoveArrow line={line} id={id} start={[24, 29]} step={24} center={12} />
            {pieces.map((piece, i) => {
                const moving = piece.x === line.from?.[0] && piece.y === line.from?.[1]
                const [x, y] = moving ? line.to : [piece.x, piece.y]
                return (
                    <g
                        key={i}
                        className="study-piece"
                        style={{ transform: `translate(${36 + x * 24}px, ${43 + y * 24}px)` }}
                    >
                        <text
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontFamily="Georgia, 'DejaVu Sans', serif"
                            fontSize="25"
                            fill={piece.white ? '#fff9e7' : '#29493c'}
                            stroke={piece.white ? '#526d5a' : '#173c2d'}
                            strokeWidth={piece.white ? '.65' : '.25'}
                            paintOrder="stroke fill"
                        >
                            {chessGlyph[piece.piece]}
                        </text>
                    </g>
                )
            })}
        </>
    )
}

function XiangqiPosition({ line, id }: { line: Line; id: string }) {
    const back = ['車', '馬', '象', '士', '將', '士', '象', '馬', '車']
    const pieces = [
        ...back.map((glyph, x) => ({ glyph, red: false, x, y: 0 })),
        ...back.map((glyph, x) => ({
            glyph: x === 4 ? '帥' : x === 2 || x === 6 ? '相' : x === 3 || x === 5 ? '仕' : glyph,
            red: true,
            x,
            y: 9,
        })),
        ...[1, 7].flatMap(x => [
            { glyph: '砲', red: false, x, y: 2 },
            { glyph: '炮', red: true, x, y: 7 },
        ]),
        ...[0, 2, 4, 6, 8].flatMap(x => [
            { glyph: '卒', red: false, x, y: 3 },
            { glyph: '兵', red: true, x, y: 6 },
        ]),
    ]
    return (
        <>
            <rect x="24" y="18" width="192" height="212" rx="7" fill="#ead2af" />
            <g stroke="#b39775" strokeWidth=".7" fill="none">
                {Array.from({ length: 10 }, (_, y) => (
                    <path key={`h${y}`} d={`M36 ${29 + y * 21}H204`} />
                ))}
                {Array.from({ length: 9 }, (_, x) => (
                    <path key={`v${x}`} d={`M${36 + x * 21} 29v84m0 21v84`} />
                ))}
                <path d="M36 113v21m168-21v21M99 29l42 42m0-42-42 42m0 105 42 42m0-42-42 42" />
            </g>
            <text x="120" y="127" textAnchor="middle" fill="#a98c6c" fontFamily="serif" fontSize="9" letterSpacing="12">
                楚河 漢界
            </text>
            <MoveArrow line={line} id={id} start={[36, 29]} step={21} />
            <circle
                cx={36 + line.to[0] * 21}
                cy={29 + line.to[1] * 21}
                r="12"
                fill="none"
                stroke="#b8423b"
                strokeWidth="1.5"
            />
            {pieces.map((piece, i) => {
                const moving = piece.x === line.from?.[0] && piece.y === line.from?.[1]
                const [x, y] = moving ? line.to : [piece.x, piece.y]
                return (
                    <g
                        key={i}
                        className="study-piece"
                        style={{ transform: `translate(${36 + x * 21}px, ${29 + y * 21}px)` }}
                    >
                        <circle cy="1.3" r="9" fill="#ae855a" />
                        <circle r="9" fill="#fff1d5" stroke="#c4a174" strokeWidth=".75" />
                        <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="12"
                            fill={piece.red ? '#a33a32' : '#394a43'}
                            fontFamily="'Songti SC', 'Noto Serif CJK SC', serif"
                        >
                            {piece.glyph}
                        </text>
                    </g>
                )
            })}
        </>
    )
}

function GoPosition({ line, id }: { line: Line; id: string }) {
    const stones = [
        { point: [3, 5], black: true, label: '' },
        { point: [5, 3], black: false, label: '' },
        ...[line.to, ...(line.replies ?? [])].map((point, i) => ({ point, black: i % 2 === 0, label: String(i + 1) })),
    ]
    return (
        <>
            <rect x="19" y="23" width="202" height="202" rx="7" fill="#e1d2b4" />
            <g stroke="#9d967f" strokeWidth=".7">
                {Array.from({ length: 9 }, (_, i) => (
                    <path key={i} d={`M${32 + i * 22} 36v176M32 ${36 + i * 22}h176`} />
                ))}
            </g>
            {[
                [2, 2],
                [6, 2],
                [4, 4],
                [2, 6],
                [6, 6],
            ].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={32 + x * 22} cy={36 + y * 22} r="1.8" fill="#8a826b" />
            ))}
            {stones.map(({ point, black, label }, i) => (
                <g
                    key={i}
                    className="study-piece"
                    style={{ transform: `translate(${32 + point[0] * 22}px, ${36 + point[1] * 22}px)` }}
                >
                    <ellipse cy="2" rx="10" ry="9.5" fill="#4c594a" opacity=".2" />
                    <circle
                        r="10"
                        fill={black ? `url(#${id}-stone)` : '#fffdf0'}
                        stroke={black ? '#173038' : '#c3bfae'}
                        strokeWidth=".6"
                    />
                    {label && (
                        <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={black ? '#e5efeb' : '#376b66'}
                            fontFamily="ui-monospace, monospace"
                            fontSize="10"
                            fontWeight="600"
                        >
                            {label}
                        </text>
                    )}
                </g>
            ))}
        </>
    )
}
