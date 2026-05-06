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
        var h2r = heading.parentElement;
        if (reveal.parentNode) reveal.parentNode.removeChild(reveal);
        heading.classList.remove("visually-hidden");
        heading.removeAttribute("id");
        h2r.id = "about-heading";
        return;
    }

    reveal.textContent = "";
    var nodes = heading.childNodes;

    for (var n = 0; n < nodes.length; n += 1) {

        var node = nodes[n];

        if (node.nodeType === 1 && node.tagName === "BR") {
            reveal.appendChild(document.createElement("br"));
            continue;
        }

        if (node.nodeType === 3) {

            var t = node.nodeValue;

            for (var i = 0; i < t.length; i += 1) {
                var span = document.createElement("span");
                span.className = "about-char";
                span.textContent = t[i];
                reveal.appendChild(span);
            }

        }

    }

    var chars = reveal.querySelectorAll(".about-char");

    if (!chars.length)
        return;

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