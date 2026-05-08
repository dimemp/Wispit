/* Standalone navbar collapse — mirrors Bootstrap 5's Collapse behaviour
   for `data-bs-toggle="collapse"` / `data-bs-target="#..."` pairs, so we
   don't have to ship the full Bootstrap JS bundle just for the navbar.

   What it does:
   - Toggles between .collapse, .collapsing, .show on the target, matching
     Bootstrap's class lifecycle (so Bootstrap's CSS handles the styling).
   - Animates height from 0 → scrollHeight on show, and scrollHeight → 0
     on hide, ending the transition by clearing the inline height.
   - Keeps aria-expanded in sync on every toggler that points at the target.
   - Respects prefers-reduced-motion (no transition).
   - Auto-closes the panel on mobile when a .nav-link or .btn inside is
     clicked, since the navbar links are in-page anchors. */

(function () {
    "use strict";

    // Must match the CSS height transition on .collapsing — if you change one,
    // change the other, otherwise the JS will strip .collapsing too early
    // (clipping the animation) or too late (leaving inline height stuck).
    var TRANSITION_MS = 350;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function isShown(el) {
        return el.classList.contains("show");
    }

    function isTransitioning(el) {
        return el.classList.contains("collapsing");
    }

    // A single collapse target can have several togglers (e.g. the hamburger
    // button plus an off-canvas entry point), so we update every element
    // pointing at this target id, not just the one that was clicked.
    function syncTogglers(target, expanded) {
        var id = target.id;
        if (!id) return;
        var togglers = document.querySelectorAll(
            '[data-bs-toggle="collapse"][data-bs-target="#' + id + '"]'
        );
        togglers.forEach(function (t) {
            t.setAttribute("aria-expanded", expanded ? "true" : "false");
            t.classList.toggle("collapsed", !expanded);
        });
    }

    function show(target) {

        // Re-entry guard: ignore clicks while we're mid-animation, otherwise
        // overlapping toggles would leave the height/classes inconsistent.
        if (isShown(target) || isTransitioning(target)) return;

        // Class lifecycle mirrors Bootstrap's: drop .collapse, swap in
        // .collapsing for the duration of the height transition, then
        // settle on .collapse.show. The CSS keys all the styling off these
        // classes — the JS here is purely orchestrating timing.
        target.classList.remove("collapse");
        target.classList.add("collapsing");
        target.style.height = "0px";
        syncTogglers(target, true);

        // Force reflow so the browser registers height: 0 before we change it
        // (otherwise the transition won't kick in).
        void target.offsetHeight;

        // scrollHeight is the natural content height even while the element
        // is currently sized to 0 — that's the value we animate towards.
        var endHeight = target.scrollHeight + "px";

        // Shared end-state used by both the timer and the reduced-motion
        // shortcut, so both branches always land on identical DOM.
        function done() {
            target.classList.remove("collapsing");
            target.classList.add("collapse", "show");
            target.style.height = "";
        }

        if (reduceMotion) {
            done();
            return;
        }

        target.style.height = endHeight;
        window.setTimeout(done, TRANSITION_MS);
    }

    function hide(target) {

        if (!isShown(target) || isTransitioning(target)) return;

        // The element is currently at its natural (auto) height. CSS can't
        // transition from `auto` to `0`, so first pin the current pixel
        // height as an inline style and force a reflow — only then is the
        // browser willing to animate the change to 0.
        target.style.height = target.getBoundingClientRect().height + "px";
        void target.offsetHeight;

        target.classList.remove("collapse", "show");
        target.classList.add("collapsing");
        target.style.height = "0px";
        syncTogglers(target, false);

        function done() {
            target.classList.remove("collapsing");
            target.classList.add("collapse");
            target.style.height = "";
        }

        if (reduceMotion) {
            done();
            return;
        }

        window.setTimeout(done, TRANSITION_MS);
    }

    function toggle(target) {
        if (isShown(target)) hide(target);
        else show(target);
    }

    // Single delegated click handler so togglers added later (e.g. via
    // dynamic markup) Just Work without re-binding.
    document.addEventListener("click", function (e) {

        var toggler = e.target.closest('[data-bs-toggle="collapse"]');

        if (toggler) {
            // Bootstrap accepts either data-bs-target or href as the
            // selector, so fall back to href when the markup is the
            // `<a href="#panel">`-style toggler.
            var selector = toggler.getAttribute("data-bs-target") ||
                           toggler.getAttribute("href");
            if (!selector) return;
            var target = document.querySelector(selector);
            if (!target) return;
            // Stops the <a>-style toggler from doing an instant hash-jump
            // before our collapse animation gets to run.
            e.preventDefault();
            toggle(target);
            return;
        }

        // Auto-close: if the click was on a link or button inside an open
        // collapse, hide it (in-page nav UX on mobile).
        var openPanel = e.target.closest(".navbar-collapse.show");

        if (openPanel) {
            var inner = e.target.closest(".nav-link, .btn");
            if (inner) hide(openPanel);
        }

    });

})();

/* Smooth in-page scrolling for anchor links (e.g. navbar Services / Products
   / About). Replaces the browser's instant jump with a longer, eased scroll
   so sections feel like they glide into view rather than snap.

   - Triggers on any <a href="#section-id"> click whose target exists.
   - Uses easeInOutCubic for a soft start/end.
   - Respects prefers-reduced-motion (falls back to instant jump).
   - Updates the URL hash via history.pushState so back/forward still work
     and the address bar stays in sync. */

(function () {
    "use strict";

    var SCROLL_DURATION_MS = 1500;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var activeScroll = null;

    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Flag the document while we're driving the scroll ourselves, so other
    // scroll-driven scripts (e.g. the about-section character reveal) can
    // bail out of their per-frame work and let the animation breathe.
    function startAutoScroll() {
        document.documentElement.classList.add("is-auto-scrolling");
    }

    function endAutoScroll() {
        var html = document.documentElement;
        if (!html.classList.contains("is-auto-scrolling")) return;
        html.classList.remove("is-auto-scrolling");
        // Nudge any scroll-driven listeners to sync to the final position
        // now that we've handed the page back to them.
        try {
            window.dispatchEvent(new Event("scroll"));
        } catch (err) { /* noop */ }
    }

    function cancelActiveScroll() {
        if (activeScroll !== null) {
            window.cancelAnimationFrame(activeScroll);
            activeScroll = null;
        }
        endAutoScroll();
    }

    // If the user grabs the wheel / touches the screen mid-animation,
    // bail out so we don't fight their input.
    function attachInterrupts() {
        window.addEventListener("wheel", cancelActiveScroll, { passive: true, once: true });
        window.addEventListener("touchstart", cancelActiveScroll, { passive: true, once: true });
        window.addEventListener("keydown", cancelActiveScroll, { once: true });
    }

    function smoothScrollTo(targetY, duration) {
        // If a previous animation is still running (rapid link clicks),
        // tear it down first — two rAF loops both calling scrollTo would
        // fight and visibly jitter the page.
        cancelActiveScroll();

        var startY = window.scrollY || window.pageYOffset;
        var distance = targetY - startY;
        if (distance === 0) return;

        // Anchored on the first rAF tick (below) rather than now, so the
        // elapsed-time calculation is relative to the first painted frame
        // instead of including any setup overhead before that.
        var startTime = null;

        function step(now) {
            if (startTime === null) startTime = now;
            var elapsed = now - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = easeInOutCubic(progress);
            window.scrollTo(0, startY + distance * eased);
            if (progress < 1) {
                activeScroll = window.requestAnimationFrame(step);
            } else {
                activeScroll = null;
                endAutoScroll();
            }
        }

        // Order matters: claim the scroll (so scroll-driven scripts back
        // off) and wire up the user-input interrupts BEFORE queuing the
        // first frame, so the very first tick already runs in a clean
        // "we own the scroll" state.
        startAutoScroll();
        attachInterrupts();
        activeScroll = window.requestAnimationFrame(step);
    }

    document.addEventListener("click", function (e) {

        // Only act on plain left-clicks without modifier keys, so users can
        // still cmd/ctrl/middle-click to open in a new tab if they want.
        // defaultPrevented also lets the navbar collapse handler above
        // claim the click first without us double-handling it.
        if (e.defaultPrevented) return;
        if (e.button !== undefined && e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var link = e.target.closest('a[href]');
        if (!link) return;

        // Only same-page hash links. Skip "" / "#" / external URLs entirely
        // so the browser handles those as normal.
        var href = link.getAttribute("href");
        if (!href || href.charAt(0) !== "#" || href.length < 2) return;

        // querySelector throws on syntactically invalid selectors (e.g. a
        // hash containing slashes or other CSS-meaningful chars). Treat
        // that as "not our concern" and bail without preventDefault, so
        // the browser can fall back to its own behaviour.
        var target;
        try {
            target = document.querySelector(href);
        } catch (err) {
            return;
        }
        if (!target) return;

        e.preventDefault();

        // rect.top is viewport-relative; add the current scroll position
        // to convert it into a document-absolute Y. Math.max clamps at the
        // top of the page in case the math underflows (edge cases with
        // sub-pixel rects / negative margins).
        var rect = target.getBoundingClientRect();
        var currentY = window.scrollY || window.pageYOffset;
        var targetY = Math.max(0, Math.round(rect.top + currentY));

        if (reduceMotion) {
            window.scrollTo(0, targetY);
        } else {
            smoothScrollTo(targetY, SCROLL_DURATION_MS);
        }

        // Use pushState rather than assigning to location.hash, because
        // setting location.hash triggers the browser's own jump-to-anchor
        // behaviour and would fight the smooth-scroll we just started.
        if (window.history && typeof window.history.pushState === "function") {
            window.history.pushState(null, "", href);
        }
    });

})();