import { useState } from 'react'

function House({ level = 1 }: { level?: number }) {
    return (
        <svg viewBox="0 0 80 80" aria-hidden>
            <ellipse cx="40" cy="68" rx="33" ry="9" fill="#243d2e" opacity="0.3" />
            <path d="M14 38 40 24 66 38V60L40 74 14 60Z" fill="#dfc89c" />
            <path d="M40 49 66 35V60L40 74Z" fill="#b09875" />
            <path d="M8 39 40 9 72 39 40 55Z" fill={level === 2 ? '#d5a53f' : '#ad5642'} />
            <path d="M40 9 72 39 40 55Z" fill={level === 2 ? '#997526' : '#813c36'} />
            <path d="M25 56v11l10 5V60Z" fill="#5b4737" />
            <path d="m49 57 7-4v7l-7 4Z" fill="#f7dd7a" />
            {level === 2 && (
                <>
                    <path d="M40 9V0" stroke="#6c4f2b" strokeWidth="2" />
                    <path d="M41 0h17l-4 5H41Z" fill="#f3c64c" />
                </>
            )}
        </svg>
    )
}

const plots = [
    { x: 116, y: 150 },
    { x: 242, y: 174 },
    { x: 158, y: 198 },
]
export default function Village() {
    const [gold, setGold] = useState(60)
    const [built, setBuilt] = useState<number[]>([])
    const [hint, setHint] = useState('Collect gold. Build your little kingdom.')
    return (
        <>
            <div className="mini-stage mini-village">
                <div className="mini-scene-label">
                    <span>YOUR LITTLE KINGDOM</span>
                    <span className="mini-gold">● {gold} gold</span>
                </div>
                <svg className="mini-scene" viewBox="0 0 400 270" aria-hidden>
                    <defs>
                        <radialGradient id="village-glow">
                            <stop stopColor="#c4d5a1" />
                            <stop offset="1" stopColor="#829e75" />
                        </radialGradient>
                    </defs>
                    <rect width="400" height="270" fill="url(#village-glow)" />
                    <ellipse cx="200" cy="181" rx="176" ry="70" fill="#507449" opacity="0.3" />
                    {Array.from({ length: 16 }, (_, i) => {
                        const x = 200 + ((i % 4) - Math.floor(i / 4)) * 42
                        const y = 66 + ((i % 4) + Math.floor(i / 4)) * 24
                        return (
                            <path
                                key={i}
                                d={`M${x} ${y}l42 24-42 24-42-24Z`}
                                fill={i % 3 ? '#89a66c' : '#99b778'}
                                stroke="#75935e"
                                strokeWidth="0.8"
                            />
                        )
                    })}
                    <path d="M200 114 74 186M200 114l126 72" stroke="#c4b789" strokeWidth="10" />
                    {[
                        { x: 52, y: 122 },
                        { x: 336, y: 146 },
                        { x: 95, y: 92 },
                        { x: 302, y: 100 },
                    ].map(({ x, y }) => (
                        <g key={x} transform={`translate(${x} ${y})`}>
                            <path d="M0 0V23" stroke="#695741" strokeWidth="5" />
                            <path d="m0-35 17 33h-34Zm0-12 14 29h-28Z" fill="#385d49" />
                            <path d="m0-47 14 29H0Z" fill="#2c4e3e" />
                        </g>
                    ))}
                </svg>
                <div className="mini-townhall">
                    <House level={2} />
                </div>
                <button
                    type="button"
                    className="mini-mine"
                    onClick={() => {
                        setGold(g => g + 20)
                        setHint('+20 gold. A busy little mine.')
                    }}
                    aria-label="Collect 20 gold"
                >
                    <svg viewBox="0 0 65 60" aria-hidden>
                        <path d="m5 43 14-29 22-7 18 36-23 13Z" fill="#6c776d" />
                        <path d="m19 14 22-7 18 36-23 13 8-24Z" fill="#505c55" />
                        <path d="M22 43V31q10-16 21 0v16Z" fill="#293d36" />
                        <path d="M20 43V31q12-19 25 0v16" fill="none" stroke="#b59a67" strokeWidth="4" />
                        <ellipse cx="32" cy="48" rx="11" ry="4" fill="#eac157" />
                    </svg>
                    <span>+20 ●</span>
                </button>
                {plots.map((plot, i) => {
                    const cost = 30 + i * 20
                    const ready = built.includes(i)
                    return (
                        <button
                            type="button"
                            key={i}
                            className={`mini-plot ${ready ? 'is-built' : ''}`}
                            style={{ left: `${plot.x / 4}%`, top: `${plot.y / 2.7}%` }}
                            disabled={ready || gold < cost}
                            aria-label={ready ? `Cottage ${i + 1} built` : `Build cottage ${i + 1} for ${cost} gold`}
                            onClick={() => {
                                if (gold < cost || ready) return
                                setGold(g => g - cost)
                                setBuilt(b => [...b, i])
                                setHint(
                                    built.length === 2
                                        ? 'A kingdom of your own. Long live the builder!'
                                        : 'Home sweet home. Keep building.'
                                )
                            }}
                        >
                            {ready ? (
                                <House />
                            ) : (
                                <>
                                    <span className="mini-plot-plus">+</span>
                                    <span>{cost} ●</span>
                                </>
                            )}
                        </button>
                    )
                })}
                {built.length === 3 && <span className="mini-celebration">Village complete ✓</span>}
            </div>
            <p className="mini-hint" role="status">
                {hint}
            </p>
        </>
    )
}
