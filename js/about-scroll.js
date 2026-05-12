/* Per-character scroll reveal for the About section heading.

   The heading text is split into one <span class="about-char"> per glyph,
   then progressively gains the .is-lit class (a CSS-driven color/opacity
   transition) in proportion to how far #about has been scrolled through
   its pin range.

    - The original heading stays in the DOM but visually-hidden, so screen
     readers get the sentence in one piece; the animated copy in
     #about-reveal is purely decorative.
    - Honors prefers-reduced-motion by skipping the split entirely and
     showing the static heading instead.
    - Scroll work is rAF-throttled, and bails out while navbar.js is driving
     a programmatic smooth-scroll, since iterating hundreds of chars per
     frame would jank that animation. 
*/

(function () {
    "use strict";

    var about = document.getElementById("about");
    var heading = document.getElementById("about-heading");
    var reveal = document.getElementById("about-reveal");
    if (!about || !heading || !reveal) {
        return;
    }

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Reduced-motion fallback: drop the animated copy entirely and put the
    // static heading back on stage. The id has to migrate from the inner
    // <span> to the parent <h2> so in-page anchors / aria-labelledby
    // references to #about-heading still land on something visible.
    if (reduceMotion.matches) {
        about.classList.add("about--reduced");
        var h2r = heading.parentElement;
        if (reveal.parentNode) reveal.parentNode.removeChild(reveal);
        heading.classList.remove("visually-hidden");
        heading.removeAttribute("id");
        h2r.id = "about-heading";
        return;
    }

    // Rebuild the heading inside #about-reveal as one span per glyph.
    // Direct-child <br>s are preserved (line breaks matter for the layout);
    // text nodes are split into chars; anything else is intentionally
    // skipped — the source heading should only contain text and <br>.
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

    // Doubles as a "frame already queued" flag and as the rAF cancel token.
    var raf = 0;

    function tick() {

        raf = 0;

        // Pause per-character work while a programmatic smooth-scroll is in
        // progress (e.g. clicking a navbar link). Iterating hundreds of
        // chars + triggering color transitions every frame stutters that
        // animation; navbar.js fires a final 'scroll' event when it ends,
        // which will bring the reveal back in sync.
        if (document.documentElement.classList.contains("is-auto-scrolling")) {
            return;
        }

        var rect = about.getBoundingClientRect();
        var y0 = window.scrollY + rect.top;   // absolute Y of #about's top
        var h = about.offsetHeight;
        var vh = window.innerHeight;
        var denom = h - vh;                   // total scroll distance while pinned

        // Section is shorter than the viewport (e.g. on very tall screens):
        // there's no scroll range to map progress against, so just light
        // every char and stop — no animation possible.
        if (denom <= 0) {
            for (var j = 0; j < chars.length; j += 1) {
                chars[j].classList.add("is-lit");
            }
            return;
        }

        // Reserve the final viewport-height of pin time for the next section
        // (`.services-cover`) to slide up over the still-pinned about content,
        // so the text reveal finishes BEFORE that curtain rise begins.
        var revealEnd = denom - vh;
        if (revealEnd <= 0) revealEnd = denom;

        // Map scroll position into 0..1 progress across the reveal range,
        // clamped at the ends so reverse-scrolling past the section works.
        var p = (window.scrollY - y0) / revealEnd;

        if (p < 0) p = 0;
        else if (p > 1) p = 1;

        var lit = p * chars.length;

        // Add/remove every frame is cheap: classList is a no-op when the
        // class state is already what we asked for, so this avoids the
        // bookkeeping of tracking "previous lit count" ourselves.
        for (var k = 0; k < chars.length; k += 1) {
            if (k < lit) {
                chars[k].classList.add("is-lit");
            } else {
                chars[k].classList.remove("is-lit");
            }
        }
    }

    // Coalesce bursts of scroll events into a single rAF callback so the
    // math runs at most once per frame, regardless of how often the browser
    // fires 'scroll' on this device.
    function onScroll() {
        if (raf) return;
        raf = window.requestAnimationFrame(tick);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    tick();

})();