/**
 * Tetris-style grid packing for Leaflet cards.
 * Cards fill the first available slot that fits their size.
 * Grid is COLS wide, grows vertically as needed.
 */

export function getSizeClasses(size) {
  switch (size) {
    case '2x2': return { colSpan: 2, rowSpan: 2 };
    case '2x1': return { colSpan: 2, rowSpan: 1 };
    case '1x2': return { colSpan: 1, rowSpan: 2 };
    default:    return { colSpan: 1, rowSpan: 1 };
  }
}

/**
 * Given a list of cards, compute { colSpan, rowSpan, gridColumn, gridRow }
 * for each card using a 2D occupancy map (tetris packing).
 */
export function computeLayout(cards, COLS = 3) {
  // occupancy[row][col] = true if cell is taken
  const occupied = [];

  function isOccupied(row, col) {
    return occupied[row]?.[col] === true;
  }

  function occupy(startRow, startCol, rowSpan, colSpan) {
    for (let r = startRow; r < startRow + rowSpan; r++) {
      if (!occupied[r]) occupied[r] = [];
      for (let c = startCol; c < startCol + colSpan; c++) {
        occupied[r][c] = true;
      }
    }
  }

  function findSlot(colSpan, rowSpan) {
    // Clamp colSpan to available columns
    const span = Math.min(colSpan, COLS);
    for (let row = 0; row < 999; row++) {
      for (let col = 0; col <= COLS - span; col++) {
        // Check if all cells in this colSpan x rowSpan block are free
        let fits = true;
        outer: for (let r = row; r < row + rowSpan; r++) {
          for (let c = col; c < col + span; c++) {
            if (isOccupied(r, c)) { fits = false; break outer; }
          }
        }
        if (fits) return { row, col, span };
      }
    }
    return { row: 0, col: 0 }; // fallback
  }

  return cards.map(card => {
    const { colSpan, rowSpan } = getSizeClasses(card.size || '1x1');
    const { row, col, span } = findSlot(colSpan, rowSpan);
    occupy(row, col, rowSpan, span);

    return {
      ...card,
      colSpan,
      rowSpan,
      // CSS grid uses 1-based index
      gridColumn: `${col + 1} / span ${span}`,
      gridRow:    `${row + 1} / span ${rowSpan}`,
    };
  });
}