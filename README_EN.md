# OPPO Cloud Notes Exporter (ColorOS Notes Backup Tool)

[中文文档 (Chinese)](README.md) | English Documentation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

One-click exporter for OPPO Cloud (ColorOS Sticky Notes) to **Markdown, CSV, and JSON** formats. Designed for mobile switching backups and second-brain migrations (Obsidian, Notion, Logseq).

---

## 📸 Demo Preview

![Terminal Run Demo](assets/demo.svg)

---

## 💡 Why This Project? (Motivation)

> **"My memories are scattered across my phone notes, yet I couldn't take them with me."**

Like many people, I have used phone sticky notes for years to capture thoughts, exam prep, daily agendas, and project brainstorms. When I wanted to **revisit my past journey and feed these real, raw notes into Large Language Models (LLMs) to construct a personal "Digital Twin" / AI Persona**, I ran into a wall:

1. **Vendor Lock-in**: OPPO Cloud (ColorOS) offers sync across devices, but **no export feature** exists. Manually copying hundreds of notes one by one is painful and impractical.
2. **Hidden Payload Encryption**: The web interface encrypts data in-transit using AES, rendering traditional scraping techniques useless.
3. **Data Sovereignty**: Our thoughts belong to us, not a walled garden. Users should have the right to migrate their data anywhere—into Obsidian, Notion, or personal AI agents.

This tool was born out of my own necessity to break free, export 400+ personal notes, and train a personalized AI profile. I am open-sourcing it in hopes that **it helps anyone looking to reclaim their data sovereignty and archive their personal digital footprints.**

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
