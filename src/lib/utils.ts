import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function calculateBandScore(score: number, total: number): number {
  // 雅思阅读 A类分数换算（近似值）
  const correct = score;
  const bandTable: Record<number, number> = {
    40: 9.0, 39: 8.5, 38: 8.5, 37: 8.0, 36: 8.0, 35: 7.5,
    34: 7.5, 33: 7.0, 32: 7.0, 31: 6.5, 30: 6.5, 29: 6.5,
    28: 6.0, 27: 6.0, 26: 6.0, 25: 5.5, 24: 5.5, 23: 5.5,
    22: 5.0, 21: 5.0, 20: 5.0, 19: 4.5, 18: 4.5, 17: 4.5,
    16: 4.0, 15: 4.0, 14: 4.0, 13: 3.5, 12: 3.5, 11: 3.5,
    10: 3.0, 9: 3.0, 8: 3.0, 7: 2.5, 6: 2.5, 5: 2.0,
  };
  if (correct < 5) return 1.0;
  return bandTable[correct] ?? 1.0;
  // void 引用 total 以避免未使用参数告警
  void total;
}
