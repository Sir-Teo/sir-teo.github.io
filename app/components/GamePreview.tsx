'use client'

import { useRef, useState } from 'react'

const captures = {
    crown: [
        {
            label: 'Village',
            image: '/previews/crown-clan.webp',
            alt: 'The actual Crown & Clan village, with its town hall, defenses and army camp',
        },
        {
            label: 'Raid',
            image: '/previews/crown-raid.webp',
            alt: 'Crown & Clan’s Goblin Forest raid, with troop deployment controls',
        },
    ],
    rift: [
        {
            label: 'Ashe',
            image: '/previews/summoners-rift.webp',
            alt: 'Ashe at the blue fountain in the actual browser Summoner’s Rift',
        },
        {
            label: 'Lux',
            image: '/previews/rift-lux.webp',
            alt: 'Lux practice in the browser game, with her abilities and minimap',
        },
    ],
    postcard: [
        {
            label: 'On foot',
            image: '/previews/gta-grove.webp',
            alt: 'CJ on foot at the start of the actual browser San Andreas, with its native terrain and HUD',
        },
        {
            label: 'Driving',
            image: '/previews/gta-driving.webp',
            alt: 'Driving a Greenwood in the actual browser San Andreas',
        },
    ],
}

export default function GamePreview({ scene, onPlay }: { scene: keyof typeof captures; onPlay: () => void }) {
    const [selected, setSelected] = useState(0)
    const [zoom, setZoom] = useState(false)
    const [point, setPoint] = useState({ x: 50, y: 50 })
    const stage = useRef<HTMLDivElement>(null)
    const capture = captures[scene][selected]
    const clamp = (n: number) => Math.max(0, Math.min(100, n))

    return (
        <div className="actual-game-preview">
            <div
                ref={stage}
                className="game-capture"
                data-zoom={zoom}
                role="group"
                tabIndex={zoom ? 0 : -1}
                aria-label={`${capture.label} screenshot${
                    zoom ? '. Move the pointer, drag, or use arrow keys to look around.' : ''
                }`}
                onPointerDown={event => {
                    if (zoom && event.isPrimary) event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerMove={event => {
                    if (!zoom || !event.isPrimary || (event.pointerType !== 'mouse' && !event.buttons)) return
                    const rect = event.currentTarget.getBoundingClientRect()
                    setPoint({
                        x: clamp(((event.clientX - rect.left) / rect.width) * 100),
                        y: clamp(((event.clientY - rect.top) / rect.height) * 100),
                    })
                }}
                onKeyDown={event => {
                    const directions: Record<string, [number, number]> = {
                        ArrowLeft: [-10, 0],
                        ArrowRight: [10, 0],
                        ArrowUp: [0, -10],
                        ArrowDown: [0, 10],
                    }
                    const direction = directions[event.key]
                    if (!zoom || !direction) return
                    event.preventDefault()
                    setPoint(p => ({ x: clamp(p.x + direction[0]), y: clamp(p.y + direction[1]) }))
                }}
            >
                {/* Only this capture is mounted: other scenes download when selected. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={capture.image}
                    src={capture.image}
                    alt={capture.alt}
                    width={1000}
                    height={625}
                    draggable={false}
                    style={{ transform: zoom ? 'scale(2.4)' : 'none', transformOrigin: `${point.x}% ${point.y}%` }}
                />
                <span className="game-capture-label">{zoom ? 'MOVE TO LOOK AROUND' : 'IN-APP CAPTURE'}</span>
            </div>
            <div className="game-capture-controls">
                <div className="game-capture-scenes" role="group" aria-label="Game screenshots">
                    {captures[scene].map((item, index) => (
                        <button
                            key={item.image}
                            type="button"
                            aria-pressed={selected === index}
                            onClick={() => {
                                setSelected(index)
                                setPoint({ x: 50, y: 50 })
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="game-capture-zoom"
                    aria-label="Look closer"
                    aria-pressed={zoom}
                    onClick={() => {
                        setZoom(!zoom)
                        setPoint({ x: 50, y: 50 })
                        if (!zoom) stage.current?.focus({ preventScroll: true })
                    }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="17"
                        height="17"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                    >
                        <circle cx="10" cy="10" r="6.5" />
                        <path d="m15 15 6 6M7 10h6" />
                        {!zoom && <path d="M10 7v6" />}
                    </svg>
                </button>
            </div>
            <button type="button" className="game-play-here" onClick={onPlay}>
                <span>
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                        <path d="m4 2 9 6-9 6Z" />
                    </svg>
                    Play here
                </span>
                <span>Loads the full game ↗</span>
            </button>
        </div>
    )
}
