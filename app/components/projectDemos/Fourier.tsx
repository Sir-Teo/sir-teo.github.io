import { useEffect, useState } from 'react'

export default function Fourier() {
    const [harmonics, setHarmonics] = useState(3)
    const [phase, setPhase] = useState(0.7)
    const [playing, setPlaying] = useState(false)
    useEffect(() => {
        if (!playing) return
        const timer = window.setInterval(() => setPhase(p => (p + 0.045) % (Math.PI * 2)), 32)
        return () => window.clearInterval(timer)
    }, [playing])
    let x = 86
    let y = 122
    const circles = Array.from({ length: harmonics }, (_, i) => {
        const n = i * 2 + 1
        const radius = 45 / n
        const previous = { x, y }
        x += radius * Math.cos(n * phase)
        y += radius * Math.sin(n * phase)
        return (
            <g key={n}>
                <circle cx={previous.x} cy={previous.y} r={radius} fill="none" stroke="#6b718e" strokeWidth="0.8" />
                <path d={`M${previous.x} ${previous.y}L${x} ${y}`} stroke="#c4b5fd" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="2" fill="#e9d5ff" />
            </g>
        )
    })
    const wave = Array.from({ length: 161 }, (_, i) => {
        let value = 0
        for (let j = 0; j < harmonics; j++) {
            const n = j * 2 + 1
            value += (45 / n) * Math.sin(n * (phase - i / 28))
        }
        return `${i ? 'L' : 'M'}${180 + i * 1.2} ${122 + value}`
    }).join(' ')
    return (
        <>
            <div className="mini-stage mini-fourier">
                <div className="mini-scene-label">
                    <span>THE SHAPE OF SOUND</span>
                    <span>01 / FOURIER</span>
                </div>
                <svg
                    viewBox="0 0 400 230"
                    aria-label={`${harmonics} rotating circles adding up to a waveform`}
                    role="img"
                >
                    <defs>
                        <pattern id="fourier-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M20 0H0V20" fill="none" stroke="#272a3e" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="400" height="230" fill="url(#fourier-grid)" />
                    <path d="M24 122H377" stroke="#4b5069" strokeWidth="0.7" />
                    {circles}
                    <path d={`M${x} ${y}H180`} stroke="#8e93b2" strokeDasharray="3 4" />
                    <path d={wave} fill="none" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="180" cy={y} r="4" fill="#f5d47a" />
                    <text x="86" y="213" textAnchor="middle" fill="#888fae" fontSize="10">
                        circles
                    </text>
                    <text x="275" y="213" textAnchor="middle" fill="#888fae" fontSize="10">
                        become a wave
                    </text>
                </svg>
                <div className="mini-fourier-controls">
                    <button
                        type="button"
                        className="mini-control"
                        onClick={() => setPlaying(!playing)}
                        aria-label={playing ? 'Pause wave animation' : 'Play wave animation'}
                    >
                        {playing ? 'Ⅱ' : '▶'}
                    </button>
                    <label htmlFor="mini-harmonics">
                        {harmonics} {harmonics === 1 ? 'circle' : 'circles'}
                    </label>
                    <input
                        id="mini-harmonics"
                        aria-label="Number of harmonics"
                        type="range"
                        min="1"
                        max="7"
                        value={harmonics}
                        onChange={e => setHarmonics(Number(e.target.value))}
                    />
                </div>
            </div>
            <p className="mini-hint">Add circles. Watch a square wave take shape.</p>
        </>
    )
}
