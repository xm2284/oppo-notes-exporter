# OPPO Cloud Notes Exporter (ColorOS Notes Backup Tool)

[中文文档 (Chinese)](README.md) | English Documentation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

One-click exporter for OPPO Cloud (ColorOS Sticky Notes) to **Markdown, CSV, and JSON** formats. Designed for mobile switching backups and second-brain migrations (Obsidian, Notion, Logseq).

---

## 📸 Demo Preview

![Terminal Run Demo](assets/demo.svg)

---

## 🌟 Highlights

- **Bypass AES Encryption without Breaking**: OPPO Cloud notes employ AES payload encryption and timestamp signatures. Instead of fragile reverse-engineering, this tool taps directly into the browser runtime via Chrome DevTools Protocol (CDP) to extract decrypted plaintexts.
- **Full Text without Truncation**: Bypasses the lazy-loaded 50-character list preview, automatically scrolling and clicking through virtual elements to acquire complete note bodies.
- **Preserved Typography & Checkboxes**:
  - Restores paragraphs, line breaks, and whitespace indentation.
  - Converts original todo elements to standard Markdown checkboxes (`☑` checked / `☐` unchecked).
- **Multiple Export Formats**:
  - `notes.json`: Comprehensive structured data with timestamps, attachments, and original HTML.
  - `notes.csv`: UTF-8 BOM embedded for instant Microsoft Excel compatibility without mojibake.
  - `notes.md`: Consolidated chronological Markdown file.
  - `markdown/`: Individual note files with YAML Frontmatter for seamless Obsidian integration.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (>= 18.0.0)
- Google Chrome or Microsoft Edge installed

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/xm2284/oppo-notes-exporter.git
cd oppo-notes-exporter

# 2. Install dependencies
npm install

# 3. Start export
npm start
```

1. An isolated browser window will launch automatically;
2. Log into your OPPO Cloud account via QR Code or SMS;
3. Once the notes interface is visible, press **Enter** in your terminal;
4. The tool will automatically scroll, extract, and write files to `./output`.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
