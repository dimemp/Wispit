/* Sets the footer copyright year to the current year, so the page never
   goes stale without a manual edit. */

(function () {
    "use strict";

    // Footer markup is shared across pages; bail quietly if a page omits it
    // rather than throwing — script is loaded globally.
    var el = document.getElementById("footer-year");
    if (!el) return;

    el.textContent = new Date().getFullYear();

})();