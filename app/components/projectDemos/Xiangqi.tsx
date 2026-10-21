import { useState } from 'react'
import { cannonCanCapture } from '../../lib/previewGames'
import Board from './Board'

const pieces: Record<number, string> = { 4: '將', 13: '車', 40: '兵', 67: '炮', 85: '帥' }
const names: Record<number, string> = {
    4: 'black general',
    13: 'black chariot',
    40: 'red soldier',
    67: 'red cannon',
    85: 'red general',
}

export default function Xiangqi() {
    const [selected, setSelected] = useState(false)
    const [won, setWon] = useState(false)
    const [hint, setHint] = useState('Can your cannon jump the soldier to capture?')
    return (
        <>
            <div className="mini-stage mini-xiangqi-stage">
                <Board
                    rows={10}
                    columns={9}
                    initial={67}
                    label="Xiangqi cannon puzzle. Select the red cannon, then a target. Arrow keys move between points."
                    className="mini-xiangqi"
                    cell={i => ({
                        label: `${'abcdefghi'[i % 9]}${9 - Math.floor(i / 9)}, ${
                            won && i === 13 ? 'red cannon' : won && i === 67 ? 'empty' : names[i] ?? 'empty'
                        }`,
                        content: (won && i === 13 ? '炮' : won && i === 67 ? null : pieces[i]) && (
                            <span
                                className={`xiangqi-piece ${i >= 40 || (won && i === 13) ? 'red' : ''} ${
                                    selected && i === 67 ? 'chosen' : ''
                                }`}
                            >
                                {won && i === 13 ? '炮' : pieces[i]}
                            </span>
                        ),
                    })}
                    onPlay={i => {
                        if (won) return
                        if (i === 67) {
                            setSelected(!selected)
                            setHint('A cannon captures over exactly one screen.')
                            return
                        }
                        if (!selected) {
                            setHint('Select the red cannon (炮) first.')
                            return
                        }
                        if (i === 13 && cannonCanCapture(67, i, new Set(Object.keys(pieces).map(Number)))) {
                            setWon(true)
                            setSelected(false)
                            setHint('One screen. One capture. Nicely done.')
                        } else setHint('Aim for the black chariot (車) above the river.')
                    }}
                >
                    <svg viewBox="0 0 252 280" aria-hidden className="mini-board-art">
                        <rect width="252" height="280" rx="8" fill="#d9b77b" />
                        <g stroke="#836136" strokeWidth="0.8" fill="none">
                            {Array.from({ length: 10 }, (_, y) => (
                                <path key={y} d={`M14 ${14 + y * 28}H238`} />
                            ))}
                            {Array.from({ length: 9 }, (_, x) => (
                                <path key={x} d={`M${14 + x * 28} 14V126 M${14 + x * 28} 154V266`} />
                            ))}
                            <path d="M14 126V154M238 126V154M98 14l56 56m-56 0 56-56M98 210l56 56m-56 0 56-56" />
                        </g>
                        <text x="64" y="144" fill="#876232" fontSize="12" letterSpacing="8">
                            楚河
                        </text>
                        <text x="164" y="144" fill="#876232" fontSize="12" letterSpacing="8">
                            漢界
                        </text>
                    </svg>
                </Board>
                {won && <span className="mini-celebration">Cannon capture ✓</span>}
            </div>
            <p className="mini-hint" role="status">
                {hint}
            </p>
        </>
    )
}
