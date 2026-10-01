export const CATEGORY_COLORS = [
  '#2563eb',
  '#db2777',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#4b5563',
]

export function firstUnusedColor(usedColors: string[]): string {
  return CATEGORY_COLORS.find((c) => !usedColors.includes(c)) ?? CATEGORY_COLORS[0]
}
