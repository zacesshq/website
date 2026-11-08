// the Zacess studio: works every [data-studio] block on the page (see src/components/Studio.astro).
// the recordings are drawn by window.ZacessFrames from /scenes-player.js, so that script must load
// first. Every asset path comes from the manifest on the root (data-config), so pointing the base at
// a bucket moves every scene and game without touching this file.
//
// loading rules: only the chosen item is fetched. A recording waits until the studio is near the
// screen. Under reduced motion its first frame is held until Play and the laptop is drawn flat.
// Anything that moves has a visible Pause button, since a loop runs past five seconds. It also
// pauses while off screen or in a hidden tab.
(function () {
  var roots = document.querySelectorAll("[data-studio]");
  if (!roots.length) return;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var cache = {};
  var codeSheet = false;
  var STORE = "zacess-studio";

  function getJSON(url) {
    if (!cache[url]) {
      cache[url] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
      // a failed fetch is not cached, so choosing the item again tries once more
      cache[url].catch(function () { delete cache[url]; });
    }
    return cache[url];
  }

  // the code colours are a large sheet only Editor themes needs, so it loads the first time that mode opens
  function loadCodeSheet() {
    if (codeSheet) return;
    codeSheet = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/themes/code-themes.css";
    document.head.appendChild(link);
  }

  function words(slug) {
    var t = slug.replace(/-/g, " ");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  Array.prototype.forEach.call(roots, setup);

  function setup(root) {
    var config;
    try { config = JSON.parse(root.getAttribute("data-config")); } catch (e) { return; }
    var F = window.ZacessFrames;
    var $ = function (sel) { return root.querySelector(sel); };
    var screen = $(".st-screen");
    var canvas = $(".st-canvas");
    var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    var still = $(".st-still");
    var views = { frames: $(".st-view-frames"), code: $(".st-view-code"), profile: $(".st-view-profile") };
    var barTitle = $(".st-bar-title");
    var barTheme = $(".st-bar-theme");
    var title = $(".st-title");
    var desc = $(".st-desc");
    var note = $(".st-note");
    var status = $(".st-status");
    var playButton = $(".st-play");
    var tiltButton = $(".st-tilt");
    var loading = $(".st-loading");
    var stage = $(".st-stage");
    var swatch = $(".st-swatch");
    var base = String(config.base || "").replace(/\/$/, "");
    var available = config.available || {};
    var fallback = config.fallback || {};

    var state = { mode: "scenes", theme: "deep-contrast-dark", items: {} };
    var recording = null;
    var cellWidth = 9;
    var frame = 0;
    var timer = null;
    var playing = !reduce.matches;
    // two separate reasons to pause, so coming back to the tab never restarts a loop off screen
    var onScreen = true;
    var tabVisible = !document.hidden;
    var near = !("IntersectionObserver" in window);
    var token = 0;

    root.classList.add("st-ready");

    // ---- controls: radios for the mode, native selects for the theme and each mode's item
    function controls(kind, mode) {
      var sel = '[data-st="' + kind + '"]' + (mode ? '[data-mode="' + mode + '"]' : "");
      return Array.prototype.slice.call(root.querySelectorAll(sel));
    }
    function valueOf(kind, mode) {
      var list = controls(kind, mode);
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.tagName === "SELECT") return el.value;
        if (el.checked) return el.value;
      }
      return list.length && list[0].tagName !== "SELECT" ? list[0].value : null;
    }
    function setValue(kind, mode, value) {
      controls(kind, mode).forEach(function (el) {
        if (el.tagName === "SELECT") el.value = value;
        else el.checked = el.value === value;
      });
    }
    // the radio or option that carries an item's label and flags
    function itemEl(mode, id) {
      var list = controls("item", mode);
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.tagName === "SELECT") {
          for (var o = 0; o < el.options.length; o++) if (el.options[o].value === id) return el.options[o];
        } else if (el.value === id) return el;
      }
      return null;
    }
    function themeName(id) {
      var list = controls("theme");
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.tagName === "SELECT") {
          for (var o = 0; o < el.options.length; o++) if (el.options[o].value === id) return el.options[o].getAttribute("data-name");
        } else if (el.value === id) return el.getAttribute("data-name");
      }
      return id;
    }
    function has(key, theme, id) {
      var list = available[key] && available[key][theme];
      return Boolean(list && list.indexOf(id) >= 0);
    }
    function path(template, theme, id) {
      return template.replace("{theme}", theme).replace("{id}", id);
    }
    function asset(key, theme, id) { return base + "/" + path(config.layout[key], theme, id); }

    // ---- the recording
    function schedule() {
      clearTimeout(timer);
      if (!playing || !onScreen || !tabVisible || !recording || state.mode === "code" || state.mode === "profile") return;
      timer = setTimeout(function () {
        frame = (frame + 1) % recording.frames.length;
        F.draw(ctx, recording, frame, cellWidth);
        schedule();
      }, 1000 / recording.fps);
    }
    function showPlay() {
      playButton.textContent = playing ? "Pause" : "Play";
      playButton.setAttribute("aria-label", (playing ? "Pause" : "Play") + " the recording");
    }

    // where the recording and still for the current item come from: this theme's own files when
    // the studio tree has them, otherwise the release copy in its single theme, said plainly in the note
    function sources(mode, theme, id, releaseOnly) {
      var el = itemEl(mode, id);
      var framesKey = mode === "scenes" ? "scenes" : "games";
      var stillKey = mode === "scenes" ? "sceneStills" : "gameStills";
      var out = { frames: null, still: null, framesTheme: theme, stillTheme: theme };
      if (!releaseOnly && has(framesKey, theme, id)) out.frames = asset(mode === "scenes" ? "sceneFrames" : "gameFrames", theme, id);
      else if (el && el.hasAttribute("data-frames")) { out.frames = path(fallback[mode === "scenes" ? "sceneFrames" : "gameFrames"], fallback.theme, id); out.framesTheme = fallback.theme; }
      if (!releaseOnly && has(stillKey, theme, id)) out.still = asset(mode === "scenes" ? "sceneStill" : "gameStill", theme, id);
      else if (el && el.hasAttribute("data-still")) { out.still = path(fallback[mode === "scenes" ? "sceneStill" : "gameStill"], fallback.theme, id); out.stillTheme = fallback.theme; }
      // a still in the same theme as the recording, so the switch from one to the other is seamless
      if (out.frames && out.framesTheme !== out.stillTheme && out.framesTheme === fallback.theme && el && el.hasAttribute("data-still")) {
        out.still = path(fallback[mode === "scenes" ? "sceneStill" : "gameStill"], fallback.theme, id);
        out.stillTheme = fallback.theme;
      }
      return out;
    }

    // a still from snapshot or snap draws its own window: a 30 pixel title bar, then the cells inset
    // 14 pixels at the sides, 40 at the top and 18 at the bottom. The crop keeps only the cells, so the
    // laptop's own bar is the only one on screen
    var crop = $(".st-crop");
    function fitStill() {
      var w = still.naturalWidth;
      var h = still.naturalHeight;
      if (!w || !h || w < 100 || h < 100) return;
      crop.style.setProperty("--st-iw", String(w));
      crop.style.setProperty("--st-ih", String(h));
    }
    still.addEventListener("load", fitStill);
    // a still the bucket does not have yet falls back to the release copy, when the release has one
    still.addEventListener("error", function () {
      var mode = state.mode;
      if (mode !== "scenes" && mode !== "games") return;
      var id = state.items[mode];
      var el = itemEl(mode, id);
      var key = mode === "scenes" ? "sceneStill" : "gameStill";
      var release = path(fallback[key], fallback.theme, id);
      if (!el || !el.hasAttribute("data-still") || still.getAttribute("src") === release) return;
      still.src = release;
    });
    if (still.complete) fitStill();

    function framesNote(mode, theme, src) {
      var kind = mode === "scenes" ? "scene" : "game";
      var shown = src.frames ? src.framesTheme : src.stillTheme;
      if (!src.frames && !src.still) return "This " + kind + " has not been recorded yet. It joins the studio with the next full set of recordings.";
      var what = src.frames ? (mode === "scenes" ? "A recording at 80 by 24" : "A recording of play at 80 by 24") : "A still";
      if (shown === theme) return what + " in " + themeName(theme) + ".";
      return "Not recorded in " + themeName(theme) + " yet, so this is the " + themeName(shown) + " " + (src.frames ? "recording" : "still") + " from the latest release.";
    }

    function renderFrames(mode, theme, id, announce, releaseOnly) {
      var el = itemEl(mode, id);
      var label = el ? el.getAttribute("data-label") : words(id);
      var text = el ? el.getAttribute("data-desc") : "";
      var src = sources(mode, theme, id, releaseOnly);
      var shownTheme = src.frames ? src.framesTheme : src.stillTheme;
      var name = (mode === "scenes" ? "The " + label.toLowerCase() + " scene" : label) + " in " + themeName(shownTheme) + (text ? ": " + text : "");
      barTitle.textContent = (mode === "scenes" ? "zacess-scenes " : "zacess-games ") + id;
      title.textContent = label;
      desc.textContent = text;
      note.textContent = framesNote(mode, theme, src);
      // the screen takes the theme of what is drawn on it, so the bar never clashes with the picture
      setScreenTheme(shownTheme);
      recording = null;
      clearTimeout(timer);
      canvas.hidden = true;
      if (src.still) {
        crop.hidden = false;
        still.hidden = false;
        if (still.getAttribute("src") !== src.still) still.src = src.still;
        still.alt = name;
      } else {
        crop.hidden = true;
      }
      canvas.setAttribute("aria-label", name);
      playButton.hidden = !src.frames;
      showPlay();
      if (announce) say(label + " in " + themeName(theme));
      var mine = ++token;
      if (!src.frames || !ctx || !F) return;
      // the fetch waits until the studio is near the screen. Paused or under reduced motion the first
      // frame is drawn and held, which matches the screen better than a still with its own window
      if (!near) return;
      loading.hidden = false;
      getJSON(src.frames).then(function (json) {
        if (mine !== token) return;
        loading.hidden = true;
        recording = json;
        frame = 0;
        cellWidth = F.size(canvas, ctx, json);
        F.draw(ctx, json, 0, cellWidth);
        canvas.hidden = false;
        crop.hidden = true;
        schedule();
      }).catch(function () {
        if (mine !== token) return;
        loading.hidden = true;
        // a file the manifest lists but the bucket does not have yet falls back to the release copy
        if (!releaseOnly && el && el.hasAttribute("data-frames") && src.frames !== path(fallback[mode === "scenes" ? "sceneFrames" : "gameFrames"], fallback.theme, id)) {
          renderFrames(mode, theme, id, false, true);
          return;
        }
        playButton.hidden = true;
        note.textContent = "The recording could not load, so the still is shown instead.";
      });
    }

    // ---- editor themes
    function renderCode(theme, lang, announce) {
      var el = itemEl("code", lang);
      var label = el ? el.getAttribute("data-label") : lang;
      barTitle.textContent = el ? el.getAttribute("data-file") : lang;
      title.textContent = label;
      desc.textContent = "The " + label + " sample from the code themes playground, coloured exactly as the editor extensions colour it.";
      note.textContent = "Rendered with the " + themeName(theme) + " editor theme.";
      setScreenTheme(theme);
      playButton.hidden = true;
      loadCodeSheet();
      if (announce) say(label + " in " + themeName(theme));
      var mine = ++token;
      var box = $(".st-code");
      loading.hidden = false;
      getJSON("/studio/code/" + theme + "/" + lang + ".json").then(function (json) {
        if (mine !== token) return;
        loading.hidden = true;
        // the fragment is this site's own build output, never user input
        box.innerHTML = json.html;
      }).catch(function () {
        if (mine !== token) return;
        loading.hidden = true;
        box.textContent = "";
        note.textContent = "The sample could not load. Try another language or reload the page.";
      });
    }

    // ---- profiles: the starter's TOML in an editor pane and zprf check in a terminal pane, both in
    // the profile's own palette, with its font size, line spacing and cursor size applied
    var PROPS = ["--st-bg", "--st-fg", "--st-surface", "--st-surface-alt", "--st-muted", "--st-border", "--st-accent", "--st-cursor", "--st-line", "--st-sel", "--st-sel-fg", "--st-s-keyword", "--st-s-string", "--st-s-number", "--st-s-comment", "--st-s-property", "--st-s-type", "--st-focus", "--st-scale", "--st-leading", "--st-cursor-w", "--st-ring"];
    function clearProfileProps() { PROPS.forEach(function (p) { screen.style.removeProperty(p); }); }
    function applyProfile(p) {
      var pal = p.palette || {};
      var syn = pal.syntax || {};
      var needs = p.needs || {};
      var set = function (prop, value) { if (value !== undefined && value !== null && value !== "") screen.style.setProperty(prop, String(value)); };
      set("--st-bg", pal.background); set("--st-fg", pal.foreground); set("--st-surface", pal.surface); set("--st-surface-alt", pal.surface_alt);
      set("--st-muted", pal.muted); set("--st-border", pal.border); set("--st-accent", pal.accent); set("--st-cursor", pal.cursor);
      set("--st-line", pal.line_highlight); set("--st-sel", pal.selection_background); set("--st-sel-fg", pal.selection_foreground);
      set("--st-s-keyword", syn.keyword); set("--st-s-string", syn.string); set("--st-s-number", syn.number); set("--st-s-comment", syn.comment);
      set("--st-s-property", syn.property); set("--st-s-type", syn.type); set("--st-focus", pal.focus_ring);
      var size = needs.font && needs.font.size_pt;
      // 14 point is the starter profiles' size, drawn at the screen's normal scale
      if (size) set("--st-scale", Math.max(0.8, Math.min(1.6, size / 14)).toFixed(3));
      if (needs.line_spacing) set("--st-leading", needs.line_spacing);
      set("--st-cursor-w", needs.cursor_size === "large" ? "1ch" : needs.cursor_size === "small" ? "0.15ch" : "0.55ch");
      if (needs.focus_ring_width_px) set("--st-ring", needs.focus_ring_width_px + "px");
    }

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    // a small TOML colouring: comments, table headers, keys, strings, numbers and booleans
    function tomlHtml(text) {
      return text.replace(/\n$/, "").split("\n").map(function (line) {
        var html;
        if (/^\s*#/.test(line)) html = '<span class="st-c">' + esc(line) + "</span>";
        else if (/^\s*\[/.test(line)) html = '<span class="st-h">' + esc(line) + "</span>";
        else {
          var m = line.match(/^(\s*)([A-Za-z0-9_-]+)(\s*=\s*)(.*)$/);
          html = m ? esc(m[1]) + '<span class="st-k">' + esc(m[2]) + "</span>" + esc(m[3]) + value(m[4]) : value(line);
        }
        return '<span class="st-ln">' + (html || " ") + "</span>";
      }).join("\n");
    }
    // strings first, so a number or a word inside a string keeps the string's colour
    function value(text) {
      var out = "";
      var last = 0;
      var re = /("(?:[^"\\]|\\.)*")|\b(true|false)\b|(-?\d+(?:\.\d+)?)(?![\w#])/g;
      var m;
      while ((m = re.exec(text))) {
        out += esc(text.slice(last, m.index));
        var cls = m[1] ? "st-s" : m[2] ? "st-b" : "st-n";
        out += '<span class="' + cls + '">' + esc(m[0]) + "</span>";
        last = re.lastIndex;
      }
      return out + esc(text.slice(last));
    }

    function needsLine(p) {
      var n = p.needs || {};
      var parts = [];
      if (n.contrast && n.contrast.text) parts.push("text contrast " + n.contrast.text + ":1 or more");
      if (n.font) parts.push((n.font.family || "the system font") + (n.font.size_pt ? " at " + n.font.size_pt + " point" : ""));
      if (n.line_spacing) parts.push("line spacing " + n.line_spacing);
      if (n.cursor_size) parts.push("a " + n.cursor_size + " cursor");
      if (n.reduce_motion) parts.push("reduced motion");
      if (!parts.length) return "";
      var last = parts.pop();
      return "Needs: " + (parts.length ? parts.join(", ") + " and " + last : last) + ".";
    }

    function renderProfile(id, announce) {
      var el = itemEl("profile", id);
      var label = el ? el.getAttribute("data-label") : id;
      var theme = el ? el.getAttribute("data-theme") : state.theme;
      clearProfileProps();
      barTitle.textContent = id + ".toml";
      title.textContent = label;
      desc.textContent = "";
      note.textContent = "";
      setScreenTheme(theme);
      playButton.hidden = true;
      if (announce) say(label + " starter profile");
      var mine = ++token;
      var toml = $(".st-toml code");
      var term = $(".st-term code");
      var ansi = $(".st-ansi");
      if (!(available.profile || []).length || (available.profile || []).indexOf(id) < 0) {
        toml.textContent = "";
        term.textContent = "";
        ansi.textContent = "";
        note.textContent = "This starter profile's file is not in the studio yet. The colours shown are the matching theme's.";
        return;
      }
      loading.hidden = false;
      getJSON(asset("profile", "", id)).then(function (p) {
        if (mine !== token) return;
        loading.hidden = true;
        applyProfile(p);
        desc.textContent = p.description || "";
        note.textContent = needsLine(p);
        toml.innerHTML = tomlHtml(p.toml || "");
        var check = p.check;
        term.innerHTML = '<span class="st-prompt">$</span> ' + esc(check ? check.command : "zprf check " + (p.file || id + ".toml")) + "\n" +
          (check ? esc(check.output) : "") + '\n<span class="st-prompt">$</span> <span class="st-cursor" aria-hidden="true"></span>';
        ansi.textContent = "";
        var colours = (p.palette && p.palette.terminal && p.palette.terminal.ansi) || [];
        colours.forEach(function (c, i) {
          var li = document.createElement("li");
          var chip = document.createElement("span");
          chip.className = "st-chip";
          chip.style.setProperty("background-color", c);
          li.appendChild(chip);
          li.appendChild(document.createTextNode(String(i)));
          li.title = "Colour " + i + ": " + c;
          ansi.appendChild(li);
        });
      }).catch(function () {
        if (mine !== token) return;
        loading.hidden = true;
        note.textContent = "The profile could not load. Try another or reload the page.";
      });
    }

    function setScreenTheme(theme) {
      screen.className = screen.className.replace(/\bst-t-[a-z-]+/g, "").trim() + " st-t-" + theme;
      barTheme.textContent = themeName(theme);
      if (state.mode !== "profile") clearProfileProps();
    }

    function say(text) { if (status) status.textContent = text; }

    // the stored choice merges with what is there, so a page that shows one mode keeps the others
    function remember() {
      try {
        var prev = JSON.parse(localStorage.getItem(STORE) || "null") || {};
        var items = prev.items || {};
        modes.forEach(function (m) { if (state.items[m]) items[m] = state.items[m]; });
        // a page fixed to one mode leaves the full studio's last mode as it was
        var next = { mode: fixed ? prev.mode : state.mode, theme: state.theme, items: items };
        localStorage.setItem(STORE, JSON.stringify(next));
      } catch (e) { /* storage can be blocked; the studio works without it */ }
    }

    // ---- one place that draws whatever the state says
    function render(announce) {
      var mode = state.mode;
      var item = state.items[mode];
      Object.keys(views).forEach(function (k) {
        views[k].hidden = k !== (mode === "scenes" || mode === "games" ? "frames" : mode);
      });
      root.setAttribute("data-mode", mode);
      controls("item").forEach(function (el) {
        var field = el.closest(".st-item-field");
        if (!field) return;
        field.hidden = el.getAttribute("data-mode") !== mode;
        var count = field.querySelector(".st-count");
        if (count) count.textContent = "(" + (el.selectedIndex + 1) + " of " + el.options.length + ")";
      });
      if (swatch) swatch.className = swatch.className.replace(/\bst-t-[a-z-]+/g, "").trim() + " st-t-" + state.theme;
      loading.hidden = true;
      if (mode === "scenes" || mode === "games") renderFrames(mode, state.theme, item, announce);
      else if (mode === "code") renderCode(state.theme, item, announce);
      else renderProfile(item, announce);
      if (root.hasAttribute("data-hash") && history.replaceState) {
        history.replaceState(null, "", "#" + mode + "/" + state.theme + "/" + item);
      }
      remember();
      // a page can follow the studio, as the themes page does with its contrast figures and grid
      var detail = { mode: mode, theme: state.theme, item: item };
      var event;
      try { event = new CustomEvent("studio:change", { bubbles: true, detail: detail }); } catch (e) { event = null; }
      if (event) root.dispatchEvent(event);
    }

    // ---- start: the address, otherwise whatever each control says
    // a product page fixes the studio to its own mode and carries only that mode's list
    var fixed = root.getAttribute("data-fixed-mode");
    var modes = ["scenes", "games", "code", "profile"].filter(function (m) { return controls("item", m).length; });
    modes.forEach(function (m) { state.items[m] = valueOf("item", m); });
    state.mode = fixed || valueOf("mode") || modes[0];
    state.theme = valueOf("theme") || state.theme;
    // the last choice is a per-viewer convenience: storage can be blocked or empty, in which case
    // the studio simply opens on its defaults. An address that names a view always wins over it
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { saved = null; }
    if (!saved) {
      // the themes playground kept its choice as theme then language: warm-dark-rust
      try {
        var old = localStorage.getItem("zacess-code-theme") || "";
        var at = old.lastIndexOf("-");
        if (at > 0) saved = { theme: old.slice(0, at), items: { code: old.slice(at + 1) } };
      } catch (e) { saved = null; }
    }
    if (saved && typeof saved === "object") {
      if (saved.theme && themeName(saved.theme) !== saved.theme) state.theme = saved.theme;
      var items = saved.items || {};
      modes.forEach(function (m) { if (items[m] && itemEl(m, items[m])) state.items[m] = items[m]; });
      if (!fixed && saved.mode && modes.indexOf(saved.mode) >= 0) state.mode = saved.mode;
    }
    if (root.hasAttribute("data-hash")) {
      var hash = location.hash.slice(1);
      var parts = hash.split("/");
      if (parts.length === 3 && modes.indexOf(parts[0]) >= 0 && (!fixed || parts[0] === fixed) && itemEl(parts[0], parts[2]) && themeName(parts[1]) !== parts[1]) {
        state.mode = parts[0];
        state.theme = parts[1];
        state.items[parts[0]] = parts[2];
      } else if (fixed === "code" && hash.lastIndexOf("-") > 0) {
        // the themes playground's old links name the theme then the language: #warm-dark-rust
        var cut = hash.lastIndexOf("-");
        var oldTheme = hash.slice(0, cut);
        var oldLang = hash.slice(cut + 1);
        if (themeName(oldTheme) !== oldTheme && itemEl("code", oldLang)) { state.theme = oldTheme; state.items.code = oldLang; }
      }
    }
    // a profile and a theme are the same choice, so each follows the other
    function syncProfile() {
      if (itemEl("profile", "zacess-" + state.theme)) state.items.profile = "zacess-" + state.theme;
    }
    if (state.mode === "profile") {
      var t = itemEl("profile", state.items.profile);
      if (t) state.theme = t.getAttribute("data-theme");
    } else syncProfile();
    setValue("mode", null, state.mode);
    setValue("theme", null, state.theme);
    modes.forEach(function (m) { setValue("item", m, state.items[m]); });

    root.addEventListener("change", function (e) {
      var el = e.target;
      var kind = el.getAttribute && el.getAttribute("data-st");
      if (!kind) return;
      if (kind === "mode") state.mode = el.value;
      else if (kind === "theme") { state.theme = el.value; syncProfile(); setValue("item", "profile", state.items.profile); }
      else if (kind === "item") pickItem(el.getAttribute("data-mode"), el.value);
      render(true);
    });
    function pickItem(mode, id) {
      state.items[mode] = id;
      setValue("item", mode, id);
      if (mode === "profile") {
        var opt = itemEl("profile", id);
        if (opt) { state.theme = opt.getAttribute("data-theme"); setValue("theme", null, state.theme); }
      }
    }
    // Previous and Next walk the whole list across the scene groups and wrap at either end
    root.addEventListener("click", function (e) {
      var button = e.target.closest && e.target.closest("[data-step]");
      if (!button || !root.contains(button)) return;
      var mode = button.getAttribute("data-mode");
      var select = controls("item", mode)[0];
      if (!select || !select.options.length) return;
      var n = select.options.length;
      var at = (select.selectedIndex + Number(button.getAttribute("data-step")) + n) % n;
      pickItem(mode, select.options[at].value);
      render(true);
    });

    playButton.addEventListener("click", function () {
      playing = !playing;
      showPlay();
      say(playing ? "Playing" : "Paused");
      if (!recording) near = true;
      if (!recording) { render(false); return; }
      schedule();
    });

    // ---- the laptop: tilted with a gentle parallax or drawn flat. Reduced motion always draws it flat
    function setTilt(on) {
      root.classList.toggle("st-flat", !on);
      tiltButton.setAttribute("aria-pressed", String(on));
      if (!on) { stage.style.removeProperty("--st-rx"); stage.style.removeProperty("--st-ry"); }
    }
    tiltButton.hidden = reduce.matches;
    setTilt(false);
    tiltButton.addEventListener("click", function () {
      setTilt(tiltButton.getAttribute("aria-pressed") !== "true");
    });
    stage.addEventListener("pointermove", function (e) {
      if (reduce.matches || root.classList.contains("st-flat") || e.pointerType !== "mouse") return;
      var box = stage.getBoundingClientRect();
      var x = (e.clientX - box.left) / box.width - 0.5;
      var y = (e.clientY - box.top) / box.height - 0.5;
      stage.style.setProperty("--st-ry", (-12 + x * 8).toFixed(2) + "deg");
      stage.style.setProperty("--st-rx", (8 - y * 6).toFixed(2) + "deg");
    });
    stage.addEventListener("pointerleave", function () {
      stage.style.removeProperty("--st-rx");
      stage.style.removeProperty("--st-ry");
    });
    if (reduce.addEventListener) {
      reduce.addEventListener("change", function (e) {
        tiltButton.hidden = e.matches;
        if (e.matches) { setTilt(false); playing = false; showPlay(); clearTimeout(timer); }
        else setTilt(tiltButton.getAttribute("aria-pressed") === "true");
      });
    }

    // ---- pause off screen and in a hidden tab; the first recording waits until the studio is near
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        schedule();
      }).observe(screen);
      var watcher = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        watcher.disconnect();
        near = true;
        if (!recording && (state.mode === "scenes" || state.mode === "games")) render(false);
      }, { rootMargin: "300px 0px" });
      watcher.observe(root);
    }
    document.addEventListener("visibilitychange", function () {
      tabVisible = !document.hidden;
      schedule();
    });

    // a "Play the recording" button elsewhere on the page shows that item here and plays it
    Array.prototype.forEach.call(document.querySelectorAll("[data-demo-play]"), function (wrap) {
      var wanted = wrap.getAttribute("data-demo-play");
      var mode = null;
      ["scenes", "games"].forEach(function (m) { if (!mode && modes.indexOf(m) >= 0 && itemEl(m, wanted)) mode = m; });
      if (!mode || wrap.hasAttribute("data-studio-bound")) return;
      wrap.setAttribute("data-studio-bound", "");
      wrap.hidden = false;
      var button = wrap.querySelector("button") || wrap;
      button.addEventListener("click", function () {
        if (!fixed) { state.mode = mode; setValue("mode", null, mode); }
        state.items[mode] = wanted;
        setValue("item", mode, wanted);
        playing = true;
        near = true;
        showPlay();
        render(true);
        if (root.scrollIntoView) root.scrollIntoView({ block: "start" });
        playButton.focus({ preventScroll: true });
      });
    });

    render(false);
  }
})();
