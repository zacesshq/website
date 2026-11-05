// the Copy button beside every code block in the documentation and on the product pages that use
// src/components/CopyCode.astro. The button is in the page already;
// this script makes it work, so the style sheet shows it only once the html element has the js
// class. A copy is confirmed on the button for two seconds and read out through a live region
(function () {
  var blocks = document.querySelectorAll(".docs-code");
  if (!blocks.length) return;

  // one live region for the page, in place before anything is written to it
  var status = document.createElement("p");
  status.className = "vh";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  document.body.appendChild(status);

  // the site is served over https only, so the Clipboard API is there in every current browser; a
  // browser without it is told the copy did not happen rather than left guessing
  function write(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return Promise.reject(new Error("no clipboard"));
  }

  Array.prototype.forEach.call(blocks, function (block) {
    var button = block.querySelector(".code-copy");
    var pre = block.querySelector("pre");
    if (!button || !pre) return;
    var label = button.querySelector(".code-copy-label");
    var timer;

    function show(text, said) {
      if (label) label.textContent = text;
      button.setAttribute("aria-label", said);
      status.textContent = said;
    }

    button.addEventListener("click", function () {
      var code = pre.querySelector("code") || pre;
      // the text as it is read, without a trailing newline so a pasted command runs as typed
      var text = code.textContent.replace(/\n$/, "");
      write(text).then(function () {
        show("Copied", "Copied this code");
        button.setAttribute("data-copied", "true");
      }, function () {
        show("Not copied", "Not copied. Select the code and copy it by hand.");
      }).then(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          show("Copy", "Copy this code");
          button.removeAttribute("data-copied");
          status.textContent = "";
        }, 2000);
      });
    });
  });
})();
