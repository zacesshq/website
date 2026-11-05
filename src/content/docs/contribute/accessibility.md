---
title: "Accessibility"
description: "Zacess exists to make reading accessible, so its own accessibility is held to the highest standard we can meet."
section: "contribute"
order: 54
product: "Zacess"
source: "community"
repo: "zacesshq/.github"
ref: "9d13dfbf2f52894883982e73f4a193056a61039d"
refLabel: "main at 9d13dfb"
path: "ACCESSIBILITY.md"
sourceUrl: "https://github.com/zacesshq/.github/blob/9d13dfbf2f52894883982e73f4a193056a61039d/ACCESSIBILITY.md"
---

Zacess exists to make reading accessible, so its own accessibility is held to the highest standard we can meet. This statement applies to every Zacess repository that does not have its own `ACCESSIBILITY.md`.

## Our commitments

- **WCAG 2.2 AA** as the minimum everywhere, with **AAA contrast** (7:1) in the reading view.
- **Screen readers tested** before each release: VoiceOver on macOS and iOS, TalkBack on Android, NVDA and JAWS on Windows and Orca on Linux.
- **Full keyboard use** with visible focus, plus support for switch access and voice control.
- **Colour is never the only signal.** Every state carries a label, icon or text as well.
- **Reduced motion respected.** Animation follows the system's reduced-motion setting.
- **Every control is labelled** and every image has alt text or a description.
- **Disabled users test every phase** before it ships, across different access needs.

## Documentation

Documentation across the organisation aims to:

- Use a real heading outline, so screen readers and the page outline can jump between sections.
- Use link text that says where the link goes, never "click here".
- Give images, diagrams and badges alt text. Write diagrams as Mermaid where possible, so their content is text.
- Show code, commands and output as text, never as screenshots.
- Never rely on colour alone: callouts carry a label such as Note, Tip or Warning.
- Use plain language, explaining a term where it first appears.

## Status

Zacess is pre-release. A conformance report listing supported assistive technologies, known limitations and test results will be published with the first release.

## Reporting a barrier

If anything in Zacess or its documentation is hard to read or use, tell us in [Discussions](https://github.com/orgs/zacesshq/discussions) or at [contact@zacess.com](mailto:contact@zacess.com). Once issues open on [zacesshq/zacess](https://github.com/zacesshq/zacess), use the `accessibility` label there. Please say what you were trying to do, the assistive technology you use and what went wrong. Accessibility problems are treated as bugs.
