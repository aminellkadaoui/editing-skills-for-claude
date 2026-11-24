# Editing Skills for Claude — سكيلات مونتاج وموشن لـ Claude

مجموعة سكيلات لـ **Claude Code** تخلّي الذكاء الاصطناعي يشتغل داخل برامج المونتاج نفسها
(After Effects و Premiere) ويسوي شغل موشن حقيقي: تحريك مخطوطات، وقوالب MOGRT متجاوبة، وغيرها.
كل سكيل مبني على مشروع حقيقي، وفيه الطريقة كاملة، والسكربتات، والأخطاء اللي تعلّمنا منها.

A collection of **Claude Code skills** for video editors and motion designers. Each skill drives
After Effects / Premiere directly and is built from a real client project — method, scripts and
lessons learned included.

## Skills

| Skill | What it does | Demo |
|---|---|---|
| [**mogrt-maker**](skills/mogrt-maker) | Responsive MOGRT templates for Premiere: one CONTROL layer, box follows the text (RTL, grows left), padding grid, true centring, liquid glass that blurs the video in Premiere, In mirrored as Out, Essential Graphics. | ![](skills/mogrt-maker/examples/sheikh-name-lowerthird.gif) |
| [**calligraphy-writeon**](skills/calligraphy-writeon) | Animates an Arabic calligraphy logo (.ai) as if written with a pen: centre lines computed from the letters, matte strokes, pen line, bounce, particles, caption in the exact PDF font. | ![](skills/calligraphy-writeon/examples/hidayat-writeon.gif) |

## Install
```bash
git clone https://github.com/aminellkadaoui/editing-skills-for-claude.git
cp -R editing-skills-for-claude/skills/<skill-name> ~/.claude/skills/
```
Then ask Claude in your own words, e.g. «سوّ مورجريت لاسم الضيف» or «حرّك المخطوطة».

Most skills talk to After Effects through an **AE-MCP** command-folder bridge
(`~/Documents/ae-mcp-commands`); each skill's README lists what it needs.

## How this repo grows
Every new editing skill gets its own folder in `skills/` with `SKILL.md` (the method),
`README.md` (for people), `scripts/` and `examples/` (a short render of the result).

---
Made by **Amine** with Claude Code. Code: MIT. Logos, footage and designs in `examples/` belong to
their owners and are shown only as demos.
