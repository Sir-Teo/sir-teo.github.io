import { Chess } from 'chess.js'
import { parseFenBoard, START_FEN, validateMoveStr, legalMovesFrom, boardToFen, isInCheck } from './vendor/xiangqi'
import { isValidMove, checkCaptures } from './vendor/go'

export type Scene = 'chess' | 'xiangqi' | 'go'
export type GoBoard = ('black' | 'white' | null)[][]
export type Position = {
    scene: Scene
    key: string
    moves: string[]
    board: string[][]
    turn: number
    turnLabel: string
    legal: string[]
    terminal?: string
    fen?: string
    goBoards?: GoBoard[]
    goHistory?: { x: number; y: number; player: 'black' | 'white' }[]
}
export const goCoordinate = (x: number, y: number) => (x < 0 ? 'pass' : `${'ABCDEFGHJ'[x]}${9 - y}`)
export const squareName = (scene: Scene, x: number, y: number) =>
    scene === 'go' ? goCoordinate(x, y) : `${'abcdefghi'[x]}${(scene === 'chess' ? 8 : 9) - y}`
export function squarePoint(scene: Scene, name: string): [number, number] {
    if (name === 'pass') return [-1, -1]
    return [
        (scene === 'go' ? 'ABCDEFGHJ' : 'abcdefghi').indexOf(name[0]),
        (scene === 'chess' ? 8 : 9) - Number(name[1]),
    ]
}
export function moveTarget(scene: Scene, move: string): [number, number] {
    return squarePoint(scene, scene === 'go' ? move : move.slice(2, 4))
}
export function moveLabel(position: Position, move: string): string {
    if (position.scene === 'go') return move === 'pass' ? 'Pass' : move
    if (position.scene === 'xiangqi') return `${move.slice(0, 2)}–${move.slice(2, 4)}`
    try {
        return (
            new Chess(position.fen).move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })?.san ??
            move
        )
    } catch {
        return move
    }
}
export function buildPosition(scene: Scene, moves: string[]): Position {
    const base = { scene, key: `${scene}:${moves.join(' ')}`, moves: [...moves], turn: moves.length % 2 }
    if (scene === 'chess') {
        const game = new Chess()
        for (const move of moves) game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
        const turn = game.turn() === 'w' ? 0 : 1
        const legal = game.moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion ?? ''}`)
        return {
            ...base,
            turn,
            fen: game.fen(),
            legal,
            turnLabel: `${turn === 0 ? 'White' : 'Black'} to move${game.isCheck() ? ' · check' : ''}`,
            terminal: game.isCheckmate()
                ? `Checkmate · ${turn === 0 ? 'Black' : 'White'} wins`
                : game.isDraw()
                ? 'Draw · undo or reset to continue'
                : undefined,
            board: game.board().map(row => row.map(p => (p ? (p.color === 'w' ? p.type.toUpperCase() : p.type) : ''))),
        }
    }
    if (scene === 'xiangqi') {
        const board = parseFenBoard(START_FEN)
        let halfmove = 0
        moves.forEach((move, index) => {
            const result = validateMoveStr(move, board, index % 2 === 0 ? 'w' : 'b')
            if (!result.ok || !result.mv) throw new Error('Illegal Xiangqi move')
            const { fromFile, fromRank, toFile, toRank } = result.mv
            halfmove = result.captured ? 0 : halfmove + 1
            board[toRank][toFile] = board[fromRank][fromFile]
            board[fromRank][fromFile] = ''
        })
        const side = base.turn === 0 ? 'w' : 'b'
        const legal: string[] = []
        board.forEach((row, rank) =>
            row.forEach((_, file) => {
                for (const target of legalMovesFrom(board, file, rank, side))
                    legal.push(`${'abcdefghi'[file]}${rank}${'abcdefghi'[target.file]}${target.rank}`)
            })
        )
        return {
            ...base,
            legal,
            board: [...board].reverse(),
            fen: boardToFen(board, side, Math.floor(moves.length / 2) + 1, halfmove),
            turnLabel: `${base.turn === 0 ? 'Red' : 'Black'} to move${isInCheck(board, side) ? ' · check' : ''}`,
            terminal: legal.length ? undefined : `${base.turn === 0 ? 'Black' : 'Red'} wins · no legal moves`,
        }
    }
    let board: GoBoard = Array.from({ length: 9 }, () => Array(9).fill(null))
    const boards = [board]
    const history: NonNullable<Position['goHistory']> = []
    moves.forEach((move, index) => {
        const player = index % 2 === 0 ? 'black' : 'white'
        const [x, y] = squarePoint('go', move)
        if (move !== 'pass') {
            if (!isValidMove(board, x, y, player, boards[boards.length - 2])) throw new Error('Illegal Go move')
            board = board.map(row => [...row])
            board[y][x] = player
            board = checkCaptures(board, x, y, player).newBoard
        }
        boards.push(board)
        history.push({ x, y, player })
    })
    const player = base.turn === 0 ? 'black' : 'white'
    const legal = ['pass']
    board.forEach((row, y) =>
        row.forEach((_, x) => {
            if (isValidMove(board, x, y, player, boards[boards.length - 2])) legal.push(goCoordinate(x, y))
        })
    )
    return {
        ...base,
        legal,
        board: board.map(row => row.map(p => (p === 'black' ? 'B' : p === 'white' ? 'W' : ''))),
        goBoards: boards,
        goHistory: history,
        turnLabel: `${base.turn === 0 ? 'Black' : 'White'} to move`,
        terminal:
            moves.length >= 2 && moves.slice(-2).every(m => m === 'pass')
                ? 'Two passes · undo or reset to continue'
                : undefined,
    }
}
export function ownPiece(position: Position, piece: string) {
    return piece !== '' && (piece === piece.toUpperCase()) === (position.turn === 0)
}
export function pieceName(scene: Scene, piece: string) {
    if (!piece) return 'empty'
    if (scene === 'go') return piece === 'B' ? 'Black stone' : 'White stone'
    const color = piece === piece.toUpperCase() ? (scene === 'chess' ? 'White' : 'Red') : 'Black'
    const names =
        scene === 'chess'
            ? { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
            : { p: 'soldier', n: 'horse', b: 'elephant', a: 'advisor', r: 'chariot', c: 'cannon', k: 'general' }
    return `${color} ${names[piece.toLowerCase() as keyof typeof names] ?? piece}`
}
export function legalFrom(position: Position, square: string) {
    return position.legal.filter(move => move.startsWith(square))
}
