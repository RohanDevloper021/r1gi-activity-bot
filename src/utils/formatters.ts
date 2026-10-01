export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSecs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSecs}s`;
  }
  return `${remainingSecs}s`;
}

export function formatProgressBar(current: number, max: number, length = 12): string {
  if (max <= 0) return '█'.repeat(length);
  const percent = Math.min(1, Math.max(0, current / max));
  const filled = Math.round(percent * length);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, length - filled));
}
