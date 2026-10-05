import { htmlToText, parseTimestamp, formatTime } from './parser.mjs';

export async function extractNotes(page, onProgress = () => {}) {
  // 1. Hook JSON.parse to intercept decrypted detail payloads
  await page.evaluate(() => {
    window.__oppoDecryptedStash = [];
    if (window.__oppoParseHooked) return;
    window.__oppoParseHooked = true;
    const originalParse = JSON.parse;
    JSON.parse = function (text, reviver) {
      try {
        if (typeof text === 'string' && text.length > 150 && text.includes('rawText') && text.includes('recordId')) {
          window.__oppoDecryptedStash.push(text);
        }
      } catch (e) {}
      return originalParse.call(JSON, text, reviver);
    };
  });

  // 2. Scan virtual list container
  const target = await page.evaluate(() => {
    const scrollables = [...document.querySelectorAll('*')].filter(
      e => e.scrollHeight > e.clientHeight + 20 && e.clientHeight > 150
    );
    const best = scrollables
      .map(e => ({ el: e, count: e.querySelectorAll('li, [class*="item"], [class*="Item"]').length }))
      .sort((a, b) => b.count - a.count)[0];
    if (!best) return null;
    const r = best.el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), h: best.el.clientHeight };
  });

  const scanListMap = () => page.evaluate(() => {
    const vms = [...document.querySelectorAll('*')].map(e => e.__vue__).filter(Boolean);
    const map = {};
    const seen = new WeakSet();
    const walk = (obj, depth) => {
      if (!obj || typeof obj !== 'object' || depth > 4 || seen.has(obj)) return;
      seen.add(obj);
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (item && typeof item === 'object' && item.recordId && item.rawText !== undefined) {
            map[item.recordId] = item;
          } else {
            walk(item, depth + 1);
          }
        }
      } else {
        if (obj.recordId && obj.rawText !== undefined) {
          map[obj.recordId] = obj;
          return;
        }
        for (const k of Object.keys(obj)) {
          if (k.startsWith('_') || k.startsWith('$')) continue;
          walk(obj[k], depth + 1);
        }
      }
    };
    for (const vm of vms) {
      walk(vm._data, 0);
      walk(vm.$props, 0);
    }
    return map;
  });

  if (target) {
    await page.mouse.move(target.x, target.y);
  }

  // 3. Scroll to trigger all lazy-loaded items
  onProgress({ phase: 'scroll', current: 0, total: 0, text: '正在扫描便签列表...' });
  let listMap = await scanListMap();
  let prevCount = 0;
  let stableRounds = 0;

  for (let i = 1; i <= 300; i++) {
    if (target) await page.mouse.wheel(0, 900);
    await page.waitForTimeout(500);
    listMap = await scanListMap();
    const count = Object.keys(listMap).length;
    onProgress({ phase: 'scroll', current: count, text: `已加载 ${count} 条便签摘要...` });
    if (count === prevCount) {
      stableRounds++;
      if (stableRounds >= 3) break;
    } else {
      stableRounds = 0;
      prevCount = count;
    }
  }

  const allIds = Object.keys(listMap);
  const totalCount = allIds.length;
  onProgress({ phase: 'scroll_done', total: totalCount, text: `列表扫描完成，共找到 ${totalCount} 条便签。` });

  // 4. Scroll back to top
  await page.evaluate(() => {
    const s = [...document.querySelectorAll('*')].find(
      e => e.scrollHeight > e.clientHeight + 20 && e.clientHeight > 150 && e.querySelectorAll('li, [class*="item"]').length > 3
    );
    if (s) s.scrollTop = 0;
  });
  await page.waitForTimeout(1000);

  // 5. Click through rendered items to load full details
  const getRendered = () => page.evaluate(() => {
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      const vm = el.__vue__;
      if (!vm) return;
      const name = (vm.$options && (vm.$options.name || vm.$options._componentTag)) || '';
      if (name !== 'ListItem') return;
      const opt = vm.$props && vm.$props.optionData;
      if (opt && opt.recordId) {
        out.push({ rid: opt.recordId, y: Math.round(el.getBoundingClientRect().top) });
      }
    });
    return out.sort((a, b) => a.y - b.y);
  });

  const clickItem = rid => page.evaluate(rid => {
    let hit = null;
    document.querySelectorAll('*').forEach(el => {
      const vm = el.__vue__;
      if (!vm || hit) return;
      const name = (vm.$options && (vm.$options.name || vm.$options._componentTag)) || '';
      if (name !== 'ListItem') return;
      const opt = vm.$props && vm.$props.optionData;
      if (opt && opt.recordId === rid) hit = el;
    });
    if (!hit) return false;
    hit.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    hit.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  }, rid);

  const readDetail = async rid => {
    for (let retry = 0; retry < 8; retry++) {
      const detail = await page.evaluate(rid => {
        let best = null;
        document.querySelectorAll('*').forEach(el => {
          const vm = el.__vue__;
          if (!vm) return;
          const name = (vm.$options && (vm.$options.name || vm.$options._componentTag)) || '';
          if (!/ListItem|richEditor|Collapse|Editor/i.test(name)) return;
          [vm.$props, vm._data].forEach(bag => {
            if (!bag) return;
            for (const k of Object.keys(bag)) {
              const val = bag[k];
              const cands = Array.isArray(val) ? val : [val];
              for (const c of cands) {
                if (c && typeof c === 'object' && c.recordId === rid && typeof c.rawText === 'string') {
                  if (!best || c.rawText.length > best.rawText.length) best = c;
                }
              }
            }
          });
        });

        const stash = window.__oppoDecryptedStash || [];
        for (let i = stash.length - 1; i >= 0 && i >= stash.length - 6; i--) {
          try {
            const j = JSON.parse(stash[i]);
            const arr = Array.isArray(j) ? j : (j.data && (j.data.note || j.data.noteInfo || j.data.list));
            const obj = arr && !Array.isArray(arr) ? arr : null;
            if (obj && obj.recordId === rid && typeof obj.rawText === 'string' && (!best || obj.rawText.length > best.rawText.length)) {
              best = obj;
            }
          } catch (e) {}
        }

        if (!best) return null;
        return {
          rawText: best.rawText,
          rawTitle: best.rawTitle,
          version: best.version,
          updateTime: best.updateTime,
          extra: best.extra,
          attachmentExtra: best.attachmentExtra
        };
      }, rid);

      if (detail && detail.rawText) return detail;
      await page.waitForTimeout(200);
    }
    return null;
  };

  const details = {};
  let doneCount = 0;
  let stallRounds = 0;

  for (let pass = 1; pass <= 150; pass++) {
    const rendered = await getRendered();
    const pending = rendered.filter(item => !details[item.rid]);

    if (!pending.length) {
      if (target) await page.mouse.wheel(0, Math.round(target.h * 0.85));
      await page.waitForTimeout(800);
      const after = await getRendered();
      if (!after.filter(i => !details[i.rid]).length) {
        stallRounds++;
        if (stallRounds >= 3) break;
      } else {
        stallRounds = 0;
      }
      continue;
    }

    stallRounds = 0;
    for (const item of pending) {
      await clickItem(item.rid);
      await page.waitForTimeout(200);
      const d = await readDetail(item.rid);
      details[item.rid] = d || { rawText: listMap[item.rid]?.rawText || '' };
      doneCount++;
      onProgress({ phase: 'detail', current: doneCount, total: totalCount, text: `正在读取正文详情 [${doneCount}/${totalCount}]` });
    }

    if (target) await page.mouse.wheel(0, Math.round(target.h * 0.85));
    await page.waitForTimeout(700);
  }

  // 6. Assembly & Sort
  const rows = allIds.map(rid => {
    const l = listMap[rid] || {};
    const d = details[rid] || {};
    const src = (d.rawText && d.rawText.length >= (l.rawText || '').length) ? d : l;
    const content = htmlToText(src.rawText);
    const lines = content.split('\n').map(x => x.trim()).filter(Boolean);

    let attCount = 0;
    try {
      const att = JSON.parse(src.attachmentExtra || l.attachmentExtra || '[]');
      if (Array.isArray(att)) attCount = att.length;
    } catch (e) {}

    return {
      recordId: rid,
      title: src.rawTitle || l.rawTitle || lines[0] || '(无标题)',
      content,
      length: content.length,
      group: l.groupName || (l.groupGuid || '').slice(0, 8) || '未分类',
      createTime: formatTime(l.createTime),
      updateTime: formatTime(l.updateTime || src.updateTime),
      alarmTime: formatTime(l.alarmTime),
      topTime: formatTime(l.topTime),
      status: l.status,
      version: src.version || l.version,
      attachments: attCount,
      html: src.rawText || ''
    };
  });

  rows.sort((a, b) => parseTimestamp(b.updateTime) - parseTimestamp(a.updateTime));
  return rows;
}
