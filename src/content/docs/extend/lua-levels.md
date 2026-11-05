---
title: "Lua levels"
description: "Trace and Relay read their levels from Lua files and Learn to Code reads its tracks from them."
section: "extend"
order: 48
product: "Zacess Games"
source: "games"
repo: "zacesshq/games"
ref: "v0.4.0"
refLabel: "v0.4.0"
release: "0.4.0"
path: "README.md"
heading: "Levels in Lua"
sourceUrl: "https://github.com/zacesshq/games/blob/v0.4.0/README.md"
---

Trace and Relay read their levels from Lua files and Learn to Code reads its tracks from them. A
Trace or Relay file returns one level or a list, each with a `name`, a `note`, a `map` of strings
and a `budget` (Trace) or `par` (Relay). A Learn to Code file returns a track: a language, an id
and its levels, each with a lesson, code lines with blanks, the answers each blank takes, a hint,
the mistakes it teaches about and the program's output. The format is described at the top of each
built-in file in [`levels/`](https://github.com/zacesshq/games/tree/v0.4.0/levels/).

Extra files go in a folder named after the game under `~/.config/zacess/games`
(`%APPDATA%\zacess\games` on Windows) and play after the built-in ones. A file runs in a sandbox
like the one Scenes gives its Lua scenes: no file, process, network or module access, a memory cap
and an instruction budget. Learn to Code checks answers against each level's own list inside the
game. Nothing typed is ever run as a program.
