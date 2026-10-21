import { useEffect, useRef, useState } from 'react'
import { CITY_STOPS, START_CAR, drive, type DriveKey } from '../../lib/previewGames'

const keyMap: Record<string, DriveKey> = {
    ArrowUp: 'up',
    w: 'up',
    ArrowDown: 'down',
    s: 'down',
    ArrowLeft: 'left',
    a: 'left',
    ArrowRight: 'right',
    d: 'right',
}
const controls: { key: DriveKey; symbol: string; label: string }[] = [
    { key: 'left', symbol: '↶', label: 'Steer left' },
    { key: 'up', symbol: '↑', label: 'Drive forward' },
    { key: 'down', symbol: '↓', label: 'Reverse' },
    { key: 'right', symbol: '↷', label: 'Steer right' },
]

export default function City() {
    const [car, setCar] = useState(START_CAR)
    const [collected, setCollected] = useState<number[]>([])
    const keys = useRef(new Set<DriveKey>())
    const timer = useRef<number | null>(null)
    const stop = () => {
        keys.current.clear()
        if (timer.current !== null) window.clearInterval(timer.current)
        timer.current = null
    }
    const hold = (key: DriveKey) => {
        keys.current.add(key)
        if (timer.current !== null) return
        timer.current = window.setInterval(() => setCar(c => drive(c, keys.current, 0.04)), 40)
    }
    const release = (key: DriveKey) => {
        keys.current.delete(key)
        if (!keys.current.size) stop()
    }
    useEffect(() => {
        window.addEventListener('blur', stop)
        const hide = () => {
            if (document.hidden) stop()
        }
        document.addEventListener('visibilitychange', hide)
        return () => {
            stop()
            window.removeEventListener('blur', stop)
            document.removeEventListener('visibilitychange', hide)
        }
    }, [])
    useEffect(() => {
        const near = CITY_STOPS.findIndex(point => Math.hypot(point.x - car.x, point.y - car.y) < 22)
        if (near >= 0) setCollected(previous => (previous.includes(near) ? previous : [...previous, near]))
    }, [car.x, car.y])
    return (
        <>
            <div
                className="mini-stage mini-city"
                role="group"
                aria-label="Driving playground. Hold up or W to drive, left and right or A and D to steer, down or S to reverse."
                onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) stop()
                }}
                onKeyDown={event => {
                    const key = keyMap[event.key]
                    if (!key) return
                    event.preventDefault()
                    event.stopPropagation()
                    hold(key)
                }}
                onKeyUp={event => {
                    const key = keyMap[event.key]
                    if (!key) return
                    event.preventDefault()
                    release(key)
                }}
            >
                <div className="mini-scene-label">
                    <span>LOS SANTOS · AFTER HOURS</span>
                    <span>{collected.length} / 3 STOPS</span>
                </div>
                <svg
                    viewBox="0 0 400 270"
                    className="mini-scene"
                    aria-label={`Car at ${Math.round(car.x)}, ${Math.round(car.y)}. ${
                        collected.length
                    } of 3 stops collected.`}
                    role="img"
                >
                    <rect width="400" height="270" fill="#b6a487" />
                    <path
                        d="M64 48H336V208H64ZM200 48V208"
                        stroke="#c7bcaa"
                        strokeWidth="58"
                        fill="none"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M64 48H336V208H64ZM200 48V208"
                        stroke="#4b5258"
                        strokeWidth="40"
                        fill="none"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M64 48H336V208H64ZM200 48V208"
                        stroke="#b8ac8e"
                        strokeWidth="1"
                        strokeDasharray="6 8"
                        fill="none"
                    />
                    {[110, 247].map(x => (
                        <g key={x}>
                            <rect x={x - 7} y="86" width="59" height="83" rx="3" fill="#88936b" />
                            <rect x={x} y="93" width="46" height="40" rx="2" fill="#756252" />
                            <path d={`M${x - 3} 95h52l-7 19h-39Z`} fill="#b3785a" />
                            <rect x={x + 4} y="143" width="16" height="18" fill="#6da8a8" />
                            <rect x={x + 26} y="144" width="18" height="18" fill="#d7c7a1" />
                            <path d={`M${x + 28} 114v19m-28-19h46`} stroke="#8b583f" />
                        </g>
                    ))}
                    {[
                        { x: 25, y: 84 },
                        { x: 377, y: 182 },
                        { x: 162, y: 168 },
                        { x: 238, y: 250 },
                        { x: 300, y: 16 },
                    ].map(({ x, y }) => (
                        <g key={x} transform={`translate(${x} ${y})`}>
                            <circle cx="4" cy="6" r="14" fill="#69664f" opacity="0.25" />
                            <path
                                d="M0 0q-20-20-19 3Q-4-3 0 0q14-24 20-8Q7-7 0 0q23 3 13 18Q10 5 0 0q-8 21-19 10Q-8 8 0 0"
                                fill="#496e54"
                            />
                            <circle r="3" fill="#7e6947" />
                        </g>
                    ))}
                    {CITY_STOPS.map(
                        ({ x, y }, i) =>
                            !collected.includes(i) && (
                                <g key={i} transform={`translate(${x} ${y})`}>
                                    <circle r="13" fill="#ebca76" opacity="0.22" />
                                    <path d="m0-8 2.4 5.3 5.6.7-4 4 1 6-5-2.8L-5 8l1-6-4-4 5.6-.7Z" fill="#f4d178" />
                                </g>
                            )
                    )}
                    <g transform={`translate(${car.x} ${car.y}) rotate(${(car.angle * 180) / Math.PI})`}>
                        <rect x="-13" y="-6" width="28" height="15" rx="4" fill="#202d30" opacity="0.3" />
                        <rect
                            x="-15"
                            y="-8"
                            width="30"
                            height="16"
                            rx="4"
                            fill="#77bcc0"
                            stroke="#3c6266"
                            strokeWidth="1"
                        />
                        <path d="M2-6h5v12H2ZM-9-6h3v12h-3Z" fill="#28494e" />
                        <rect x="-5" y="-6" width="7" height="12" rx="1" fill="#a0d2ce" />
                        <path d="M13-6v3m0 6v3" stroke="#fff2bc" strokeWidth="2" />
                    </g>
                </svg>
                <div className="mini-drive-controls">
                    {controls.map(({ key, label, symbol }) => (
                        <button
                            type="button"
                            key={key}
                            className="mini-control"
                            aria-label={label}
                            onPointerDown={e => {
                                e.currentTarget.setPointerCapture(e.pointerId)
                                hold(key)
                            }}
                            onPointerUp={() => release(key)}
                            onPointerCancel={() => release(key)}
                            onLostPointerCapture={() => release(key)}
                            onKeyDown={e => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault()
                                    hold(key)
                                }
                            }}
                            onKeyUp={e => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault()
                                    release(key)
                                }
                            }}
                        >
                            {symbol}
                        </button>
                    ))}
                </div>
                {collected.length === 3 && <span className="mini-celebration">Neighborhood tour ✓</span>}
            </div>
            <p className="mini-hint" role="status">
                {collected.length === 3
                    ? 'All three stops. Keep cruising.'
                    : 'Hold ↑ to drive, ← → to steer. Collect the stars.'}
            </p>
        </>
    )
}
