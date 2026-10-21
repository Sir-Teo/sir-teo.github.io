import { useState } from 'react'

const targets = [
    { x: 214, y: 72 },
    { x: 304, y: 119 },
    { x: 280, y: 207 },
]
export default function Rift() {
    const [health, setHealth] = useState([2, 2, 2])
    const [shot, setShot] = useState({ target: -1, id: 0 })
    const won = health.every(h => !h)
    const score = 6 - health.reduce((a, b) => a + b, 0)
    return (
        <>
            <div className="mini-stage mini-rift">
                <div className="mini-scene-label">
                    <span>ASHE · TARGET PRACTICE</span>
                    <span>{score} / 6 HITS</span>
                </div>
                <svg viewBox="0 0 400 270" className="mini-scene" aria-hidden>
                    <rect width="400" height="270" fill="#183b3b" />
                    <path
                        d="M-20 260 130 153 201 90 330-20M130 153l170 90 120-52"
                        fill="none"
                        stroke="#2e5550"
                        strokeWidth="78"
                    />
                    <path
                        d="M-20 260 130 153 201 90 330-20M130 153l170 90 120-52"
                        fill="none"
                        stroke="#57746a"
                        strokeWidth="49"
                    />
                    <path
                        d="M-20 260 130 153 201 90 330-20M130 153l170 90 120-52"
                        fill="none"
                        stroke="#708377"
                        strokeWidth="1"
                        strokeDasharray="5 13"
                    />
                    {[
                        { x: 37, y: 75 },
                        { x: 72, y: 54 },
                        { x: 105, y: 75 },
                        { x: 346, y: 50 },
                        { x: 371, y: 80 },
                        { x: 372, y: 230 },
                        { x: 166, y: 248 },
                    ].map(({ x, y }) => (
                        <g key={x} transform={`translate(${x} ${y})`}>
                            <ellipse cy="18" rx="22" ry="9" fill="#0c292b" />
                            <path d="m0-33 24 39h-48Zm0-15 20 36h-40Z" fill="#24554a" />
                            <path d="m0-48 20 36H0Z" fill="#1d493e" />
                        </g>
                    ))}
                    <circle cx="85" cy="190" r="42" fill="#51afce" opacity="0.08" stroke="#6cc9df" />
                    <ellipse cx="85" cy="204" rx="16" ry="7" fill="#102e34" />
                    <path d="m85 166-16 34 17-5 14 6-7-30Z" fill="#4199be" />
                    <path d="m85 163-9 14 20-1Z" fill="#9bd3e5" />
                    <circle cx="85" cy="178" r="5" fill="#dfc6a3" />
                    <path d="M104 170q18 18 0 34M104 170v34M96 188h25" fill="none" stroke="#b7e9f5" strokeWidth="2" />
                    {shot.target >= 0 && (
                        <path
                            key={shot.id}
                            className="mini-arrow-shot"
                            d={`M112 188L${targets[shot.target].x} ${targets[shot.target].y}`}
                            stroke="#c0f1ff"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    )}
                </svg>
                {targets.map(({ x, y }, i) => (
                    <button
                        type="button"
                        key={i}
                        className={`mini-dummy ${health[i] ? '' : 'is-down'}`}
                        disabled={!health[i]}
                        style={{ left: `${x / 4}%`, top: `${y / 2.7}%` }}
                        aria-label={`Shoot target ${i + 1}, ${health[i]} health remaining`}
                        onClick={() => {
                            setHealth(h => h.map((value, n) => (n === i ? Math.max(0, value - 1) : value)))
                            setShot(s => ({ target: i, id: s.id + 1 }))
                        }}
                    >
                        <span className="mini-health">
                            <i style={{ width: `${health[i] * 50}%` }} />
                        </span>
                        <svg viewBox="0 0 50 66" aria-hidden>
                            <path d="M25 23V61M9 34h32" stroke="#a99869" strokeWidth="5" />
                            <circle cx="25" cy="24" r="16" fill="#c2a67d" stroke="#79654d" strokeWidth="3" />
                            <circle cx="25" cy="24" r="10" fill="#a94f4d" />
                            <circle cx="25" cy="24" r="4" fill="#e5c999" />
                        </svg>
                    </button>
                ))}
                {won && <span className="mini-celebration">Perfect volley ✓</span>}
            </div>
            <p className="mini-hint" role="status">
                {won ? 'Six arrows. Three targets. Ready for the Rift?' : 'Click a target to fire an enchanted arrow.'}
            </p>
        </>
    )
}
