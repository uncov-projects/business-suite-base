export function renderEmptyRows(currentLength, totalRows, columns) {
  const emptyCount = Math.max(0, totalRows - currentLength);
  return Array.from({ length: emptyCount }).map((_, index) => (
    <tr key={`empty-${index}`}>
      {Array.from({ length: columns }).map((__, colIndex) => (
        <td key={colIndex}>&nbsp;</td>
      ))}
    </tr>
  ));
}