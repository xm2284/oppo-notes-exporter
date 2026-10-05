import fs from 'node:fs';
import path from 'node:path';

function sanitizeFilename(name) {
  return String(name || 'untitled')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export function exportAll(rows, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const mdDir = path.join(outputDir, 'markdown');
  fs.mkdirSync(mdDir, { recursive: true });

  // 1. JSON
  const jsonPath = path.join(outputDir, 'notes.json');
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');

  // 2. CSV (Excel friendly with UTF-8 BOM)
  const csvPath = path.join(outputDir, 'notes.csv');
  const cols = ['recordId', 'title', 'content', 'length', 'group', 'createTime', 'updateTime', 'alarmTime', 'topTime', 'status'];
  const cell = v => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csvContent = '\uFEFF' + [
    cols.join(','),
    ...rows.map(r => cols.map(c => cell(r[c])).join(','))
  ].join('\r\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');

  // 3. Single aggregated Markdown
  const allMdPath = path.join(outputDir, 'notes.md');
  const allMd = rows.map((r, idx) => {
    return [
      `## ${idx + 1}. ${r.title}`,
      `- **创建时间**：${r.createTime} | **更新时间**：${r.updateTime} | **分组**：${r.group || '未分类'}`,
      '',
      r.content || '*(无正文)*',
      ''
    ].join('\n');
  }).join('\n---\n\n');
  fs.writeFileSync(allMdPath, allMd, 'utf8');

  // 4. Individual Markdown files (Obsidian / Logseq / Notion friendly)
  rows.forEach((r, idx) => {
    const safeTitle = sanitizeFilename(r.title);
    const filename = `${String(idx + 1).padStart(3, '0')}_${safeTitle}.md`;
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(r.title)}`,
      `created: ${JSON.stringify(r.createTime)}`,
      `updated: ${JSON.stringify(r.updateTime)}`,
      `group: ${JSON.stringify(r.group || '未分类')}`,
      `recordId: ${JSON.stringify(r.recordId)}`,
      '---',
      '',
      r.content || ''
    ].join('\n');
    fs.writeFileSync(path.join(mdDir, filename), frontmatter, 'utf8');
  });

  return {
    count: rows.length,
    jsonPath,
    csvPath,
    allMdPath,
    mdDir
  };
}
