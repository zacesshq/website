// the scenes page demo: plays the frames a Zacess Scenes release exports (docs/frames) on a canvas. Without
// this script the page shows the still of the first scene and every still in the gallery.
//
// motion rules: it starts paused under prefers-reduced-motion and always has a visible pause button,
// since a loop runs longer than five seconds. It also pauses while off screen or in a hidden tab.
(function () {
  var root = document.getElementById("demo");
  if (!root || !root.getContext) return;
  var ctx = root.getContext("2d");
  var still = document.getElementById("demo-still");
  var select = document.getElementById("demo-scene");
  var toggle = document.getElementById("demo-toggle");
  var title = document.getElementById("demo-title");
  var status = document.getElementById("demo-status");
  var controls = document.getElementById("demo-controls");
  if (!ctx || !select || !toggle) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var FONT = "15px ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace";
  var ROW = 19;
  var cellWidth = 9;
  var data = null;
  var index = 0;
  var playing = false;
  var visible = true;
  var timer = null;
  var cache = {};

  // block glyphs drawn as rectangles, as a terminal shows them: [left, top, right, bottom] in cells, plus an opacity
  var FULL = [[0, 0, 1, 1]];
  var TL = [0, 0, 0.5, 0.5], TR = [0.5, 0, 1, 0.5], BL = [0, 0.5, 0.5, 1], BR = [0.5, 0.5, 1, 1];
  var BLOCKS = {
    "█": [FULL, 1], "▀": [[[0, 0, 1, 0.5]], 1], "▄": [[[0, 0.5, 1, 1]], 1],
    "▌": [[[0, 0, 0.5, 1]], 1], "▐": [[[0.5, 0, 1, 1]], 1],
    "▁": [[[0, 0.875, 1, 1]], 1], "▂": [[[0, 0.75, 1, 1]], 1], "▃": [[[0, 0.625, 1, 1]], 1],
    "▅": [[[0, 0.375, 1, 1]], 1], "▆": [[[0, 0.25, 1, 1]], 1], "▇": [[[0, 0.125, 1, 1]], 1],
    "▉": [[[0, 0, 0.875, 1]], 1], "▊": [[[0, 0, 0.75, 1]], 1], "▋": [[[0, 0, 0.625, 1]], 1],
    "▍": [[[0, 0, 0.375, 1]], 1], "▎": [[[0, 0, 0.25, 1]], 1], "▏": [[[0, 0, 0.125, 1]], 1],
    "▔": [[[0, 0, 1, 0.125]], 1], "▕": [[[0.875, 0, 1, 1]], 1],
    "░": [FULL, 0.25], "▒": [FULL, 0.5], "▓": [FULL, 0.75],
    "▖": [[BL], 1], "▗": [[BR], 1], "▘": [[TL], 1], "▝": [[TR], 1],
    "▙": [[TL, BL, BR], 1], "▚": [[TL, BR], 1], "▛": [[TL, TR, BL], 1],
    "▜": [[TL, TR, BR], 1], "▞": [[TR, BL], 1], "▟": [[TR, BL, BR], 1]
  };

  function size() {
    ctx.font = FONT;
    cellWidth = Math.ceil(ctx.measureText("M").width * 10) / 10;
    var ratio = window.devicePixelRatio || 1;
    root.width = Math.round(data.width * cellWidth * ratio);
    root.height = Math.round(data.height * ROW * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    var frame = data.frames[index];
    ctx.fillStyle = data.background;
    ctx.fillRect(0, 0, data.width * cellWidth, data.height * ROW);
    ctx.font = FONT;
    ctx.textBaseline = "middle";
    for (var i = 0; i < frame.length; i++) {
      var run = frame[i];
      ctx.fillStyle = run.colour;
      var chars = Array.from(run.text);
      for (var c = 0; c < chars.length; c++) {
        var ch = chars[c];
        if (ch === " ") continue;
        var x = (run.x + c) * cellWidth;
        var y = run.y * ROW;
        var block = BLOCKS[ch];
        if (block) {
          ctx.globalAlpha = block[1];
          for (var p = 0; p < block[0].length; p++) {
            var part = block[0][p];
            ctx.fillRect(x + part[0] * cellWidth, y + part[1] * ROW, (part[2] - part[0]) * cellWidth + 0.5, (part[3] - part[1]) * ROW + 0.5);
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.fillText(ch, x, y + ROW / 2);
        }
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!playing || !visible || !data) return;
    timer = setTimeout(function () {
      index = (index + 1) % data.frames.length;
      draw();
      schedule();
    }, 1000 / data.fps);
  }

  function setPlaying(on, announce) {
    playing = on;
    toggle.textContent = on ? "Pause" : "Play";
    if (announce && status) status.textContent = on ? "Playing" : "Paused";
    schedule();
  }

  function label(id) {
    var option = select.querySelector('option[value="' + id + '"]');
    return option ? option.getAttribute("data-label") : id;
  }

  function load(id, announce) {
    var done = function (json) {
      data = json;
      index = 0;
      size();
      draw();
      root.setAttribute("aria-label", label(id));
      if (title) title.textContent = select.options[select.selectedIndex].textContent;
      if (still) still.hidden = true;
      root.hidden = false;
      if (announce && status) status.textContent = select.options[select.selectedIndex].textContent + " loaded";
      schedule();
    };
    if (cache[id]) return done(cache[id]);
    fetch("/scenes/frames/" + id + ".json").then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (json) {
      cache[id] = json;
      done(json);
    }).catch(function () {
      if (status) status.textContent = "The animation could not load; the still is shown instead";
    });
  }

  select.addEventListener("change", function () { load(select.value, true); });
  toggle.addEventListener("click", function () { setPlaying(!playing, true); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      schedule();
    }).observe(root);
  }
  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    schedule();
  });
  if (reduce && reduce.addEventListener) {
    reduce.addEventListener("change", function (e) { if (e.matches) setPlaying(false, true); });
  }

  if (controls) controls.hidden = false;
  setPlaying(!(reduce && reduce.matches), false);
  load(select.value, false);
})();
