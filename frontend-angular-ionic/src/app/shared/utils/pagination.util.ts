export function buildPageNumbers(total: number, current: number, maxVisible = 5): number[] {
  const pages: number[] = [];
  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    let start = Math.max(current - 2, 1);
    let end = Math.min(start + maxVisible - 1, total);
    if (end === total) start = Math.max(end - maxVisible + 1, 1);
    for (let i = start; i <= end; i++) pages.push(i);
  }
  return pages;
}
