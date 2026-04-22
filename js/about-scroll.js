(function () {
  "use strict";

  var about = document.getElementById("about");
  var heading = document.getElementById("about-heading");
  var reveal = document.getElementById("about-reveal");
  if (!about || !heading || !reveal) {
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reduceMotion.matches) {
    about.classList.add("about--reduced");
    var plain = heading.textContent;
    var h2 = heading.parentElement;
    h2.textContent = plain;
    h2.id = "about-heading";
    return;
  }

  var text = heading.textContent;
  reveal.textContent = "";
  for (var i = 0; i < text.length; i += 1) {
    var span = document.createElement("span");
    span.className = "about-char";
    span.textContent = text[i];
    reveal.appendChild(span);
  }
  /* #about-heading (sr-only) is announced; #about-reveal is aria-hidden. */

  var chars = reveal.querySelectorAll(".about-char");
  if (!chars.length) {
    return;
  }

  var raf = 0;
  function tick() {
    raf = 0;
    var rect = about.getBoundingClientRect();
    var y0 = window.scrollY + rect.top;
    var h = about.offsetHeight;
    var vh = window.innerHeight;
    var denom = h - vh;
    if (denom <= 0) {
      for (var j = 0; j < chars.length; j += 1) {
        chars[j].classList.add("is-lit");
      }
      return;
    }
    var p = (window.scrollY - y0) / denom;
    if (p < 0) p = 0;
    else if (p > 1) p = 1;
    var lit = p * chars.length;
    for (var k = 0; k < chars.length; k += 1) {
      if (k < lit) {
        chars[k].classList.add("is-lit");
      } else {
        chars[k].classList.remove("is-lit");
      }
    }
  }

  function onScroll() {
    if (raf) return;
    raf = window.requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  tick();
})();
