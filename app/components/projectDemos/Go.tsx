import { useState } from 'react'
import { goPuzzle, playGo } from '../../lib/previewGames'
import Board from './Board'

export default function Go() {
    const [board, setBoard] = useState(goPuzzle)
    const [captured, setCaptured] = useState(0)
    const [last, setLast] = useState(-1)
    const [hint, setHint] = useState('Black to play. Take the three white stones.')
    return (
        <>
            <div className="mini-stage mini-go-stage">
                <Board
                    rows={9}
                    columns={9}
                    initial={49}
                    label="Go capture puzzle. Play black at an empty intersection. Arrow keys move between intersections."
                    className="mini-go"
                    cell={i => ({
                        label: `${'ABCDEFGHJ'[i % 9]}${9 - Math.floor(i / 9)}, ${board[i] ?? 'empty'}`,
                        content: board[i] && (
                            <span className={`go-stone ${board[i]}`}>{last === i && <span className="go-last" />}</span>
                        ),
                    })}
                    onPlay={i => {
                        if (captured) return
                        const result = playGo(board, i)
                        if (!result) {
                            setHint('Choose an empty intersection with a liberty.')
                            return
                        }
                        setBoard(result.board)
                        setLast(i)
                        setCaptured(result.captured)
                        setHint(
                            result.captured
                                ? 'Three stones captured. That was their last liberty.'
                                : 'Look for the last open point beside the white group.'
                        )
                    }}
                >
                    <svg viewBox="0 0 270 270" aria-hidden className="mini-board-art">
                        <rect width="270" height="270" rx="8" fill="#d9b77b" />
                        <g stroke="#81633d" strokeWidth="0.8">
                            {Array.from({ length: 9 }, (_, i) => (
                                <path key={i} d={`M15 ${15 + i * 30}H255M${15 + i * 30} 15V255`} />
                            ))}
                        </g>
                        {[60, 180].flatMap(x =>
                            [60, 180].map(y => (
                                <circle key={`${x}-${y}`} cx={x + 15} cy={y + 15} r="2" fill="#654c30" />
                            ))
                        )}
                        <circle cx="135" cy="135" r="2" fill="#654c30" />
                    </svg>
                </Board>
                {captured > 0 && <span className="mini-celebration">+{captured} stones ✓</span>}
            </div>
            <p className="mini-hint" role="status">
                {hint}
            </p>
        </>
    )
}
