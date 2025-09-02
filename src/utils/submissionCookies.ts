export function getScenarioCookieName(pathname: string) {
  if (pathname === '/' || pathname === '') return 'submitted_root';
  if (pathname.startsWith('/task-2')) return 'submitted_task2';
  if (pathname.startsWith('/task-3')) return 'submitted_task3';
  // default per-path key
  const safe = pathname.replace(/[^a-z0-9_-]/gi, '_');
  return `submitted_${safe}`;
}

export function hasSubmittedForPath(pathname: string): boolean {
  if (typeof document === 'undefined') return false;
  const name = getScenarioCookieName(pathname);
  return document.cookie.split('; ').some(c => c.startsWith(`${name}=`));
}

export function markSubmittedForPath(pathname: string): void {
  if (typeof document === 'undefined') return;
  const name = getScenarioCookieName(pathname);
  // 180 days
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${name}=1; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}


