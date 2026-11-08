// sound for the Zacess studio: the background loop under the scene or game on screen, each game's
// music and buttons that play single tones and effects. It loads after /studio.js and follows its
// studio:change events. Nothing plays until someone presses a button. The loops start with "Play
// sound" and stop with "Pause sound". The volume slider sets the level and is remembered. The loops
// stop while the tab is hidden. Every file comes from the manifest's sounds section, made by
// scripts/studio-sounds.mjs from the programs themselves. Each kind keeps the programs' own
// balance (tones 50, background 20, music 20, effects 35 out of 100 at the slider's middle).
(function () {
  var roots = document.querySelectorAll("[data-studio]");
  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!roots.length || !AudioContextClass) return;
  var STORE = "zacess-studio-volume";
  var ctx = null;
  var buffers = {};

  function audio() {
    if (!ctx) ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function load(url) {
    if (!buffers[url]) {
      buffers[url] = fetch(url)
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
        .then(function (data) {
          // the older callback form, so Safari versions without the promise form still decode
          return new Promise(function (resolve, reject) { audio().decodeAudioData(data, resolve, reject); });
        });
      buffers[url].catch(function () { delete buffers[url]; });
    }
    return buffers[url];
  }

  Array.prototype.forEach.call(roots, setup);

  function setup(root) {
    var panel = root.querySelector("[data-st-sound]");
    var config;
    try { config = JSON.parse(root.getAttribute("data-config")); } catch (e) { return; }
    var sounds = config && config.sounds;
    if (!panel || !sounds || !config.layout.sound) return;
    var base = String(config.base || "").replace(/\/$/, "");
    var toggle = panel.querySelector(".st-sound-toggle");
    var range = panel.querySelector(".st-volume-range");
    var now = panel.querySelector(".st-sound-now");
    var setSelect = panel.querySelector(".st-set");
    var groups = panel.querySelectorAll(".st-sound-group");
    var levels = sounds.levels || { tone: 50, ambient: 20, music: 20, effect: 35 };
    var summaries = {};
    (sounds.ambient || []).forEach(function (a) { summaries[a.id] = a.summary; });

    var on = false;
    var loops = [];
    var master = null;
    var state = { mode: root.getAttribute("data-mode") || "scenes", item: "" };

    function url(path) { return base + "/" + config.layout.sound.replace("{path}", path); }
    function volume() { return Number(range.value) / 100; }
    // the slider's middle is the programs' defaults; the top doubles them, never past full scale
    function gainFor(kind) { return Math.min(1, volume() * 2 * (levels[kind] / 100)); }

    try {
      var saved = localStorage.getItem(STORE);
      if (saved !== null && !isNaN(Number(saved))) range.value = String(Math.max(0, Math.min(100, Number(saved))));
    } catch (e) { /* storage blocked: the default volume stands */ }
    range.setAttribute("aria-valuetext", range.value + " percent");

    function currentItem() {
      var select = root.querySelector('select[data-st="item"][data-mode="' + state.mode + '"]');
      return select ? select.value : "";
    }

    // what plays under the item on screen: one loop for a scene, the music and a loop for a game
    function plan() {
      if (state.mode === "scenes") {
        var amb = (sounds.scenes && sounds.scenes[state.item]) || "night";
        return { text: "Background: " + amb + ", " + (summaries[amb] || "").toLowerCase(), parts: [{ path: "ambient/" + amb, kind: "ambient" }] };
      }
      if (state.mode === "games") {
        var bg = (sounds.games && sounds.games[state.item]) || "night";
        return {
          text: "Music and background: " + bg + ", " + (summaries[bg] || "").toLowerCase(),
          parts: [{ path: "music/" + state.item, kind: "music" }, { path: "ambient/" + bg, kind: "ambient" }],
        };
      }
      return null;
    }

    function stopLoops() {
      loops.forEach(function (l) { try { l.source.stop(); } catch (e) { /* already stopped */ } });
      loops = [];
    }

    function startLoops() {
      stopLoops();
      var p = plan();
      if (!on || !p) return;
      var token = {};
      startLoops.token = token;
      p.parts.forEach(function (part) {
        load(url(part.path)).then(function (buffer) {
          // a later choice or a pause replaced this one while the file loaded
          if (startLoops.token !== token || !on) return;
          var c = audio();
          var source = c.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          var gain = c.createGain();
          gain.gain.value = gainFor(part.kind);
          source.connect(gain).connect(c.destination);
          source.start();
          loops.push({ source: source, gain: gain, kind: part.kind });
        }).catch(function () {
          now.textContent = "That sound did not load. Try again in a moment.";
        });
      });
    }

    function describe() {
      var p = plan();
      groups.forEach(function (g) { g.hidden = g.getAttribute("data-for") !== state.mode; });
      panel.hidden = !p;
      if (!p) return;
      now.textContent = on ? "Playing. " + p.text + "." : p.text + ". Press Play sound to hear it.";
    }

    function setOn(value) {
      on = value;
      toggle.setAttribute("aria-pressed", String(on));
      toggle.textContent = on ? "Pause sound" : "Play sound";
      if (on) startLoops(); else stopLoops();
      describe();
    }

    toggle.addEventListener("click", function () { setOn(!on); });

    range.addEventListener("input", function () {
      range.setAttribute("aria-valuetext", range.value + " percent");
      loops.forEach(function (l) { l.gain.gain.value = gainFor(l.kind); });
      try { localStorage.setItem(STORE, range.value); } catch (e) { /* storage blocked */ }
    });

    // a single tone or effect plays when its button is pressed, whether or not the loops are on
    panel.addEventListener("click", function (e) {
      var button = e.target.closest ? e.target.closest(".st-tone") : null;
      if (!button) return;
      var path = button.hasAttribute("data-tone")
        ? "tones/" + setSelect.value + "/" + button.getAttribute("data-tone")
        : "effects/" + button.getAttribute("data-effect");
      var kind = button.hasAttribute("data-tone") ? "tone" : "effect";
      load(url(path)).then(function (buffer) {
        var c = audio();
        var source = c.createBufferSource();
        source.buffer = buffer;
        var gain = c.createGain();
        gain.gain.value = gainFor(kind);
        source.connect(gain).connect(c.destination);
        source.start();
      }).catch(function () { now.textContent = "That sound did not load. Try again in a moment."; });
    });

    root.addEventListener("studio:change", function (e) {
      var d = e.detail || {};
      var changed = d.mode !== state.mode || d.item !== state.item;
      state.mode = d.mode;
      state.item = d.item;
      if (changed && on) startLoops();
      describe();
    });

    // a hidden tab stops the loops; coming back carries on only if sound was on
    document.addEventListener("visibilitychange", function () {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
    });

    state.item = currentItem();
    describe();
  }
})();
