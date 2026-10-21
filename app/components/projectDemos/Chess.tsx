import { useState } from 'react'
import { rookMoves } from '../../lib/previewGames'
import Board from './Board'

const PIECES: Record<number, string> = { 6: '♚', 13: '♟', 14: '♟', 15: '♟', 60: '♜', 62: '♚' }
const NAMES: Record<number, string> = {
    6: 'black king',
    13: 'black pawn',
    14: 'black pawn',
    15: 'black pawn',
    60: 'white rook',
    62: 'white king',
}

export default function Chess() {
    const [selected, setSelected] = useState(false)
    const [won, setWon] = useState(false)
    const [hint, setHint] = useState('White to move. Find mate in one.')
    const legal = rookMoves(60, PIECES)
    return (
        <>
            <div className="mini-stage mini-chess-stage">
                <Board
                    rows={8}
                    columns={8}
                    initial={60}
                    label="Chess puzzle. Select the white rook, then its destination. Arrow keys move between squares."
                    className={`mini-chess ${won ? 'mini-won' : ''}`}
                    cell={i => {
                        const piece = won ? (i === 4 ? '♜' : i === 60 ? '' : PIECES[i]) : PIECES[i]
                        const square = `${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}`
                        return {
                            label: `${square}, ${
                                won && i === 4 ? 'white rook' : won && i === 60 ? 'empty' : NAMES[i] ?? 'empty'
                            }`,
                            className: `${(i + Math.floor(i / 8)) % 2 ? 'chess-dark' : 'chess-light'} ${
                                i >= 56 || (won && i === 4) ? 'chess-white-piece' : 'chess-black-piece'
                            } ${selected && i === 60 ? 'mini-selected' : ''}`,
                            content: (
                                <>
                                    {piece}
                                    {!won && selected && legal.includes(i) && <span className="mini-move-dot" />}
                                </>
                            ),
                        }
                    }}
                    onPlay={i => {
                        if (won) return
                        if (i === 60) {
                            setSelected(!selected)
                            setHint('Where can the rook deliver checkmate?')
                            return
                        }
                        if (!selected) {
                            setHint('Start with the white rook on e1.')
                            return
                        }
                        if (!legal.includes(i)) {
                            setHint('The rook moves in a straight line.')
                            return
                        }
                        if (i === 4) {
                            setWon(true)
                            setSelected(false)
                            setHint('Re8# — a perfect back-rank mate.')
                            return
                        }
                        setHint('Almost. Look along the back rank.')
                    }}
                />
                {won && <span className="mini-celebration">Checkmate ✓</span>}
            </div>
            <p className="mini-hint" role="status">
                {hint}
            </p>
        </>
    )
}
