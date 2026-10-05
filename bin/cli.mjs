#!/usr/bin/env node

import path from 'node:path';
import readline from 'node:readline';
import { chromium } from 'playwright-core';
import { findBrowserExecutable, launchDebugBrowser } from '../src/browser.mjs';
import { extractNotes } from '../src/extractor.mjs';
import { exportAll } from '../src/formatters/index.mjs';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  console.log('==================================================');
  console.log('      OPPO Cloud Notes Exporter (ColorOS)');
  console.log('==================================================\n');

  const exe = findBrowserExecutable();
  if (!exe) {
    console.error('❌ 未找到可用的 Chrome 或 Edge 浏览器，请检查安装路径。');
    process.exit(1);
  }
  console.log(`✔ 检测到可用浏览器: ${exe}`);

  const port = 9222;
  console.log(`\n🚀 正在启动独立调试浏览器 (端口 ${port})...`);
  launchDebugBrowser({ executablePath: exe, port });

  console.log('\n👉 浏览器已启动！');
  console.log('1. 如果尚未登录，请在弹出的浏览器中扫码/账号登录 OPPO 云服务。');
  console.log('2. 确认页面已加载并展示出「便签」列表后，返回此处按回车继续。');
  await ask('\n[按回车键开始抓取导出...] ');

  console.log('\n🔗 正在通过 CDP 连接浏览器调试端口...');
  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  } catch (err) {
    console.error(`❌ 连接 CDP 失败: ${err.message}`);
    console.error('请确保刚才弹出的浏览器窗口未关闭。');
    process.exit(1);
  }

  const context = browser.contexts()[0];
  let page = context.pages().find(p => /cloud\.oppo\.com/.test(p.url()));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://cloud.oppo.com/owork/mapp/sticky-notes/', { waitUntil: 'domcontentloaded' });
  }

  console.log('🔍 开始提取便签数据...');
  const rows = await extractNotes(page, progress => {
    if (progress.text) {
      process.stdout.write(`\r[${progress.phase}] ${progress.text}`.padEnd(60));
    }
  });
  console.log(`\n\n🎉 提取完成！共获取到 ${rows.length} 篇便签。\n`);

  const outputDir = path.resolve(process.cwd(), 'output');
  console.log(`💾 正在写入导出文件到: ${outputDir}`);
  const result = exportAll(rows, outputDir);

  console.log('\n✔ 导出清单:');
  console.log(`  - JSON 完整数据:   ${result.jsonPath}`);
  console.log(`  - CSV (Excel兼容): ${result.csvPath}`);
  console.log(`  - 单文件 Markdown: ${result.allMdPath}`);
  console.log(`  - 独立 Markdown:   ${result.mdDir} (${rows.length} 个文件，Obsidian友好)`);

  await browser.close();
  console.log('\n✨ 全部完成，感谢使用！');
}

main().catch(err => {
  console.error('\n❌ 运行出错:', err);
  process.exit(1);
});
