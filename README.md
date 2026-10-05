# OPPO Cloud Notes Exporter (ColorOS 便签全量导出工具)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

一键将 OPPO 云服务（ColorOS 随身工作台）中的全部便签导出为 **Markdown、CSV、JSON** 格式。专为换机备份、知识库迁移（Obsidian / Notion / Logseq）打造。

---

## 🌟 核心特性

- **破解加密壁垒**：OPPO 云笔记传输层采用 AES-CBC 动态加解密，本工具采用 CDP 协议注入宿主会话，直接在浏览器运行时提取已解密明文，免去破解签名与加密算法的繁琐和失效风险。
- **正文完整无截断**：突破列表接口仅返回前几十字预览片段的限制，自动触发懒加载并逐篇提取全文。
- **保留结构化排版**：
  - 自动保留换行、段落间距与空格。
  - 将原生待办列表还原为 Markdown 标准复选框（`☑` 已完成 / `☐` 未完成）。
- **多格式一键导出**：
  - `notes.json`：包含版本号、时间戳、附件统计、原始 HTML 的全量元数据。
  - `notes.csv`：带 UTF-8 BOM 头，Microsoft Excel 双击直开无乱码。
  - `notes.md`：按更新时间倒序汇总的单文件 Markdown。
  - `markdown/`：独立 Markdown 文件目录，内置 Frontmatter（YAML 元信息），支持直接导入 Obsidian / Logseq。
- **安全免密**：不在任何服务器或代码中保存账号密码，仅在本地启动只读隔离浏览器，登录态完全由官方页面处理。

---

## 🚀 快速开始

### 依赖环境
- [Node.js](https://nodejs.org/) (>= 18.0.0)
- 本地安装有 Google Chrome 或 Microsoft Edge 浏览器

### 1. 克隆项目与安装依赖

```bash
git clone https://github.com/xm2284/oppo-notes-exporter.git
cd oppo-notes-exporter
npm install
```

### 2. 运行导出

```bash
npm start
```

### 3. 操作流程
1. 终端会自动打开一个带调试端口的独立 Edge/Chrome 窗口并访问 OPPO 云服务；
2. 在浏览器中扫码或输入密码登录你的 OPPO 账号；
3. 确认便签列表已加载出来后，返回命令行按 **回车**；
4. 工具将自动完成滚轮遍历、详情读取与文件保存。

---

## 📂 导出文件预览

导出完成后，将在项目根目录生成 `output/` 文件夹：

```text
output/
├── notes.json            # 全量 JSON 数据
├── notes.csv             # Excel 兼容表格
├── notes.md              # 汇总版 Markdown
└── markdown/             # 独立 Markdown 文件库
    ├── 001_毕业设计选题.md
    ├── 002_常用词汇备忘.md
    └── ...
```

### 单篇 Markdown 结构示例

```markdown
---
title: "一定要精确到时间，不要乱"
created: "2026/09/28 14:10:05"
updated: "2026/10/05 21:38:38"
group: "日常规划"
recordId: "20261005xxxx"
---

一定要精确到时间，不要乱
你要知道你要什么，未来是怎么样的

☐ 1. 软著申请
☑ 2. 背单词
☑ 3. 做英语试卷
```

---

## 🛠️ 技术原理

```text
[本地 Edge / Chrome]
        │ (CDP: 9222)
[oppo-notes-exporter CLI]
        ├── 1. 挂钩运行时 JSON.parse (捕获解密后的详情数据包)
        ├── 2. 模拟真实滚轮事件，遍历虚拟列表 (突破懒加载)
        ├── 3. 逐条触发列表项激活，触发解密逻辑
        └── 4. HTML AST 清洗 -> 还原排版/复选框 -> 多格式输出
```

---

## ⚠️ 免责声明 (Disclaimer)

1. 本项目仅供个人学习、技术研究以及备份自己合法拥有的数据使用。
2. 本项目不提供任何破解鉴权、绕过登录或针对云端服务器的未经授权访问能力。
3. 请合理控制调用频率，尊重云服务提供商的服务条款与带宽。

---

## 📄 开源许可

本项目基于 [MIT 协议](LICENSE) 开源。欢迎提 Issue 与 PR！
