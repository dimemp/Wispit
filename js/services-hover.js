/* Services card hover animations (3 canvases).
   - Canvas background is #FFFEFB to match --bs-body-bg.
   - Greys are pulled from the site palette (--wi-border, --wi-faded,
     --wi-dim, --wi-subtle, --wi-muted, --wi-rule) so the graphics sit
     in the same warm-neutral family as the rest of the page.
   - One-shot per hover: a full animation cycle always runs to completion,
     even if the user leaves the card mid-cycle; subsequent hovers while
     an animation is playing are ignored (no restart).
   - Accent colour is orange #FF5C00 (--wi-main-brand-color); the
     "gradient" appearance comes from varying alpha along each beam
     (peak opacity = the pure orange). */

(function () {
    if (typeof document === "undefined") return;

    function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    var ORANGE = [255, 92, 0];
    var LW = 0.7;
    var BG = "#FFFEFB";
    var lineC = "#D5D4D3";
    var dotC = "#737271";
    var divC = "#D5D4D3";

    var MONO_FONT = '"geist-mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

    // Drawings are authored in a 220×160 logical space. We upscale the bitmap
    // so the canvas stays crisp when CSS stretches it across the full card
    // width (and on retina screens).
    var LOGICAL_W = 220;
    var LOGICAL_H = 160;
    function setupHiDpi(canvas, ctx) {
        var dpr = Math.max(window.devicePixelRatio || 1, 2);
        canvas.width = LOGICAL_W * dpr;
        canvas.height = LOGICAL_H * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function bLine(ctx, x1, y1, x2, y2, alpha) {

        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = "rgba(" + ORANGE[0] + "," + ORANGE[1] + "," + ORANGE[2] + ",1)";
        ctx.lineWidth = LW;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.restore();
    }

    function bDotted(ctx, x1, y1, x2, y2, alpha, growP) {

        if (alpha <= 0 || growP <= 0) return;

        var ex = x1 + (x2 - x1) * growP, ey = y1 + (y2 - y1) * growP;
        var len = Math.sqrt((ex - x1) * (ex - x1) + (ey - y1) * (ey - y1));


        if (len < 1) return;


        var dl = 3, gl = 2, per = dl + gl, dx = (ex - x1) / len, dy = (ey - y1) / len;
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = "rgba(" + ORANGE[0] + "," + ORANGE[1] + "," + ORANGE[2] + ",1)";
        ctx.lineWidth = LW;
        ctx.lineCap = "round";
        var pos = 0;


        while (pos < len) {
            var se = Math.min(pos + dl, len);
            ctx.beginPath();
            ctx.moveTo(x1 + dx * pos, y1 + dy * pos);
            ctx.lineTo(x1 + dx * se, y1 + dy * se);
            ctx.stroke();
            pos += per;
        }

        ctx.restore();
    }

    function bBeamPts(ctx, pts, alpha) {

        if (pts.length < 2) return;

        for (var i = 1; i < pts.length; i++) {
            var f = i / pts.length;
            var a = f < 0.5 ? 0.6 * (f / 0.5) : 0.6 + 0.4 * ((f - 0.5) / 0.5);
            ctx.save();
            ctx.globalAlpha = alpha * f;
            ctx.strokeStyle = "rgba(" + ORANGE[0] + "," + ORANGE[1] + "," + ORANGE[2] + "," + a + ")";
            ctx.lineWidth = LW;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
            ctx.lineTo(pts[i].x, pts[i].y);
            ctx.stroke();
            ctx.restore();
        }

    }

    function dotDraw(ctx, x, y, r, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    /* Card 1 — converging beams into a mid-point, then forward to end */
    function initCard1() {
        var bc = document.getElementById("svc-c1");
        var card = document.getElementById("svc-card1");
        if (!bc || !card) return;
        var ctx = bc.getContext("2d");
        setupHiDpi(bc, ctx);
        var animating = false, animStart = null, raf = null;
        var BCYCLE = 2800;

        var sourceDots = [
        { x: 28, y: 22 }, { x: 22, y: 45 }, { x: 32, y: 68 },
        { x: 20, y: 92 }, { x: 30, y: 115 }, { x: 24, y: 138 }
        ];
        var midDot = { x: 130, y: 80 }, endDot = { x: 195, y: 80 };

        function bezPt(t, x0, y0, cx1, cy1, cx2, cy2, x1, y1) {
        var m = 1 - t;
        return {
            x: m * m * m * x0 + 3 * m * m * t * cx1 + 3 * m * t * t * cx2 + t * t * t * x1,
            y: m * m * m * y0 + 3 * m * m * t * cy1 + 3 * m * t * t * cy2 + t * t * t * y1
        };

    }

    function getCP(d) { 
        return { cx1: d.x + 55, cy1: d.y, cx2: midDot.x - 30, cy2: midDot.y }; 
    }

    function drawBase() {

        ctx.clearRect(0, 0, 220, 160);
        ctx.fillStyle = BG; ctx.fillRect(0, 0, 220, 160);

        sourceDots.forEach(function (d) {
            var cp = getCP(d);
            ctx.save();
            ctx.strokeStyle = lineC; ctx.lineWidth = LW; ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.bezierCurveTo(cp.cx1, cp.cy1, cp.cx2, cp.cy2, midDot.x, midDot.y);
            ctx.stroke();
            ctx.restore();
        });

        ctx.save();
        ctx.strokeStyle = lineC; ctx.lineWidth = LW; ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.moveTo(midDot.x, midDot.y); ctx.lineTo(endDot.x, endDot.y); ctx.stroke();
        ctx.restore();


        sourceDots.concat([midDot, endDot]).forEach(function (d) { dotDraw(ctx, d.x, d.y, 2, dotC, 1); });

    }

    function drawBeams(t) {
        var p1e = 0.45, p2s = 0.52, p3e = 0.78, p4s = 0.88;
        var ga = 1;

        if (t > p4s) ga = 1 - easeInOut((t - p4s) / 0.12);


        if (t < p2s) {
            var h = easeInOut(clamp(t / p1e, 0, 1));

            sourceDots.forEach(function (d) {

                var cp = getCP(d), tail = Math.max(0, h - 0.18), steps = 40, pts = [];

                for (var i = 0; i <= steps; i++) {
                    var tt = tail + (h - tail) * (i / steps);
                    pts.push(bezPt(tt, d.x, d.y, cp.cx1, cp.cy1, cp.cx2, cp.cy2, midDot.x, midDot.y));
                }

                bBeamPts(ctx, pts, ga);
            });

        }

        if (t >= p2s && t < 1) {

            var h2 = easeInOut(clamp((t - p2s) / (p3e - p2s), 0, 1));
            var tl = Math.max(0, h2 - 0.28);
            var lx = midDot.x, ly = midDot.y, ex = endDot.x;
            var hx = lx + (ex - lx) * h2, tx = lx + (ex - lx) * tl, steps2 = 30, pts2 = [];

            for (var i2 = 0; i2 <= steps2; i2++) {
                var f = i2 / steps2;
                pts2.push({ x: tx + (hx - tx) * f, y: ly });
            }

            bBeamPts(ctx, pts2, ga);
        }

    }

    function loop(ts) {

        if (!animStart) animStart = ts;

        var elapsed = ts - animStart;

        if (elapsed >= BCYCLE) {
            drawBase();
            animating = false;
            animStart = null;
            raf = null;
            return;
        }

        var t = elapsed / BCYCLE;
        drawBase(); drawBeams(t);
        raf = requestAnimationFrame(loop);
    }

    card.addEventListener("mouseenter", function () {
        if (animating) return;
        animating = true;
        animStart = null;
        raf = requestAnimationFrame(loop);
    });

    drawBase();

}

    /* Card 2 — isometric stacked layers revealing one by one */
    function initCard2() {

        var ic = document.getElementById("svc-c2");
        var card = document.getElementById("svc-card2");


        if (!ic || !card) return;


        var ctx = ic.getContext("2d");


        setupHiDpi(ic, ctx);
        var animating = false, animStart = null, raf = null;
        var ISO_CYCLE = 6000;
        var pW = 50, pH = 13, cxI = 110;

        var layers = [
            { label: "Infrastructure", topY: 116, fill: "#F0F0EF", tc: "#737271" },
            { label: "Product",        topY: 90,  fill: "#F0F0EF", tc: "#4A4A48" },
            { label: "Business",       topY: 64,  fill: "#F0F0EF", tc: "#3A3A39" }
        ];

        function iso(topY, u, v) { 
            return { x: cxI + u * pW - v * pW, y: topY + u * pH + v * pH }; 
        }


        function getC(topY) {
            return {
                tl: iso(topY, -1, -1),
                tr: iso(topY, 1, -1),
                br: iso(topY, 1, 1),
                bl: iso(topY, -1, 1)
            };
        }

        function drawLayerFlat(layer) {

            var c = getC(layer.topY);

            ctx.save(); ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(c.tl.x, c.tl.y); ctx.lineTo(c.tr.x, c.tr.y);
            ctx.lineTo(c.br.x, c.br.y); ctx.lineTo(c.bl.x, c.bl.y);
            ctx.closePath();

            ctx.fillStyle = layer.fill; ctx.fill();
            ctx.strokeStyle = lineC; ctx.lineWidth = LW; ctx.stroke();

            var edgeDx = c.br.x - c.bl.x, edgeDy = c.br.y - c.bl.y, angle = Math.atan2(edgeDy, edgeDx);
            var sx = c.bl.x + (c.br.x - c.bl.x) * 0.02 + (c.tl.x - c.bl.x) * 0.18;
            var sy = c.bl.y + (c.br.y - c.bl.y) * 0.02 + (c.tl.y - c.bl.y) * 0.18;

            ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
            ctx.font = '7px ' + MONO_FONT; ctx.fillStyle = layer.tc;
            ctx.textAlign = "left"; ctx.textBaseline = "middle";
            ctx.fillText(layer.label, 0, 0); ctx.restore();
            ctx.restore();
        }

        function drawLayerAnimated(layer, alpha, slideY) {

            if (alpha <= 0) return;

            var c = getC(layer.topY + slideY);
            ctx.save(); ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(c.tl.x, c.tl.y); ctx.lineTo(c.tr.x, c.tr.y);
            ctx.lineTo(c.br.x, c.br.y); ctx.lineTo(c.bl.x, c.bl.y);
            ctx.closePath();

            ctx.fillStyle = layer.fill; ctx.fill();
            ctx.strokeStyle = lineC; ctx.lineWidth = LW; ctx.stroke();

            var edgeDx = c.br.x - c.bl.x, edgeDy = c.br.y - c.bl.y, angle = Math.atan2(edgeDy, edgeDx);
            var sx = c.bl.x + (c.br.x - c.bl.x) * 0.02 + (c.tl.x - c.bl.x) * 0.18;
            var sy = c.bl.y + (c.br.y - c.bl.y) * 0.02 + (c.tl.y - c.bl.y) * 0.18;

            ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
            ctx.font = '7px ' + MONO_FONT; ctx.fillStyle = layer.tc;
            ctx.textAlign = "left"; ctx.textBaseline = "middle";
            ctx.fillText(layer.label, 0, 0); ctx.restore();
            ctx.restore();
        }

        var starts = [0.00, 0.29, 0.55], ends = [0.28, 0.54, 0.78], holdEnd = 0.88, fadeDur = 0.12;


        function lA(i, t) {
            var s = starts[i], e = ends[i];
            if (t < s) return 0;
            if (t < e) return easeInOut((t - s) / (e - s));
            if (t < holdEnd) return 1;
            return 1 - easeInOut((t - holdEnd) / fadeDur);
        }

        function lS(i, t) {
            var s = starts[i], e = ends[i];
            if (t < s) return 22;
            if (t < e) return 22 * (1 - easeInOut((t - s) / (e - s)));
            return 0;
        }

        function drawBase() {
            ctx.clearRect(0, 0, 220, 160);
            ctx.fillStyle = BG; ctx.fillRect(0, 0, 220, 160);
            layers.forEach(function (l) { drawLayerFlat(l); });
        }

        function loop(ts) {

            if (!animStart) animStart = ts;

            var elapsed = ts - animStart;

            if (elapsed >= ISO_CYCLE) {
                drawBase();
                animating = false;
                animStart = null;
                raf = null;
                return;
            }

            var t = elapsed / ISO_CYCLE;
            ctx.clearRect(0, 0, 220, 160);
            ctx.fillStyle = BG; ctx.fillRect(0, 0, 220, 160);

            
            var c0 = getC(layers[0].topY), c1 = getC(layers[1].topY), c2 = getC(layers[2].topY);


        for (var i = 0; i < layers.length; i++) drawLayerAnimated(layers[i], lA(i, t), lS(i, t));

            var a1 = lA(1, t);

            if (a1 > 0) {
                bDotted(ctx, c1.bl.x, c1.bl.y, c0.bl.x, c0.bl.y, a1, a1);
                bDotted(ctx, c1.br.x, c1.br.y, c0.br.x, c0.br.y, a1, a1);
                bDotted(ctx, c1.tr.x, c1.tr.y, c0.tr.x, c0.tr.y, a1, a1);
            }

            var a2 = lA(2, t);

            if (a2 > 0) {
                bDotted(ctx, c2.bl.x, c2.bl.y, c1.bl.x, c1.bl.y, a2, a2);
                bDotted(ctx, c2.br.x, c2.br.y, c1.br.x, c1.br.y, a2, a2);
                bDotted(ctx, c2.tr.x, c2.tr.y, c1.tr.x, c1.tr.y, a2, a2);
            }

            raf = requestAnimationFrame(loop);
        }

        card.addEventListener("mouseenter", function () {

            if (animating) return;

            animating = true;
            animStart = null;
            raf = requestAnimationFrame(loop);
        });

        drawBase();
    }

    /* Card 3 — wireframe left / rendered right, with a scanning beam */
    function initCard3() {

        var bc = document.getElementById("svc-c3");
        var card = document.getElementById("svc-card3");

        if (!bc || !card) return;

        var ctx = bc.getContext("2d");
        setupHiDpi(bc, ctx);
        var animating = false, animStart = null, raf = null;
        var SCYCLE = 3200;
        var W = 220, H = 160, mid = W / 2;

        var fillL = "#F0F0EF", fillR = BG;
        var btnStroke = "#B8B7B6", textC = "#737271";

        function drawScene(beamX) {

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

            var dg = ctx.createLinearGradient(0, 0, 0, H);
            dg.addColorStop(0, "transparent");
            dg.addColorStop(0.2, divC);
            dg.addColorStop(0.8, divC);
            dg.addColorStop(1, "transparent");
            ctx.save();
            ctx.strokeStyle = dg; ctx.lineWidth = 0.5; ctx.globalAlpha = 1;
            ctx.beginPath(); ctx.moveTo(mid, 0); ctx.lineTo(mid, H); ctx.stroke();
            ctx.restore();

            var lw = LW;

            function wRect(x, y, w, h, rx) {

                ctx.save(); ctx.globalAlpha = 1; ctx.beginPath();

                if (rx) {
                    ctx.moveTo(x + rx, y); ctx.lineTo(x + w - rx, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + rx);
                    ctx.lineTo(x + w, y + h - rx);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
                    ctx.lineTo(x + rx, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - rx);
                    ctx.lineTo(x, y + rx);
                    ctx.quadraticCurveTo(x, y, x + rx, y);
                    ctx.closePath();
                } else {
                    ctx.rect(x, y, w, h);
                }

                ctx.strokeStyle = lineC; ctx.lineWidth = lw; ctx.stroke();
                ctx.restore();
            }

            wRect(6, 14, 98, 11, 2);
            wRect(6, 30, 98, 44, 2);
            ctx.save();
            ctx.strokeStyle = lineC; ctx.lineWidth = lw; ctx.globalAlpha = 1;
            ctx.beginPath(); ctx.moveTo(6, 30); ctx.lineTo(104, 74); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(104, 30); ctx.lineTo(6, 74); ctx.stroke();
            ctx.restore();
            wRect(6, 80, 44, 7, 2);
            wRect(6, 92, 98, 5, 1);
            wRect(6, 101, 70, 5, 1);
            wRect(22, 112, 60, 13, 3);
            [[6, 14], [104, 14], [6, 74], [104, 74]].forEach(function (p) {
                dotDraw(ctx, p[0], p[1], 1.5, dotC, 1);
            });

            var ox = 110;

            function rRect(x, y, w, h, rx, fill, stroke) {

                ctx.save(); ctx.globalAlpha = 1; ctx.beginPath();

                if (rx) {
                    ctx.moveTo(x + rx, y); ctx.lineTo(x + w - rx, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + rx);
                    ctx.lineTo(x + w, y + h - rx);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
                    ctx.lineTo(x + rx, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - rx);
                    ctx.lineTo(x, y + rx);
                    ctx.quadraticCurveTo(x, y, x + rx, y);
                    ctx.closePath();
                } else {
                    ctx.rect(x, y, w, h);
                }

                if (fill) { 
                    ctx.fillStyle = fill; ctx.fill(); 
                }

                if (stroke) { 
                    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); 
                }

                ctx.restore();
            }

            rRect(ox + 6, 14, 98, 11, 2, fillL, lineC);
            ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = "#B8B7B6"; ctx.fillRect(ox + 10, 17, 28, 5); ctx.restore();
            ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = "#D5D4D3"; ctx.fillRect(ox + 78, 17, 16, 5); ctx.restore();
            rRect(ox + 6, 30, 98, 44, 2, fillL, lineC);
            rRect(ox + 12, 34, 86, 36, 1, fillR, null);
            rRect(ox + 6, 80, 44, 7, 2, "#B8B7B6", null);
            rRect(ox + 6, 92, 98, 4, 1, "#E2E1E0", null);
            rRect(ox + 6, 101, 70, 4, 1, "#ECECEC", null);
            rRect(ox + 22, 112, 60, 13, 3, fillL, btnStroke);
            ctx.save();
            ctx.globalAlpha = 1; ctx.fillStyle = textC; ctx.font = '7px ' + MONO_FONT;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("Launch", ox + 52, 118.5); ctx.restore();

            if (beamX !== null) {
                var sg = ctx.createLinearGradient(0, 0, 0, H);
                sg.addColorStop(0, "transparent");
                sg.addColorStop(0.2, "rgba(" + ORANGE[0] + "," + ORANGE[1] + "," + ORANGE[2] + ",0.6)");
                sg.addColorStop(0.5, "rgba(" + ORANGE[0] + "," + ORANGE[1] + "," + ORANGE[2] + ",1)");
                sg.addColorStop(0.8, "rgba(" + ORANGE[0] + "," + ORANGE[1] + "," + ORANGE[2] + ",0.6)");
                sg.addColorStop(1, "transparent");
                ctx.save();
                ctx.strokeStyle = sg; ctx.lineWidth = LW; ctx.globalAlpha = 1;
                ctx.beginPath(); ctx.moveTo(beamX, 0); ctx.lineTo(beamX, H); ctx.stroke();
                ctx.restore();
            }

        }

        function loop(ts) {

            if (!animStart) animStart = ts;

            var elapsed = ts - animStart;

            if (elapsed >= SCYCLE) {
                drawScene(null);
                animating = false;
                animStart = null;
                raf = null;
                return;
            }
            
            var t = elapsed / SCYCLE;
            var beamX = easeInOut(t) * W;
            drawScene(beamX);
            raf = requestAnimationFrame(loop);

        }

        card.addEventListener("mouseenter", function () {

            if (animating) return;
            
            animating = true;
            animStart = null;
            raf = requestAnimationFrame(loop);
        });

        drawScene(null);
    }

    function init() {
        initCard1();
        initCard2();
        initCard3();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();