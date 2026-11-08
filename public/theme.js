// colour mode: System follows prefers-color-scheme live through CSS alone; Light and Dark set
// data-theme on <html> and are remembered. Storage is a per-visitor convenience, so a blocked or
// empty store simply falls back to System.
(function () {
  var KEY = "zacess-theme";
  var NAMES = { system: "System", light: "Light", dark: "Dark" };
  var root = document.documentElement;
  var button = document.getElementById("theme-button");
  var menu = document.getElementById("theme-menu");
  if (!button || !menu) return;
  var items = Array.prototype.slice.call(menu.querySelectorAll("[data-theme-choice]"));
  var name = button.querySelector(".theme-name");

  function stored() {
    try {
      var t = localStorage.getItem(KEY);
      return t === "light" || t === "dark" ? t : "system";
    } catch (e) {
      return "system";
    }
  }

  function show(choice) {
    button.setAttribute("data-mode", choice);
    name.textContent = NAMES[choice];
    items.forEach(function (item) {
      item.setAttribute("aria-checked", String(item.getAttribute("data-theme-choice") === choice));
    });
  }

  function choose(choice) {
    if (choice === "light" || choice === "dark") {
      root.setAttribute("data-theme", choice);
      try { localStorage.setItem(KEY, choice); } catch (e) {}
    } else {
      choice = "system";
      root.removeAttribute("data-theme");
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
    show(choice);
  }

  function open(index) {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    if (index === undefined) index = items.indexOf(menu.querySelector('[aria-checked="true"]'));
    items[Math.max(index, 0)].focus();
  }

  function close(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (returnFocus) button.focus();
  }

  // Enter and Space open the menu through the native click; the arrow keys open it too
  button.addEventListener("click", function () {
    if (menu.hidden) open(); else close(true);
  });
  button.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open(event.key === "ArrowUp" ? items.length - 1 : undefined);
    }
  });

  menu.addEventListener("keydown", function (event) {
    var i = items.indexOf(document.activeElement);
    var n = items.length;
    var next = { ArrowDown: (i + 1) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      items[next].focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    }
  });

  items.forEach(function (item) {
    item.addEventListener("click", function () {
      choose(item.getAttribute("data-theme-choice"));
      close(true);
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".theme-control")) close(false);
  });

  // another tab changing the mode keeps this one in step
  window.addEventListener("storage", function (event) {
    if (event.key === KEY) choose(stored());
  });

  show(stored());
})();

// narrow-screen menu: a details element whose summary is the Menu button, so it opens and closes
// with no script. The script adds the aria state, Escape with the focus back on the button and
// closing when the focus or a click leaves the list
(function () {
  var menu = document.querySelector(".site-menu");
  var summary = menu && menu.querySelector("summary");
  if (!menu || !summary) return;

  function sync() { summary.setAttribute("aria-expanded", String(menu.open)); }
  function close(returnFocus) {
    if (!menu.open) return;
    menu.open = false;
    if (returnFocus) summary.focus();
  }
  menu.addEventListener("toggle", sync);
  sync();
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.open && !event.defaultPrevented) { event.preventDefault(); close(true); }
  });
  // tabbing or clicking away from the menu closes it
  menu.addEventListener("focusout", function (event) {
    var next = event.relatedTarget;
    if (menu.open && next && !menu.contains(next)) close(false);
  });
  document.addEventListener("click", function (event) {
    if (menu.open && !event.target.closest(".site-menu")) close(false);
  });
  // the wide layout shows the list without the button, so nothing is left open behind it
  var wide = window.matchMedia("(min-width: 76rem)");
  if (wide.addEventListener) wide.addEventListener("change", function (m) { if (m.matches) close(false); });
})();
