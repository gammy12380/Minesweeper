export type Tile = {
  isMine: boolean; // 是否是地雷
  isRevealed: boolean; // 是否已翻開
  isFlagged: boolean; // 是否被標記
  isQuestioned: boolean; // 是否被標註為問號
  adjacentMines: number; // 周圍地雷數量
  clicked: boolean; // 是否被點擊
};

export enum Level {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export const levelSettings = {
  [Level.Easy]: { rows: 9, cols: 9, mines: 10 },
  [Level.Medium]: { rows: 16, cols: 16, mines: 40 },
  [Level.Hard]: { rows: 16, cols: 30, mines: 99 },
};

export const adjacentMines = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
