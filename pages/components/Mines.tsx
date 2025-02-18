import { useCallback, useEffect, useState, useRef, ChangeEvent } from "react";
import Board from "@/pages/components/Board";
import { Level, Tile, levelSettings, adjacentMines } from "@/types/Mines.type";;

// Emoji 💣 🚩 🎮 🏆 🎉 ☠️ 🔄 🤔 ❓

const Mines = () => {
    const [isGodMode, setGodMode] = useState(false)
    const [autoExpand, setAutoExpand] = useState(true)
    const [level, setLevel] = useState<Level>(Level.Easy);
    const [board, setBoard] = useState<Tile[][]>([]);
    const [mines, setMines] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isGaming, setGaming] = useState(true)
    const [isTimerStarted, setIsTimerStarted] = useState(false)
    const [isWin, setWin] = useState(false)

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const countAdjacentMines = (rowIndex: number, colIndex: number, newBoard: Tile[][], rows: number, cols: number) => {
        return adjacentMines.reduce((count, [rowOffset, colOffset]) => {
            const adjacentRow = rowIndex + rowOffset;
            const adjacentCol = colIndex + colOffset;
            if (adjacentRow >= 0 && adjacentRow < rows &&
                adjacentCol >= 0 && adjacentCol < cols &&
                newBoard[adjacentRow][adjacentCol].isMine) {
                return count + 1;
            }
            return count;
        }, 0);
    };

    const generateBoard = useCallback((rows: number, cols: number, mineCount: number): Tile[][] => {
        setWin(false)
        const newBoard: Tile[][] = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                isQuestioned: false,
                clicked: false,
                adjacentMines: 0,
            }))
        );

        let placedMines = 0;
        while (placedMines < mineCount) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);

            if (!newBoard[row][col].isMine) {
                newBoard[row][col].isMine = true;
                placedMines++;
            }
        }

        newBoard.forEach((row, rowIndex) => {
            row.forEach((col, colIndex) => {
                if (col.isMine) return;
                col.adjacentMines = countAdjacentMines(rowIndex, colIndex, newBoard, rows, cols);
            });
        })
        return newBoard;
    }, []);


    // **初始化棋盤**
    useEffect(() => {
        if (isGaming) {
            const { rows, cols, mines } = levelSettings[level];
            setMines(mines);
            setBoard(generateBoard(rows, cols, mines));

            if (!isTimerStarted) {
                setIsTimerStarted(true);
            }
            timerRef.current = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerStarted, isGaming, level, generateBoard]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const reStart = () => {
        setIsTimerStarted(false)
        setTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
        const { rows, cols, mines } = levelSettings[level];
        setGaming(true); // 設定遊戲開始
        setBoard(generateBoard(rows, cols, mines)); // 重新生成棋盤
        setMines(mines); // 重置地雷數

    }

    const changeLevel = (e: ChangeEvent<HTMLSelectElement>) => {
        setLevel(e.target.value as Level)
        reStart()
    }

    // 監測勝利
    useEffect(() => {
        if (!isGaming) return; // 遊戲結束時不執行

        // 確保至少有一個格子被翻開才檢查勝利
        const hasRevealedTile = board.some(row => row.some(cell => cell.isRevealed));
        if (!hasRevealedTile) return;

        const allRevealed = board.every(row =>
            row.every(cell => (cell.isMine || cell.isRevealed))
        );

        if (allRevealed) {
            setIsTimerStarted(false);
            setGaming(false);
            setWin(true)

            setBoard(prev => prev.map(row => row.map(cell => ({
                ...cell,
                isRevealed: true,
            }))));
        }
    }, [board, isGaming]);

    const boardRightClick = useCallback((e: React.MouseEvent<HTMLDivElement>, cell: Tile, rowIndex: number, colIndex: number) => {
        e.preventDefault()
        if (e.button !== 2 || !isGaming || cell.isRevealed) return
        setBoard((prev) => {
            const newBoard = [...prev];
            const cell = newBoard[rowIndex][colIndex]

            if (!cell.isFlagged && !cell.isQuestioned) {
                cell.isFlagged = true
                cell.isQuestioned = false
                setMines((prev) => prev - 1)
            } else if (cell.isFlagged) {
                cell.isQuestioned = true
                cell.isFlagged = false
                setMines((prev) => prev + 1)
            } else {
                cell.isQuestioned = false
                cell.isFlagged = false
            }

            return newBoard
        })
    }, [isGaming])



    const recursionCheckMines = useCallback((newBoard: Tile[][], rowIndex: number, colIndex: number) => {
        const cell = newBoard[rowIndex][colIndex];
        if (cell.isRevealed || cell.isMine || cell.isFlagged || cell.isQuestioned) return
        cell.isRevealed = true
        // 如果相鄰地雷數為0且啟用自動展開，則繼續展開
        if (!cell.adjacentMines && autoExpand) {
            const { rows, cols } = levelSettings[level]
            adjacentMines.forEach(([rowOffset, colOffset]) => {
                const adjacentRow = rowIndex + rowOffset;
                const adjacentCol = colIndex + colOffset;
                if (adjacentRow >= 0 && adjacentRow < rows &&
                    adjacentCol >= 0 && adjacentCol < cols && !cell.isMine
                    && !cell.isQuestioned && !cell.isFlagged) {
                    const adjacentCell = newBoard[adjacentRow][adjacentCol]
                    if (!adjacentCell.isRevealed && !adjacentCell.isMine && !adjacentCell.isFlagged && !adjacentCell.isQuestioned) {
                        recursionCheckMines(newBoard, adjacentRow, adjacentCol)
                    }
                }
            })
        }
    }, [autoExpand, level])


    const boardClick = useCallback((rowIndex: number, colIndex: number) => {
        if (!isGaming) return;

        if (!isTimerStarted) {
            setIsTimerStarted(true);
        }

        setBoard((prev) => {
            const newBoard = [...prev]
            const cell = newBoard[rowIndex][colIndex];
            // 處理格子的狀態
            if (cell.isMine && !cell.isQuestioned && !cell.isFlagged) {
                cell.isRevealed = true;
                cell.clicked = true
                setIsTimerStarted(false);
                setGaming(false);
                setBoard(prev => prev.map(row => row.map(cell => {
                    if (cell.isMine) {
                        return {
                            ...cell,
                            isRevealed: true,
                        }
                    }
                    return { ...cell }
                })));
            } else {
                // 清除旗標或問題狀態
                if (cell.isFlagged) {
                    cell.isFlagged = false;
                    setMines((prev) => prev + 1)
                } else if (cell.isQuestioned) {
                    cell.isQuestioned = false;
                } else {
                    recursionCheckMines(newBoard, rowIndex, colIndex)
                }
            }
            return newBoard;
        });
    }, [isGaming, isTimerStarted, recursionCheckMines]);

    return (
        <div className="flex flex-col justify-center items-center gap-4">
            <h1 className="flex items-center font-bold text-xl space-x-2">
                <span>Minesweeper</span>
                <button className="cursor-pointer" onClick={() => reStart()}>🎮</button>
            </h1>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <input type="checkbox" name="godMode" id="godMode" className="cursor-pointer" checked={isGodMode} onChange={() => setGodMode(!isGodMode)} />
                    <label htmlFor="godMode" className="cursor-pointer">👑 God Mode</label>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" name="autoExpand" id="autoExpand" className="cursor-pointer" checked={autoExpand} onChange={() => setAutoExpand(!autoExpand)} />
                    <label htmlFor="autoExpand" className="cursor-pointer">Auto Expand</label>
                </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4 w-max">
                <div className=" flex justify-center items-center gap-2">
                    <label htmlFor="level" className="text-lg font-semibold">Level:</label>
                    <select
                        id="level"
                        value={level}
                        onChange={(e) => changeLevel(e)}
                        className="mt-1 px-2 py-1 text-gray-800 bg-gray-300 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {Object.values(Level).map(item => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-center">💣: {mines}</div>
                <div className="text-center">⏰: {formatTime(timer)}</div>
            </div>
            <div className="text-orange-300 font-bold cursor-pointer" onClick={() => reStart()}>Restart 🔄</div>
            <div className=" space-y-0.5" onContextMenu={(e) => e.preventDefault()}>
                <Board board={board || []} isGodMode={isGodMode} boardClick={boardClick} boardRightClick={boardRightClick} />
            </div>
            {!isGaming && !isWin && <div className="text-red-700 font-bold">Game Over ☠️</div>}
            {isWin && <div className="text-green-500 font-bold">🏆 恭喜！你贏了！ 🎉</div>}
        </div>
    );
};

export default Mines;
