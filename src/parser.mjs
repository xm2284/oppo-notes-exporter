export function htmlToText(html) {
  let s = String(html || '');
  s = s.replace(/<head[\s\S]*?<\/head>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<li[^>]*class="[^"]*unchecked[^"]*"[^>]*>/gi, '\n\u2610 ');
  s = s.replace(/<li[^>]*class="[^"]*checked[^"]*"[^>]*>/gi, '\n\u2611 ');
  s = s.replace(/<li[^>]*>/gi, '\n\u2610 ');
  s = s.replace(/<\/li>/gi, '');
  s = s.replace(/<\/(div|p|ul|ol|h[1-6]|blockquote|pre|tr|table)>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/gi, ' ')
       .replace(/&amp;/gi, '&')
       .replace(/&lt;/gi, '<')
       .replace(/&gt;/gi, '>')
       .replace(/&quot;/gi, '"')
       .replace(/&#39;/gi, "'");

  s = s.split('\n')
       .map(line => line.replace(/[ \t]{2,}/g, ' ').trim())
       .join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.split('\n')
       .filter(line => !/^[\u2610\u2611]\s*$/.test(line))
       .join('\n');

  return s.trim();
}

export function parseTimestamp(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const num = Number(val);
  if (!Number.isNaN(num) && num > 100000000000) return num;
  const parsed = Date.parse(String(val).replace(/\//g, '/'));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(parseTimestamp(ts));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('zh-CN', { hour12: false });
}
