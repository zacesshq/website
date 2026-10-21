// one realistic sample per language for the code themes playground; each is short enough to read in
// a single screen and uses comments, strings, numbers, types and keywords so every token colour shows
export interface Sample {
  id: string;
  name: string;
  lang: string;
  code: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "typescript",
    name: "TypeScript",
    lang: "typescript",
    code: `// a reading profile, saved one file per profile
export interface Profile {
  name: string;
  fontSize: number;
  theme: "dark_on_light" | "yellow_on_black";
}

const AAA = 7;

/** WCAG relative luminance of a #rrggbb colour */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function passes(text: string, background: string): boolean {
  const [hi, lo] = [luminance(text), luminance(background)].sort((x, y) => y - x);
  const ratio = (hi + 0.05) / (lo + 0.05);
  if (ratio < AAA) {
    console.warn(\`only \${ratio.toFixed(2)}:1\`);
  }
  return ratio >= AAA;
}`,
  },
  {
    id: "javascript",
    name: "JavaScript",
    lang: "javascript",
    code: `// read a page aloud one sentence at a time, highlighting each word
const synth = window.speechSynthesis;
const rate = Number(localStorage.getItem("rate") ?? 1.0);

export async function readAloud(page) {
  const sentences = page.text.split(/(?<=[.!?])\\s+/);
  for (const [index, sentence] of sentences.entries()) {
    await speak(sentence, index);
  }
}

function speak(sentence, index) {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = rate;
    utterance.onboundary = (event) => highlight(index, event.charIndex);
    utterance.onend = resolve;
    utterance.onerror = reject;
    synth.speak(utterance);
  });
}

class ReadingRuler extends HTMLElement {
  static observedAttributes = ["lines"];
}`,
  },
  {
    id: "python",
    name: "Python",
    lang: "python",
    code: `"""Score OCR output against a known transcript."""
from dataclasses import dataclass
from pathlib import Path

LOW_CONFIDENCE = 0.80


@dataclass
class Word:
    text: str
    confidence: float

    @property
    def needs_check(self) -> bool:
        return self.confidence < LOW_CONFIDENCE


def flagged(words: list[Word]) -> list[str]:
    # a misread number matters more than a misread word
    return [w.text for w in words if w.needs_check or w.text.isdigit()]


if __name__ == "__main__":
    words = [Word("7:1", 0.62), Word("contrast", 0.97)]
    print(f"{len(flagged(words))} words to check in {Path.cwd().name}")`,
  },
  {
    id: "rust",
    name: "Rust",
    lang: "rust",
    code: `use std::fmt;

/// A contrast theme from the reader's profile.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Contrast {
    DarkOnLight,
    LightOnDark,
    YellowOnBlack,
    BlackOnCream,
    HighContrastDark,
    HighContrastLight,
    DeepContrastDark,
    DeepContrastLight,
}

impl Contrast {
    pub fn colours(self) -> (&'static str, &'static str) {
        match self {
            Contrast::DarkOnLight => ("#111111", "#ffffff"),
            Contrast::LightOnDark => ("#f5f5f5", "#121212"),
            Contrast::YellowOnBlack => ("#ffeb3b", "#000000"),
            Contrast::BlackOnCream => ("#000000", "#fdf6e3"),
            Contrast::HighContrastDark => ("#ffffff", "#000000"),
            Contrast::HighContrastLight => ("#000000", "#ffffff"),
            Contrast::DeepContrastDark => ("#ffffff", "#000000"),
            Contrast::DeepContrastLight => ("#000000", "#ffffff"),
        }
    }
}

impl fmt::Display for Contrast {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let (text, background) = self.colours();
        write!(f, "{text} on {background}")
    }
}`,
  },
  {
    id: "java",
    name: "Java",
    lang: "java",
    code: `package com.zacess.library;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Keeps every saved version of a note so nothing is lost. */
public final class VersionHistory {
    private static final int MAX_VERSIONS = 50;
    private final List<Version> versions = new ArrayList<>();

    public record Version(String text, Instant savedAt) {}

    public void save(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("empty note");
        }
        versions.add(new Version(text, Instant.now()));
        while (versions.size() > MAX_VERSIONS) {
            versions.remove(0);
        }
    }

    public Version latest() {
        return versions.get(versions.size() - 1);
    }
}`,
  },
  {
    id: "c",
    name: "C",
    lang: "c",
    code: `#include <math.h>
#include <stdio.h>
#include <stdlib.h>

/* the linear value of one sRGB channel, 0 to 255 */
static double channel(unsigned value) {
    double c = value / 255.0;
    return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4);
}

static double luminance(unsigned rgb) {
    return 0.2126 * channel(rgb >> 16 & 0xff)
         + 0.7152 * channel(rgb >> 8 & 0xff)
         + 0.0722 * channel(rgb & 0xff);
}

int main(int argc, char **argv) {
    if (argc != 3) {
        fprintf(stderr, "usage: %s text background\\n", argv[0]);
        return EXIT_FAILURE;
    }
    double a = luminance(strtoul(argv[1], NULL, 16));
    double b = luminance(strtoul(argv[2], NULL, 16));
    printf("%.2f:1\\n", (fmax(a, b) + 0.05) / (fmin(a, b) + 0.05));
    return EXIT_SUCCESS;
}`,
  },
  {
    id: "cpp",
    name: "C++",
    lang: "cpp",
    code: `#include <algorithm>
#include <string>
#include <vector>

namespace zacess {

// one line of a page with the confidence of its weakest word
struct Line {
    std::string text;
    float confidence = 1.0F;
};

template <typename Range>
auto weakest(const Range& lines, std::size_t count) {
    std::vector<Line> sorted(std::begin(lines), std::end(lines));
    std::ranges::sort(sorted, {}, &Line::confidence);
    sorted.resize(std::min(count, sorted.size()));
    return sorted;
}

constexpr auto kReviewBelow = 0.8F;

}  // namespace zacess

int main() {
    const std::vector<zacess::Line> page{{"Figure 3", 0.55F}, {"Results", 0.98F}};
    return zacess::weakest(page, 1).front().confidence < zacess::kReviewBelow ? 1 : 0;
}`,
  },
  {
    id: "csharp",
    name: "C#",
    lang: "csharp",
    code: `using System;
using System.Collections.Generic;
using System.Linq;

namespace Zacess.Study;

/// <summary>A flashcard scheduled by how well it was remembered.</summary>
public sealed record Card(string Front, string Back, DateTime Due);

public static class Scheduler
{
    private const double Growth = 2.5;

    public static Card Review(Card card, bool remembered, int intervalDays)
    {
        var next = remembered ? (int)Math.Ceiling(intervalDays * Growth) : 1;
        return card with { Due = DateTime.UtcNow.AddDays(next) };
    }

    public static IEnumerable<Card> DueToday(IEnumerable<Card> deck) =>
        deck.Where(c => c.Due <= DateTime.UtcNow)
            .OrderBy(c => c.Due);
}`,
  },
  {
    id: "go",
    name: "Go",
    lang: "go",
    code: `package export

import (
	"fmt"
	"html"
	"strings"
)

// Heading is one entry in a document's outline.
type Heading struct {
	Level int
	Text  string
}

// HTML writes the outline as nested headings, never skipping a level.
func HTML(headings []Heading) (string, error) {
	var b strings.Builder
	previous := 0
	for i, h := range headings {
		if h.Level > previous+1 {
			return "", fmt.Errorf("heading %d jumps from h%d to h%d", i, previous, h.Level)
		}
		fmt.Fprintf(&b, "<h%d>%s</h%d>\\n", h.Level, html.EscapeString(h.Text), h.Level)
		previous = h.Level
	}
	return b.String(), nil
}`,
  },
  {
    id: "php",
    name: "PHP",
    lang: "php",
    code: `<?php

declare(strict_types=1);

namespace Zacess\\Feedback;

use InvalidArgumentException;

/**
 * Stores a barrier report without asking for a diagnosis.
 */
final class BarrierReport
{
    public function __construct(
        public readonly string $whatHappened,
        public readonly ?string $assistiveTech = null,
    ) {
        if (trim($whatHappened) === '') {
            throw new InvalidArgumentException('Tell us what got in the way.');
        }
    }

    public function summary(int $length = 80): string
    {
        return mb_strimwidth($this->whatHappened, 0, $length, '...');
    }
}`,
  },
  {
    id: "ruby",
    name: "Ruby",
    lang: "ruby",
    code: `# frozen_string_literal: true

require "json"

# Imports a reading profile exported from another device.
class ProfileImport
  PRESETS = %w[low_vision dyslexia_friendly reduced_clutter screen_reader].freeze

  attr_reader :errors

  def initialize(path)
    @data = JSON.parse(File.read(path), symbolize_names: true)
    @errors = []
  end

  def valid?
    errors << "unknown preset" unless PRESETS.include?(@data[:preset])
    errors << "size must be 8 to 72" unless (8..72).cover?(@data[:font_size].to_i)
    errors.empty?
  end

  def to_s = "#{@data[:name]} (#{@data[:preset]})"
end`,
  },
  {
    id: "swift",
    name: "Swift",
    lang: "swift",
    code: `import SwiftUI

/// A page shown in the reader's own profile.
struct ReadingView: View {
    let page: Page
    @AppStorage("fontSize") private var fontSize = 24.0
    @Environment(\\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ScrollView {
            Text(page.text)
                .font(.custom("Atkinson Hyperlegible", size: fontSize))
                .lineSpacing(fontSize * 0.6)
                .foregroundStyle(Color(hex: 0xFFEB3B))
                .padding()
        }
        .background(Color.black)
        .animation(reduceMotion ? nil : .easeInOut, value: fontSize)
        .accessibilityLabel(page.title)
    }
}`,
  },
  {
    id: "kotlin",
    name: "Kotlin",
    lang: "kotlin",
    code: `package com.zacess.capture

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/** A slide detected in a projector frame, with how sure the detector is. */
data class Slide(val number: Int, val text: String, val confidence: Double)

sealed interface CaptureState {
    data object Idle : CaptureState
    data class Recording(val seconds: Long) : CaptureState
    data class Failed(val reason: String) : CaptureState
}

class SlideTracker(private val threshold: Double = 0.9) {
    fun newSlides(frames: Flow<Slide>): Flow<Slide> {
        var last: Int? = null
        return frames.map { slide ->
            if (slide.confidence >= threshold && slide.number != last) {
                last = slide.number
            }
            slide
        }
    }
}`,
  },
  {
    id: "html",
    name: "HTML",
    lang: "html",
    code: `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Week 4: signals</title>
  <link rel="stylesheet" href="/profile.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <main id="main">
    <h1>Week 4: signals</h1>
    <!-- low confidence words are marked, never hidden -->
    <p>The cut-off frequency is <mark data-confidence="0.62">1.6 kHz</mark>.</p>
    <figure>
      <img src="bode.png" alt="Bode plot falling 20 dB per decade after 1.6 kHz">
      <figcaption>Figure 3: the filter's response</figcaption>
    </figure>
    <button type="button" aria-pressed="false">Read aloud</button>
  </main>
</body>
</html>`,
  },
  {
    id: "css",
    name: "CSS",
    lang: "css",
    code: `/* the Low Vision preset: large type, wide spacing and yellow on black */
:root {
  --text: #ffeb3b;
  --background: #000000;
  --measure: 45ch;
}

body {
  background: var(--background);
  color: var(--text);
  font: 400 1.5rem/1.6 "Atkinson Hyperlegible", system-ui, sans-serif;
  letter-spacing: 0.02em;
}

main {
  max-width: var(--measure);
  margin-inline: auto;
}

:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}`,
  },
  {
    id: "json",
    name: "JSON",
    lang: "json",
    code: `{
  "name": "Low Vision",
  "font": "Atkinson Hyperlegible",
  "font_size": 24,
  "line_spacing": 1.6,
  "character_spacing": 0.02,
  "column_width": 45,
  "contrast": "yellow_on_black",
  "cursor_size": "extra_large",
  "reading_ruler": {
    "enabled": true,
    "position": 0.4,
    "lines": 1
  },
  "single_column": true,
  "reduce_motion": true,
  "hide_decoration": false,
  "speech": {
    "voice": null,
    "rate": 1.0,
    "highlight": "word"
  }
}`,
  },
  {
    id: "yaml",
    name: "YAML",
    lang: "yaml",
    code: `# checks every pull request before it can merge
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  contrast:
    name: Palette and contrast
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - run: npm run check
      - run: npm run verify`,
  },
  {
    id: "markdown",
    name: "Markdown",
    lang: "markdown",
    code: `# Week 4: signals

Lecture notes, imported from the slides and checked by hand.

## Key ideas

- A **low pass** filter keeps the slow parts of a signal.
- The *cut-off frequency* is where the output falls to 70.7% of the input.
- Each extra order adds 20 dB per decade of roll-off.

> [!NOTE]
> The number on slide 12 was misread by OCR and corrected here.

| Order | Roll-off |
| --- | --- |
| 1 | 20 dB per decade |
| 2 | 40 dB per decade |

\`\`\`python
cutoff = 1 / (2 * pi * r * c)
\`\`\`

See [the full handout](handout.pdf) for the derivation.`,
  },
  {
    id: "bash",
    name: "Bash",
    lang: "bash",
    code: `#!/usr/bin/env bash
# exports every document in the library as accessible HTML
set -euo pipefail

library="\${1:-$HOME/Zacess}"
out="\${2:-./export}"
count=0

mkdir -p "$out"

for doc in "$library"/*.zacess; do
  [[ -e "$doc" ]] || continue
  name="$(basename "$doc" .zacess)"
  if zacess export --format html --profile low-vision "$doc" > "$out/$name.html"; then
    count=$((count + 1))
  else
    echo "could not export $name" >&2
  fi
done

echo "exported $count documents to $out"`,
  },
  {
    id: "sql",
    name: "SQL",
    lang: "sql",
    code: `-- flashcards due today, weakest first
CREATE TABLE IF NOT EXISTS cards (
    id          INTEGER PRIMARY KEY,
    deck_id     INTEGER NOT NULL REFERENCES decks (id),
    front       TEXT    NOT NULL,
    back        TEXT    NOT NULL,
    stability   REAL    DEFAULT 1.0,
    due_at      TEXT    NOT NULL
);

SELECT c.id,
       c.front,
       d.name AS deck,
       ROUND(c.stability, 2) AS stability
FROM cards AS c
JOIN decks AS d ON d.id = c.deck_id
WHERE date(c.due_at) <= date('now')
  AND d.archived = 0
ORDER BY c.stability ASC, c.due_at
LIMIT 20;`,
  },
];
