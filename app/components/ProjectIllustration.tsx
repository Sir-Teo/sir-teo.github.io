'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { LinkItem } from '../data/profile'

type Scene = Exclude<NonNullable<LinkItem['preview']>['mode'], 'videos'>
const actions: Record<Scene, [string, string]> = {
    crown: ['Polish the crown', 'Make it shine'],
    rift: ['Release the frost crystal', 'Release'],
    postcard: ['Switch the Los Santos postcard between sunset and night', 'Nightfall'],
    chess: ['Switch between an ivory and ebony chess knight', 'Your move'],
    xiangqi: ['Turn the Xiangqi piece', 'Turn a piece'],
    go: ['Drop a Go stone and make a ripple', 'A small ripple'],
}

// Pointer input only changes local CSS variables. The card itself stays anchored,
// and the art never needs a game engine, network request, or animation library.
export default function ProjectIllustration({ scene, reducedMotion }: { scene: Scene; reducedMotion: boolean }) {
    const id = `art-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
    const surface = useRef<HTMLButtonElement>(null)
    const frame = useRef<number | null>(null)
    const point = useRef({ x: 0, y: 0 })
    const [turn, setTurn] = useState(0)
    const active = turn % 2 === 1
    const paint = (x: number, y: number) => {
        point.current = { x, y }
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() => {
            surface.current?.style.setProperty('--px', String(reducedMotion ? 0 : x))
            surface.current?.style.setProperty('--py', String(reducedMotion ? 0 : y))
            frame.current = null
        })
    }
    const move = (event: PointerEvent<HTMLButtonElement>) => {
        if (reducedMotion || event.pointerType === 'touch') return
        const rect = event.currentTarget.getBoundingClientRect()
        paint(
            Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
            Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2))
        )
    }
    const keyMove = (event: KeyboardEvent<HTMLButtonElement>) => {
        const keys: Record<string, [number, number]> = {
            ArrowLeft: [-0.4, 0],
            ArrowRight: [0.4, 0],
            ArrowUp: [0, -0.4],
            ArrowDown: [0, 0.4],
        }
        const delta = keys[event.key]
        if (!delta) return
        event.preventDefault()
        paint(
            Math.max(-1, Math.min(1, point.current.x + delta[0])),
            Math.max(-1, Math.min(1, point.current.y + delta[1]))
        )
    }
    useEffect(() => {
        if (reducedMotion) {
            surface.current?.style.setProperty('--px', '0')
            surface.current?.style.setProperty('--py', '0')
        }
        return () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current)
        }
    }, [reducedMotion])

    return (
        <button
            ref={surface}
            type="button"
            className={`project-art art-${scene}`}
            data-active={active}
            aria-label={actions[scene][0]}
            aria-pressed={scene === 'chess' || scene === 'postcard' ? active : undefined}
            onPointerMove={move}
            onPointerLeave={() => paint(0, 0)}
            onBlur={() => paint(0, 0)}
            onKeyDown={keyMove}
            onClick={() => setTurn(value => value + 1)}
        >
            <svg viewBox="0 0 400 260" aria-hidden="true" focusable="false">
                <defs>
                    <filter id={`${id}-shadow`} x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="5" />
                    </filter>
                    <radialGradient id={`${id}-glow`}>
                        <stop stopColor="#ffffff" stopOpacity=".75" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                </defs>
                {scene === 'crown' && <Crown id={id} turn={turn} />}
                {scene === 'rift' && <Rift id={id} turn={turn} />}
                {scene === 'postcard' && <Postcard id={id} />}
                {scene === 'chess' && <Chess id={id} turn={turn} />}
                {scene === 'xiangqi' && <Xiangqi id={id} turn={turn} />}
                {scene === 'go' && <Go id={id} turn={turn} />}
            </svg>
            <span className="art-action" aria-hidden="true">
                <span className="art-action-symbol">{scene === 'postcard' ? (active ? '☀' : '☾') : '↻'}</span>
                {scene === 'postcard' && active ? 'Golden hour' : actions[scene][1]}
            </span>
        </button>
    )
}

function Spark({ x, y, size = 5 }: { x: number; y: number; size?: number }) {
    return (
        <path
            d={`M${x} ${y - size} Q${x} ${y} ${x + size} ${y} Q${x} ${y} ${x} ${y + size} Q${x} ${y} ${
                x - size
            } ${y} Q${x} ${y} ${x} ${y - size}Z`}
            fill="currentColor"
        />
    )
}

function Crown({ id, turn }: { id: string; turn: number }) {
    return (
        <>
            <defs>
                <radialGradient id={`${id}-warm`} cx="48%" cy="40%" r="70%">
                    <stop stopColor="#fff8e5" />
                    <stop offset="1" stopColor="#ecd9b6" />
                </radialGradient>
                <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#fff1b9" />
                    <stop offset=".25" stopColor="#e9b853" />
                    <stop offset=".47" stopColor="#fff0b4" />
                    <stop offset=".65" stopColor="#bb7b26" />
                    <stop offset="1" stopColor="#e8b54f" />
                </linearGradient>
                <linearGradient id={`${id}-ribbon`} x2="1" y2="1">
                    <stop stopColor="#98354a" />
                    <stop offset="1" stopColor="#50172a" />
                </linearGradient>
            </defs>
            <rect width="400" height="260" fill={`url(#${id}-warm)`} />
            <g fill="none" stroke="#b79c6a" opacity=".2">
                <circle cx="200" cy="135" r="100" />
                <circle cx="200" cy="135" r="106" />
                <path d="M200 17v13M200 240v9M83 135H70M317 135h13" />
            </g>
            <g
                className="art-depth-far"
                fill="#a37a40"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
                letterSpacing="3"
            >
                <text x="25" y="31">
                    EST. IN THE BROWSER
                </text>
            </g>
            <ellipse cx="201" cy="219" rx="77" ry="10" fill="#805126" opacity=".2" filter={`url(#${id}-shadow)`} />
            <g className="art-object">
                <g key={`ribbon-${turn}`} className="crown-ribbons">
                    <path
                        d="m149 166-48 17 14 14-5 22 67-32M253 166l46 17-14 14 5 22-67-32"
                        fill={`url(#${id}-ribbon)`}
                    />
                    <path d="m115 188 44-14m82 0 45 14" stroke="#c76e78" strokeWidth="2" fill="none" />
                </g>
                <g key={`crown-${turn}`} className="crown-lift">
                    <path
                        d="m111 104 42 28 21-50 27 44 35-49 17 52 37-23-19 82q-72 27-142 1Z"
                        fill={`url(#${id}-gold)`}
                        stroke="#b57c29"
                        strokeWidth="1.5"
                    />
                    <path
                        d="m111 104 42 28 21-50 12 101-57 6Zm90 22 35-49-12 112 47-1 19-82-37 23"
                        fill="#ffe9a8"
                        opacity=".4"
                    />
                    <path
                        d="m132 182 21-50 33 51 15-57 23 63 29-60 18 59"
                        fill="none"
                        stroke="#9c661f"
                        strokeOpacity=".4"
                    />
                    <path d="M128 174q73 27 149-1l-6 23q-70 23-138 0Z" fill={`url(#${id}-gold)`} stroke="#b57c29" />
                    <path d="M132 179q70 25 142-1M135 192q67 22 135-1" stroke="#fff3c3" strokeWidth="2" fill="none" />
                    <path d="m200 139 12 16-12 17-12-17Z" fill="#ad3c55" stroke="#fff0b9" strokeWidth="2" />
                    <path d="m200 139 1 17 11-1Z" fill="#fca8ad" />
                    <ellipse cx="150" cy="155" rx="5" ry="8" fill="#307969" stroke="#ffe9b3" strokeWidth="2" />
                    <ellipse cx="253" cy="153" rx="5" ry="8" fill="#307969" stroke="#ffe9b3" strokeWidth="2" />
                    {[
                        [111, 104],
                        [174, 82],
                        [236, 77],
                        [290, 106],
                    ].map(([x, y]) => (
                        <circle key={x} cx={x} cy={y} r="5" fill="#f8df8f" stroke="#bf8e37" />
                    ))}
                    <path
                        d="m136 117 13 10M170 101l-8 20m79-25 7 22"
                        stroke="#fff8de"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity=".8"
                    />
                </g>
            </g>
            <g key={`spark-${turn}`} className="art-sparkles" color="#b9842d">
                <Spark x={102} y={75} size={7} />
                <Spark x={302} y={154} size={8} />
                <Spark x={266} y={48} />
                <Spark x={151} y={47} size={3} />
                <Spark x={89} y={179} size={4} />
            </g>
        </>
    )
}

function Rift({ id, turn }: { id: string; turn: number }) {
    return (
        <>
            <defs>
                <radialGradient id={`${id}-rift`}>
                    <stop stopColor="#1d5266" />
                    <stop offset=".6" stopColor="#102d40" />
                    <stop offset="1" stopColor="#091b2d" />
                </radialGradient>
                <linearGradient id={`${id}-ice`} x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#e8ffff" />
                    <stop offset=".45" stopColor="#78dbe9" />
                    <stop offset="1" stopColor="#24728c" />
                </linearGradient>
                <linearGradient id={`${id}-beam`} x1="0" y1="1" x2="1" y2="0">
                    <stop stopColor="#b0ffff" stopOpacity="0" />
                    <stop offset="1" stopColor="#caffff" />
                </linearGradient>
            </defs>
            <rect width="400" height="260" fill={`url(#${id}-rift)`} />
            <g className="art-depth-far" stroke="#b99b5f" fill="none">
                <circle cx="200" cy="131" r="92" opacity=".32" />
                <circle cx="200" cy="131" r="82" opacity=".15" />
                <path d="M93 131h25m164 0h25M200 24v25m0 164v25" opacity=".6" />
                <path d="M24 48V25h23m306 0h23v23M24 212v23h23m306 0h23v-23" opacity=".6" />
            </g>
            <g opacity=".45" fill="#a5dbe2">
                {[
                    [86, 71],
                    [302, 81],
                    [66, 175],
                    [308, 196],
                    [264, 31],
                    [139, 224],
                    [333, 130],
                    [152, 52],
                ].map(([x, y]) => (
                    <circle key={x} cx={x} cy={y} r="1.1" />
                ))}
            </g>
            <g className="art-object">
                <ellipse cx="200" cy="217" rx="54" ry="7" fill="#69e5f7" opacity=".15" filter={`url(#${id}-shadow)`} />
                <g key={`crystal-${turn}`} className={turn ? 'rift-cast' : 'rift-arrive'}>
                    <path className="rift-beam" d="m170 192 30-133 13 141Z" fill={`url(#${id}-beam)`} />
                    <path d="m200 48 39 74-32 87-43-71Z" fill={`url(#${id}-ice)`} stroke="#b2f5f6" strokeWidth="1.5" />
                    <path d="m200 48-6 92-30-2Z" fill="#d4ffff" />
                    <path d="m200 48 39 74-45 18Z" fill="#8ce3ee" />
                    <path d="m194 140 13 69 32-87Z" fill="#3184a3" />
                    <path d="m194 140 13 69-43-71Z" fill="#72c8d9" />
                    <path d="m200 48-6 92 45-18m-45 18 13 69" stroke="#edffff" strokeOpacity=".75" fill="none" />
                    <path d="m201 76 19 44-21 10" fill="none" stroke="#fff" strokeWidth="2" opacity=".7" />
                    <g fill={`url(#${id}-ice)`} stroke="#a4e5e9" strokeWidth=".6">
                        <path d="m138 112 8 25-11 28-7-28Z" />
                        <path d="m265 89 8 23-12 32-8-23Z" />
                    </g>
                </g>
            </g>
            <g key={`stars-${turn}`} className="art-sparkles" color="#b6f6ff">
                <Spark x={154} y={80} size={5} />
                <Spark x={250} y={181} size={6} />
                <Spark x={287} y={111} size={3} />
            </g>
            <text x="25" y="31" fill="#b7cfd4" fontSize="8" letterSpacing="3" fontFamily="ui-monospace, monospace">
                A LITTLE FROST. A LITTLE MAGIC.
            </text>
        </>
    )
}

function Palm({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`} fill="currentColor">
            <path d="M-3 136Q8 60 0 0L5 0q15 65 9 136Z" />
            <path d="M3 1Q-32-30-68 2q36-10 63 8Q-28 2-51 40q30-24 53-29Q-8 30-7 63q11-35 15-48Q30 30 52 55 43 20 15 6q31-7 56 10Q48-15 10-2q15-25 44-30Q19-38 3-7q-10-27-36-35Q-16-22-2-2Z" />
            <path
                d="m-1 26 10 2m-7 16 9 2m-7 18 9 2m-8 18 9 2m-9 18 9 2"
                stroke="#e3b98b"
                strokeOpacity=".16"
                fill="none"
            />
        </g>
    )
}

function Postcard({ id }: { id: string }) {
    return (
        <>
            <defs>
                <linearGradient id={`${id}-sunset`} x2="0" y2="1">
                    <stop stopColor="#ee9b78" />
                    <stop offset=".55" stopColor="#f7c388" />
                    <stop offset="1" stopColor="#eed8a0" />
                </linearGradient>
                <linearGradient id={`${id}-night`} x2="0" y2="1">
                    <stop stopColor="#192b4b" />
                    <stop offset=".6" stopColor="#715677" />
                    <stop offset="1" stopColor="#bf8190" />
                </linearGradient>
                <clipPath id={`${id}-postcard`}>
                    <rect x="16" y="13" width="368" height="232" rx="3" />
                </clipPath>
            </defs>
            <rect width="400" height="260" fill="#e9dfca" />
            <g clipPath={`url(#${id}-postcard)`}>
                <rect x="16" y="13" width="368" height="232" fill={`url(#${id}-sunset)`} />
                <rect className="postcard-night" x="16" y="13" width="368" height="232" fill={`url(#${id}-night)`} />
                <g className="art-depth-far">
                    <circle className="postcard-sun" cx="300" cy="79" r="33" fill="#fff0b7" />
                    <g className="postcard-stars" fill="#ffe5be">
                        <Spark x={232} y={44} size={3} />
                        <Spark x={336} y={45} size={2} />
                        <Spark x={274} y={112} size={2} />
                        <circle cx="299" cy="78" r="24" fill="#253853" />
                    </g>
                </g>
                <path
                    d="m16 172 36-16 36 8 26-19 33 13 34-25 40 24 37-14 30 18 35-24 61 25v83H16Z"
                    fill="#a66f69"
                    opacity=".65"
                />
                <g className="art-depth-far" fill="#795659">
                    <path d="M16 197v-22h25v-12h19v31h18v-19h28v25h22v-32h31v26h25v-13h29v20h34v-34h23v17h28v-11h30v28h56v44H16Z" />
                    <path d="M53 163v-10m90 15v-13m113 12v-20" stroke="#795659" />
                </g>
                <path d="m190 176-53 69h121l-45-69Z" fill="#a58279" />
                <path d="m200 187-1 11m-4 8-3 15m-4 9-4 15" stroke="#ead6b5" strokeWidth="2" />
                <g className="postcard-lettering" fill="#593b37">
                    <text x="36" y="65" fontSize="8" letterSpacing="3" fontFamily="ui-monospace, monospace">
                        GREETINGS FROM
                    </text>
                    <text
                        x="33"
                        y="107"
                        fontSize="49"
                        fontFamily="Georgia, serif"
                        fontStyle="italic"
                        fontWeight="bold"
                        letterSpacing="-2"
                    >
                        Los Santos
                    </text>
                    <path d="M36 117q90-12 184-4" stroke="currentColor" fill="none" opacity=".3" />
                </g>
                <g className="art-depth-near" color="#3e4241">
                    <Palm x={319} y={119} scale={1.05} />
                    <Palm x={370} y={154} scale={0.7} />
                    <Palm x={58} y={170} scale={0.55} />
                </g>
                <text
                    x="35"
                    y="226"
                    fill="#f7e4be"
                    fontSize="10"
                    letterSpacing="3"
                    fontFamily="ui-monospace, monospace"
                >
                    GROVE STREET, AGAIN.
                </text>
                <path d="M25 20h348M25 237h348" stroke="#fff6dc" opacity=".28" />
            </g>
        </>
    )
}

function Chess({ id, turn }: { id: string; turn: number }) {
    return (
        <>
            <defs>
                <linearGradient id={`${id}-ivory`} x1="0" y1="0" x2="1" y2=".4">
                    <stop stopColor="#d3c2a1" />
                    <stop offset=".35" stopColor="#fff9e5" />
                    <stop offset=".65" stopColor="#eee1c3" />
                    <stop offset="1" stopColor="#af9876" />
                </linearGradient>
                <linearGradient id={`${id}-ebony`} x1="0" y1="0" x2="1" y2=".4">
                    <stop stopColor="#182b2d" />
                    <stop offset=".35" stopColor="#54716b" />
                    <stop offset=".65" stopColor="#243b38" />
                    <stop offset="1" stopColor="#10211f" />
                </linearGradient>
            </defs>
            <rect width="400" height="260" fill="#dce8e0" />
            <circle cx="202" cy="134" r="103" fill="#cfdfd5" />
            <text x="277" y="92" fontFamily="Georgia, serif" fontSize="100" fill="#b4cdbd" opacity=".5">
                N
            </text>
            <g stroke="#769788" fill="none" opacity=".3">
                <path d="m50 218 150-40 151 40M87 229l113-33 110 33M105 192l94 49m98-49-97 49" />
                <path
                    key={`trail-${turn}`}
                    className="knight-trail"
                    d="M92 153V95h51"
                    strokeWidth="1.4"
                    strokeDasharray="3 5"
                />
                <circle cx="143" cy="95" r="3" fill="#769788" />
            </g>
            <ellipse cx="204" cy="218" rx="69" ry="10" fill="#476052" opacity=".22" filter={`url(#${id}-shadow)`} />
            <g className="art-object">
                <g key={`knight-${turn}`} className="knight-turn">
                    <g className="knight-ivory" fill={`url(#${id}-ivory)`} stroke="#ad997a" strokeWidth="1.2">
                        <Knight />
                    </g>
                    <g className="knight-ebony" fill={`url(#${id}-ebony)`} stroke="#17302c" strokeWidth="1.2">
                        <Knight />
                    </g>
                    <path
                        d="M208 88q29 30 21 60-5 19-20 29M216 106q15 25 6 43m-10-34q9 21 1 32"
                        fill="none"
                        stroke="#8c795d"
                        strokeWidth="2"
                        opacity=".55"
                    />
                    <path d="m173 86 7 10m-25 26 15-2" stroke="#8c795d" strokeWidth="2" fill="none" />
                    <circle cx="183" cy="108" r="3" fill="#4d5546" />
                    <path
                        d="M170 176q-2-17 20-34M159 195h79"
                        stroke="#fff8db"
                        strokeWidth="2"
                        opacity=".45"
                        fill="none"
                    />
                </g>
            </g>
            <text x="25" y="31" fill="#5d7b6b" fontSize="8" letterSpacing="3" fontFamily="ui-monospace, monospace">
                THINK A LITTLE SIDEWAYS.
            </text>
        </>
    )
}
function Knight() {
    return (
        <>
            <path d="M159 192v-16q1-18 20-35l8-16-18 10-22-7 6-18 19-16 3-24 19 12 13-10 13 22q25 13 27 39 4 27-12 44l7 15Z" />
            <path d="M157 190h85l6 13h-98Z" />
            <rect x="146" y="203" width="107" height="13" rx="5" />
        </>
    )
}

function Xiangqi({ id, turn }: { id: string; turn: number }) {
    return (
        <>
            <defs>
                <radialGradient id={`${id}-wood`} cx="35%" cy="25%" r="80%">
                    <stop stopColor="#fff0cc" />
                    <stop offset=".6" stopColor="#e8c28c" />
                    <stop offset="1" stopColor="#bd8757" />
                </radialGradient>
            </defs>
            <rect width="400" height="260" fill="#f3e7db" />
            <g stroke="#bca58f" strokeWidth=".5" opacity=".23">
                {[53, 81, 109, 137, 165, 193, 221].map(y => (
                    <path key={y} d={`M24 ${y}h352`} />
                ))}
            </g>
            <path d="M-10 158Q100 112 202 145T410 132" fill="none" stroke="#a5b8b1" strokeWidth="24" opacity=".35" />
            <path d="M-10 157Q100 112 202 145T410 131" fill="none" stroke="#fff9ef" strokeWidth="1" opacity=".75" />
            <g fill="#927867" fontFamily="'Songti SC', 'Noto Serif CJK SC', serif" fontSize="17" letterSpacing="8">
                <text x="39" y="105">
                    楚河
                </text>
                <text x="272" y="181">
                    漢界
                </text>
            </g>
            <g className="art-depth-far">
                <g transform="translate(149 103) rotate(-17)">
                    <Disc id={id} glyph="將" color="#394341" radius={43} />
                </g>
            </g>
            <g className="art-object">
                <g transform="translate(229 163) rotate(12)">
                    <g key={`disc-${turn}`} className="xiangqi-turn">
                        <Disc id={id} glyph={['帥', '炮', '馬'][turn % 3]} color="#a12c35" radius={55} />
                    </g>
                </g>
            </g>
            <g transform="translate(311 62) rotate(9)" opacity=".6">
                <rect x="-13" y="-17" width="26" height="34" rx="3" fill="none" stroke="#af4a43" strokeWidth="2" />
                <text x="0" y="8" textAnchor="middle" fontFamily="serif" fontSize="20" fill="#af4a43">
                    棋
                </text>
            </g>
        </>
    )
}
function Disc({ id, glyph, color, radius }: { id: string; glyph: string; color: string; radius: number }) {
    return (
        <>
            <ellipse
                cx="2"
                cy="15"
                rx={radius}
                ry={radius - 4}
                fill="#796049"
                opacity=".2"
                filter={`url(#${id}-shadow)`}
            />
            <circle cy="7" r={radius} fill="#b7804f" />
            <circle r={radius} fill={`url(#${id}-wood)`} stroke="#d0a377" strokeWidth="1.4" />
            <circle r={radius - 7} fill="none" stroke={color} strokeWidth="1.5" opacity=".7" />
            <circle r={radius - 11} fill="none" stroke={color} strokeWidth=".7" opacity=".3" />
            <path
                d={`M${-radius * 0.65} ${-radius * 0.45}Q0 ${-radius * 1.12} ${radius * 0.67} ${-radius * 0.43}`}
                stroke="#fff5d7"
                fill="none"
                strokeWidth="2"
                opacity=".6"
            />
            <text
                x="0"
                y="4"
                dominantBaseline="middle"
                textAnchor="middle"
                fill={color}
                fontSize={radius * 1.08}
                fontWeight="600"
                fontFamily="'Songti SC', 'Noto Serif CJK SC', serif"
            >
                {glyph}
            </text>
        </>
    )
}

function Go({ id, turn }: { id: string; turn: number }) {
    return (
        <>
            <defs>
                <radialGradient id={`${id}-black`} cx="32%" cy="23%" r="75%">
                    <stop stopColor="#7c898d" />
                    <stop offset=".3" stopColor="#34434b" />
                    <stop offset=".72" stopColor="#13242d" />
                    <stop offset="1" stopColor="#071922" />
                </radialGradient>
                <radialGradient id={`${id}-white`} cx="30%" cy="20%" r="80%">
                    <stop stopColor="#ffffff" />
                    <stop offset=".6" stopColor="#f7f3e9" />
                    <stop offset="1" stopColor="#b9bdb7" />
                </radialGradient>
            </defs>
            <rect width="400" height="260" fill="#e8ece9" />
            <g className="art-depth-far" fill="none" stroke="#8b9f9a">
                <path
                    d="M285 91c-40-65-139-55-163 10-29 78 67 133 136 89 33-22 35-61 22-85"
                    strokeWidth="8"
                    opacity=".12"
                    strokeLinecap="round"
                />
                <path
                    d="M281 91c-40-65-139-55-163 10-29 78 67 133 136 89 33-22 35-61 22-85"
                    strokeWidth="1"
                    opacity=".15"
                />
            </g>
            <g key={`ripple-${turn}`} className="go-ripples" fill="none" stroke="#6b9396" strokeWidth="1">
                <ellipse className="go-ring go-ring-1" cx="183" cy="159" rx="62" ry="38" />
                <ellipse className="go-ring go-ring-2" cx="183" cy="159" rx="62" ry="38" />
                <ellipse className="go-ring go-ring-3" cx="183" cy="159" rx="62" ry="38" />
            </g>
            <g className="go-white art-depth-far">
                <ellipse cx="253" cy="184" rx="40" ry="24" fill="#354c4c" opacity=".18" filter={`url(#${id}-shadow)`} />
                <ellipse cx="250" cy="170" rx="39" ry="33" fill={`url(#${id}-white)`} />
                <path
                    d="M226 157q12-17 34-10"
                    stroke="#fff"
                    strokeWidth="3"
                    opacity=".8"
                    fill="none"
                    strokeLinecap="round"
                />
            </g>
            <g className="art-object">
                <g key={`stone-${turn}`} className="go-drop">
                    <ellipse
                        cx="180"
                        cy="163"
                        rx="51"
                        ry="29"
                        fill="#153c43"
                        opacity=".2"
                        filter={`url(#${id}-shadow)`}
                    />
                    <ellipse cx="178" cy="144" rx="50" ry="43" fill={`url(#${id}-black)`} />
                    <path
                        d="M150 126q12-17 35-14"
                        fill="none"
                        stroke="#d6e1db"
                        strokeWidth="2.5"
                        opacity=".28"
                        strokeLinecap="round"
                    />
                </g>
            </g>
            <text x="25" y="31" fill="#687f7e" fontSize="8" letterSpacing="3" fontFamily="ui-monospace, monospace">
                ONE STONE. MANY POSSIBILITIES.
            </text>
        </>
    )
}
