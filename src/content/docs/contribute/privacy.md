---
title: "Privacy"
description: "Zacess is private by default. This file says what the apps store, what the website records and the rules any future cloud feature has to follow."
section: "contribute"
order: 55
product: "Zacess"
source: "community"
repo: "zacesshq/.github"
ref: "9d13dfbf2f52894883982e73f4a193056a61039d"
refLabel: "main at 9d13dfb"
path: "PRIVACY.md"
sourceUrl: "https://github.com/zacesshq/.github/blob/9d13dfbf2f52894883982e73f4a193056a61039d/PRIVACY.md"
---

Zacess is private by default. This file says what the apps store, what the website records and the rules any future cloud feature has to follow. It is the source for the [privacy page on zacess.com](https://zacess.com/privacy/) and it applies to every repository in this organisation.

## The apps

Lecture slides, notes and recordings can say a lot about a person, including their access needs, so Zacess keeps them on the device.

- **Nothing is uploaded.** Opening a file, recognising its text, transcribing a lecture, applying a reading profile and exporting all run on the device. The browser version at [app.zacess.com](https://app.zacess.com) works the same way: the file stays in the browser.
- **No account.** Zacess works fully without one. An optional account for syncing a library across devices comes with sync in v3. It is never needed to read, listen or study.
- **Works offline.** Everything that runs on the device keeps working with no connection.
- **Nothing fetched behind your back.** A clipped web page is read as it was sent. Linked pages, images and scripts are never downloaded.
- **Transcription stays local.** The transcription engine refuses any recogniser that would send audio off the device, so a cloud service cannot be plugged in by mistake.
- **Full export.** The whole library can be exported in open formats at any time.

Encryption of the library on the device, encrypted backups and a written schedule for how long each kind of data is kept are planned and not built yet.

## The website

This section covers zacess.com.

- **No cookies.** The site sets none.
- **No tracking and no advertising.** There are no advertising or tracking scripts and no third-party embeds.
- **Counting visits.** Cloudflare Web Analytics counts visits. It uses no cookies, stores nothing on the device and does not build a profile of anyone or follow them across sites. It records page views, the referring page, the browser and the country, in aggregate. Cloudflare does not store IP addresses for these analytics.
- **One local setting.** Choosing Light or Dark mode saves that choice in the browser's local storage so the next page opens the same way. It never leaves the browser. Choosing System removes it.
- **Self-hosted fonts.** The Atkinson Hyperlegible typeface is served from the site, so no font service sees the visit.
- **Hosting.** The site is hosted on Cloudflare. Like any web host, Cloudflare may process request logs, such as IP addresses, to deliver the site and keep it secure.
- **Links out.** Links to GitHub and to the extension stores lead to those sites, whose own privacy policies apply there.

## Rules for any future cloud feature

Some jobs, such as cloud voices, heavy processing of very messy scans and storage for sync, may one day use a server. Any cloud feature follows these rules:

1. **Opt in.** Off unless the reader turns it on. Everything that runs on the device stays free and keeps working without it.
2. **Labelled.** Anything made in the cloud says so.
3. **Shown first.** Before a cloud task starts, Zacess shows which tasks run on the device, which need a server and exactly what data would leave the device.
4. **Exportable.** Anything held on a server can be exported in open formats, the same as the local library.
5. **Deletable.** The reader can delete anything held on a server, the account included.
6. **Part of the paid tier.** Cloud features cost money to run, so they belong to the optional paid tier. The free core never depends on them.

Sync between devices is planned with end-to-end encryption as the goal. The optional AI helpers planned for v4 follow the same rules: off by default, always labelled and run on the device first.

## Questions

Email [contact@zacess.com](mailto:contact@zacess.com) with any question about privacy or data. A security problem is reported privately by following [SECURITY.md](/docs/contribute/security/), never in a public issue or discussion.

Last updated on 3 November 2026.
