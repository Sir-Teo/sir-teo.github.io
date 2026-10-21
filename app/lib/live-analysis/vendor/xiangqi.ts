// Vendored from the user's Sir-Teo/web-xiangqi@0da0b7332396cf3fc4188257162a567ccb53e3d4: src/utils/xiangqi.ts.
export type Side = 'w' | 'b'
export type Piece = string
export type BoardState = Piece[][]

export const START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR'
/** The opening position as a full FEN, side to move and counters included. */
export const START_POSITION_FEN = `${START_FEN} w - - 0 1`
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']

export interface Move {
    fromFile: number
    fromRank: number
    toFile: number
    toRank: number
    raw: string
}

export interface ValidationResult {
    ok: boolean
    reason?: string
    piece?: Piece
    captured?: Piece
    mv?: Move
}

export function isRedPiece(ch: string): boolean {
    return !!ch && ch === ch.toUpperCase()
}

export function isBlackPiece(ch: string): boolean {
    return !!ch && ch === ch.toLowerCase()
}

export function parseFenBoard(fen: string): BoardState {
    const [placement] = fen.trim().split(/\s+/)
    const rows = placement.split('/')
    if (rows.length !== 10) {
        throw new Error('FEN board must contain 10 ranks')
    }
    const out = Array.from({ length: 10 }, () => Array(9).fill(''))
    for (let visualRow = 0; visualRow < 10; visualRow++) {
        let file = 0
        for (const ch of rows[visualRow]) {
            if (/^[1-9]$/.test(ch)) {
                file += Number(ch)
                if (file > 9) {
                    throw new Error('FEN rank has too many files')
                }
            } else if (/^[rnbakcpRNBAKCP]$/.test(ch)) {
                if (file >= 9) {
                    throw new Error('FEN rank has too many files')
                }
                const rank = 9 - visualRow // fen is top->bottom, our rank is bottom->top
                out[rank][file] = ch
                file += 1
            } else {
                throw new Error('FEN rank contains an invalid piece')
            }
        }
        if (file !== 9) {
            throw new Error('FEN rank must contain exactly 9 files')
        }
    }
    return out
}

/**
 * `halfmove` is the count of plies since the last capture, and it is not
 * decoration. Pikafish adjudicates the natural limit from it: the same endgame
 * searched at depth 14 reports mate in 3 when the field says 0 or 45, and 0.00
 * when it says 119. Writing a flat 0 tells the engine no progress-free moves
 * have happened and can turn a drawn position into a claimed win.
 */
export function boardToFen(state: BoardState, stm: Side, fullmove: number = 1, halfmove: number = 0): string {
    const rows = []
    for (let rank = 9; rank >= 0; rank--) {
        let row = ''
        let empties = 0
        for (let file = 0; file < 9; file++) {
            const piece = state[rank][file]
            if (!piece) {
                empties += 1
                continue
            }
            if (empties) {
                row += String(empties)
                empties = 0
            }
            row += piece
        }
        if (empties) row += String(empties)
        rows.push(row || '9')
    }
    const clock = Number.isFinite(halfmove) && halfmove > 0 ? Math.trunc(halfmove) : 0
    return rows.join('/') + ' ' + stm + ' - - ' + clock + ' ' + fullmove
}

export function squareToUci(file: number, rank: number): string {
    return FILES[file] + String(rank)
}

export function uciToSquare(square: string): { file: number; rank: number } | null {
    if (!square || square.length !== 2) return null
    const file = FILES.indexOf(square[0])
    const rank = Number(square[1])
    if (file < 0 || isNaN(rank)) return null
    return { file, rank }
}

export function parseMove(move: string): Move | null {
    const normalized = String(move).trim().toLowerCase()
    const m = normalized.match(/^([a-i])([0-9])([a-i])([0-9])$/)
    if (!m) return null
    const fromFile = FILES.indexOf(m[1])
    const fromRank = Number(m[2])
    const toFile = FILES.indexOf(m[3])
    const toRank = Number(m[4])
    if (fromFile < 0 || toFile < 0) return null
    return { fromFile, fromRank, toFile, toRank, raw: normalized }
}

export function otherSide(side: Side): Side {
    return side === 'w' ? 'b' : 'w'
}

export function pieceSide(piece: string | null): Side | null {
    if (!piece) return null
    return isRedPiece(piece) ? 'w' : 'b'
}

export function inBounds(file: number, rank: number): boolean {
    return file >= 0 && file < 9 && rank >= 0 && rank < 10
}

export function inPalace(side: Side, file: number, rank: number): boolean {
    if (file < 3 || file > 5) return false
    return side === 'w' ? rank >= 0 && rank <= 2 : rank >= 7 && rank <= 9
}

export function hasCrossedRiver(side: Side, rank: number): boolean {
    return side === 'w' ? rank >= 5 : rank <= 4
}

export function sgn(n: number): number {
    return n > 0 ? 1 : n < 0 ? -1 : 0
}

export function countBetweenOrthogonal(
    state: BoardState,
    fromFile: number,
    fromRank: number,
    toFile: number,
    toRank: number
): number {
    if (fromFile !== toFile && fromRank !== toRank) return -1
    let count = 0
    if (fromFile === toFile) {
        const step = sgn(toRank - fromRank)
        for (let r = fromRank + step; r !== toRank; r += step) {
            if (state[r][fromFile]) count += 1
        }
        return count
    }
    const step = sgn(toFile - fromFile)
    for (let f = fromFile + step; f !== toFile; f += step) {
        if (state[fromRank][f]) count += 1
    }
    return count
}

export function cloneBoardState(state: BoardState): BoardState {
    return state.map(row => row.slice())
}

export function findKing(state: BoardState, side: Side): { file: number; rank: number } | null {
    const target = side === 'w' ? 'K' : 'k'
    for (let rank = 0; rank < 10; rank++) {
        for (let file = 0; file < 9; file++) {
            if (state[rank][file] === target) return { file, rank }
        }
    }
    return null
}

export function kingsFacing(state: BoardState): boolean {
    const red = findKing(state, 'w')
    const black = findKing(state, 'b')
    if (!red || !black) return false
    if (red.file !== black.file) return false
    return countBetweenOrthogonal(state, red.file, red.rank, black.file, black.rank) === 0
}

export function attacksSquare(
    state: BoardState,
    fromFile: number,
    fromRank: number,
    piece: Piece,
    toFile: number,
    toRank: number
): boolean {
    if (!piece || !inBounds(toFile, toRank)) return false
    const side = pieceSide(piece)
    if (!side) return false

    const type = piece.toUpperCase()
    const df = toFile - fromFile
    const dr = toRank - fromRank
    const adf = Math.abs(df)
    const adr = Math.abs(dr)

    if (type === 'R') {
        return (
            (fromFile === toFile || fromRank === toRank) &&
            countBetweenOrthogonal(state, fromFile, fromRank, toFile, toRank) === 0
        )
    }

    if (type === 'C') {
        return (
            (fromFile === toFile || fromRank === toRank) &&
            countBetweenOrthogonal(state, fromFile, fromRank, toFile, toRank) === 1
        )
    }

    if (type === 'N') {
        if (!((adf === 2 && adr === 1) || (adf === 1 && adr === 2))) return false
        const legFile = adf === 2 ? fromFile + sgn(df) : fromFile
        const legRank = adr === 2 ? fromRank + sgn(dr) : fromRank
        return !state[legRank][legFile]
    }

    if (type === 'B') {
        if (!(adf === 2 && adr === 2)) return false
        if (side === 'w' && toRank > 4) return false
        if (side === 'b' && toRank < 5) return false
        const eyeFile = fromFile + sgn(df)
        const eyeRank = fromRank + sgn(dr)
        return !state[eyeRank][eyeFile]
    }

    if (type === 'A') {
        return adf === 1 && adr === 1 && inPalace(side, toFile, toRank)
    }

    if (type === 'K') {
        if (adf + adr === 1 && inPalace(side, toFile, toRank)) return true
        return fromFile === toFile && countBetweenOrthogonal(state, fromFile, fromRank, toFile, toRank) === 0
    }

    if (type === 'P') {
        if (side === 'w') {
            if (df === 0 && dr === 1) return true
            return hasCrossedRiver(side, fromRank) && adr === 0 && adf === 1
        }
        if (df === 0 && dr === -1) return true
        return hasCrossedRiver(side, fromRank) && adr === 0 && adf === 1
    }

    return false
}

export function isInCheck(state: BoardState, side: Side): boolean {
    const king = findKing(state, side)
    if (!king) return true
    const attacker = otherSide(side)
    for (let rank = 0; rank < 10; rank++) {
        for (let file = 0; file < 9; file++) {
            const piece = state[rank][file]
            if (!piece || pieceSide(piece) !== attacker) continue
            if (attacksSquare(state, file, rank, piece, king.file, king.rank)) return true
        }
    }
    return false
}

export function validatePieceMove(state: BoardState, mv: Move, movingSide: Side): ValidationResult {
    if (!inBounds(mv.fromFile, mv.fromRank) || !inBounds(mv.toFile, mv.toRank)) {
        return { ok: false, reason: 'out of bounds' }
    }
    if (mv.fromFile === mv.toFile && mv.fromRank === mv.toRank) {
        return { ok: false, reason: 'move must change square' }
    }

    const piece = state[mv.fromRank][mv.fromFile]
    if (!piece) return { ok: false, reason: 'no piece on source square' }
    if (pieceSide(piece) !== movingSide) return { ok: false, reason: 'not your piece' }

    const target = state[mv.toRank][mv.toFile]
    if (target && pieceSide(target) === movingSide) {
        return { ok: false, reason: 'cannot capture your own piece' }
    }

    const type = piece.toUpperCase()
    const df = mv.toFile - mv.fromFile
    const dr = mv.toRank - mv.fromRank
    const adf = Math.abs(df)
    const adr = Math.abs(dr)

    if (type === 'R') {
        if (!(mv.fromFile === mv.toFile || mv.fromRank === mv.toRank))
            return { ok: false, reason: 'rook moves orthogonally' }
        if (countBetweenOrthogonal(state, mv.fromFile, mv.fromRank, mv.toFile, mv.toRank) !== 0)
            return { ok: false, reason: 'rook path blocked' }
    } else if (type === 'C') {
        if (!(mv.fromFile === mv.toFile || mv.fromRank === mv.toRank))
            return { ok: false, reason: 'cannon moves orthogonally' }
        const between = countBetweenOrthogonal(state, mv.fromFile, mv.fromRank, mv.toFile, mv.toRank)
        if (target) {
            if (between !== 1) return { ok: false, reason: 'cannon capture needs one screen' }
        } else if (between !== 0) {
            return { ok: false, reason: 'cannon path blocked' }
        }
    } else if (type === 'N') {
        if (!((adf === 2 && adr === 1) || (adf === 1 && adr === 2))) return { ok: false, reason: 'horse moves in an L' }
        const legFile = adf === 2 ? mv.fromFile + sgn(df) : mv.fromFile
        const legRank = adr === 2 ? mv.fromRank + sgn(dr) : mv.fromRank
        if (state[legRank][legFile]) return { ok: false, reason: 'horse leg blocked' }
    } else if (type === 'B') {
        if (!(adf === 2 && adr === 2)) return { ok: false, reason: 'elephant moves 2 diagonally' }
        if (movingSide === 'w' && mv.toRank > 4) return { ok: false, reason: 'elephant cannot cross river' }
        if (movingSide === 'b' && mv.toRank < 5) return { ok: false, reason: 'elephant cannot cross river' }
        const eyeFile = mv.fromFile + sgn(df)
        const eyeRank = mv.fromRank + sgn(dr)
        if (state[eyeRank][eyeFile]) return { ok: false, reason: 'elephant eye blocked' }
    } else if (type === 'A') {
        if (!(adf === 1 && adr === 1)) return { ok: false, reason: 'advisor moves 1 diagonally' }
        if (!inPalace(movingSide, mv.toFile, mv.toRank)) return { ok: false, reason: 'advisor must stay in palace' }
    } else if (type === 'K') {
        const flyingCapture =
            target &&
            target.toUpperCase() === 'K' &&
            mv.fromFile === mv.toFile &&
            countBetweenOrthogonal(state, mv.fromFile, mv.fromRank, mv.toFile, mv.toRank) === 0
        if (!flyingCapture) {
            if (adf + adr !== 1) return { ok: false, reason: 'general moves 1 orthogonally' }
            if (!inPalace(movingSide, mv.toFile, mv.toRank)) return { ok: false, reason: 'general must stay in palace' }
        }
    } else if (type === 'P') {
        if (movingSide === 'w') {
            if (!(df === 0 && dr === 1) && !(hasCrossedRiver(movingSide, mv.fromRank) && adr === 0 && adf === 1)) {
                return { ok: false, reason: 'pawn move is illegal' }
            }
        } else if (!(df === 0 && dr === -1) && !(hasCrossedRiver(movingSide, mv.fromRank) && adr === 0 && adf === 1)) {
            return { ok: false, reason: 'pawn move is illegal' }
        }
    } else {
        return { ok: false, reason: 'unknown piece' }
    }

    const next = cloneBoardState(state)
    next[mv.toRank][mv.toFile] = piece
    next[mv.fromRank][mv.fromFile] = ''
    if (kingsFacing(next)) return { ok: false, reason: 'generals cannot face each other' }
    if (isInCheck(next, movingSide)) return { ok: false, reason: 'move leaves general in check' }

    return { ok: true, piece, captured: target || '' }
}

export function validateMoveStr(move: string, state: BoardState, movingSide: Side): ValidationResult {
    const mv = parseMove(move)
    if (!mv) return { ok: false, reason: 'invalid move format' }
    const result = validatePieceMove(state, mv, movingSide)
    if (!result.ok) return result
    return { ok: true, mv, piece: result.piece, captured: result.captured }
}

export function legalMovesFrom(
    state: BoardState,
    file: number,
    rank: number,
    sideToMove: Side
): { file: number; rank: number; capture: boolean }[] {
    const piece = state[rank]?.[file]
    if (!piece || pieceSide(piece) !== sideToMove) return []
    const out = []
    for (let toRank = 0; toRank < 10; toRank++) {
        for (let toFile = 0; toFile < 9; toFile++) {
            if (toFile === file && toRank === rank) continue
            const mv: Move = { fromFile: file, fromRank: rank, toFile, toRank, raw: '' }
            const checked = validatePieceMove(state, mv, sideToMove)
            if (!checked.ok) continue
            out.push({
                file: toFile,
                rank: toRank,
                capture: !!state[toRank][toFile],
            })
        }
    }
    return out
}

/** Returns true if the given side has at least one legal move. */
export function hasAnyLegalMove(state: BoardState, side: Side): boolean {
    for (let rank = 0; rank < 10; rank++) {
        for (let file = 0; file < 9; file++) {
            const piece = state[rank][file]
            if (!piece || pieceSide(piece) !== side) continue
            if (legalMovesFrom(state, file, rank, side).length > 0) return true
        }
    }
    return false
}
