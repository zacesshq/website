// the drawing core for the frames a Zacess Scenes or Zacess Games build exports: the studio
// (studio.js) loads this first and draws every recording with it. ZacessFrames.size fits a canvas to
// a recording and ZacessFrames.draw paints one frame, with block glyphs drawn as rectangles the way a
// terminal shows them, so pixel art in full and half blocks has no seams. The motion rules (paused
// under reduced motion, a visible Pause button, pausing off screen) live in studio.js
(function () {
  var FONT = "15px ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace";
  var ROW = 19;

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

  // returns the cell width, which draw needs
  function size(canvas, ctx, data) {
    ctx.font = FONT;
    var cellWidth = Math.ceil(ctx.measureText("M").width * 10) / 10;
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(data.width * cellWidth * ratio);
    canvas.height = Math.round(data.height * ROW * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return cellWidth;
  }

  function draw(ctx, data, index, cellWidth) {
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

  window.ZacessFrames = { size: size, draw: draw, ROW: ROW };
})();

