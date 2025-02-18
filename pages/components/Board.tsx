import { memo, useCallback } from "react";
import { Tile } from "@/types/Mines.type";


type BoardType = {
    board: Tile[][]
    isGodMode: boolean
    boardClick: (rowIndex: number, colIndex: number) => void
    boardRightClick: (e: React.MouseEvent<HTMLDivElement>, col: Tile, rowIndex: number, colIndex: number) => void
}

const Board = ({ board, isGodMode, boardClick, boardRightClick }: BoardType) => {

    const getSymbol = useCallback((col: Tile) => {
        if (col.isRevealed || isGodMode) {
            if (col.isMine) return "💣";
            if (col.adjacentMines !== 0) return `${col.adjacentMines}`;
        }
        if (col.isFlagged) return '🚩';
        if (col.isQuestioned) return '🤔';
        return '';
    }, [isGodMode]);

    return board?.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5">
            {row.map((col, colIndex) => {
                return (
                    <div
                        key={colIndex}
                        onClick={() => boardClick(rowIndex, colIndex)}
                        onContextMenu={(e) => boardRightClick(e, col, rowIndex, colIndex)}
                        className={`size-6 border border-gray-800 flex justify-center items-center
                                ${!col.isRevealed && 'bg-gray-500'}
                                ${col.isRevealed && 'bg-gray-400'}
                                ${col.clicked && col.isMine && 'bg-red-500'} 
                            `}
                    >
                        <div>{getSymbol(col)}</div>
                    </div>
                );
            })}
        </div>
    ));
};

export default memo(Board);