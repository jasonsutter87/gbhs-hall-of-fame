/* GBHS Sports Hall of Fame — page-flip book engine */
(function () {
  "use strict";

  var DATA  = window.HOF;
  var IMG   = "assets/img";
  var PHOTO = function (slug, n, thumb) {
    return IMG + "/photos/" + slug + "/" + (thumb ? "t" : "p") + n + ".webp";
  };

  /* Photos fill their frame, so a centred crop can cut off a head or park the
     subject off-frame. `focus` in data.js names the object-position for any
     photo that needs the crop anchored somewhere other than the centre. */
  /* True when photo n is taller than it is wide. `ar` is written by
     build/export.py, so the frame can match the photograph. */
  var upright = function (a, n) {
    var r = a.ar && a.ar[n - 1];
    return r ? r < 0.95 : false;
  };

  /* Lay a gallery out across two columns so upright photos get upright frames
     and landscape ones get wide frames, with no holes left in the grid.
     Upright photos are emitted in pairs (a two-row band, one per column); a
     leftover upright is banded with two landscape photos stacked beside it;
     landscape photos then fill single cells in pairs, and a final odd one
     spans the full width. Source order is preserved within each shape. */
  function lay(a, photos) {
    var tall = [], wide = [], cells = [];
    photos.forEach(function (n) { (upright(a, n) ? tall : wide).push(n); });

    while (tall.length >= 2) {
      cells.push({ n: tall.shift(), cls: "tall" });
      cells.push({ n: tall.shift(), cls: "tall" });
    }
    if (tall.length && wide.length >= 2) {
      cells.push({ n: tall.shift(), cls: "tall" });
      cells.push({ n: wide.shift(), cls: "wide" });
      cells.push({ n: wide.shift(), cls: "wide" });
    } else if (tall.length) {
      cells.push({ n: tall.shift(), cls: "tall full" });
    }
    while (wide.length >= 2) {
      cells.push({ n: wide.shift(), cls: "wide" });
      cells.push({ n: wide.shift(), cls: "wide" });
    }
    if (wide.length) cells.push({ n: wide.shift(), cls: "wide full" });
    return cells;
  }

  var FOCUS = function (a, n) {
    var f = a.focus && a.focus[n];
    return f ? ' style="object-position:' + f + '"' : "";
  };

  /* ---------------------------------------------------------------- pages */

  var pages = [];
  var anchors = {};           // slug -> page index

  pages.push({ type: "cover" });
  pages.push({ type: "dedication" });
  pages.push({ type: "contents" });

  DATA.inductees.forEach(function (a) {
    var rest = [1, 2, 3, 4, 5, 6].filter(function (n) { return n !== a.hero; });
    anchors[a.slug] = pages.length;

    pages.push({ type: "portrait",   a: a });
    pages.push({ type: "highlights", a: a });
    pages.push({ type: "gallery",    a: a, photos: rest });

    if (a.retro) pages.push({ type: "retro", a: a });
    if (a.bio)   pages.push({ type: "bio",   a: a });
    if (!a.retro && !a.bio) {
      if (a.note) pages.push({ type: "note",    a: a });
      else        pages.push({ type: "feature", a: a, photo: rest[0] });
    }
  });

  pages.push({ type: "colophon" });

  /* Spreads pair an odd page (left) with the next even page (right), so every
     athlete's portrait is padded onto an odd index. That puts the portrait on
     the left and the highlights on the right — the same layout as the deck. */
  (function balance() {
    var fixed = [], i;
    for (i = 0; i < pages.length; i++) {
      if (pages[i].type === "portrait" && fixed.length % 2 === 0) {
        fixed.push({ type: "blank" });
      }
      fixed.push(pages[i]);
    }
    if (fixed.length % 2) fixed.push({ type: "blank" });
    // rebuild anchor table against the padded array
    Object.keys(anchors).forEach(function (k) { delete anchors[k]; });
    fixed.forEach(function (p, idx) {
      if (p.type === "portrait") anchors[p.a.slug] = idx;
    });
    pages = fixed;
  })();

  /* --------------------------------------------------------------- render */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function nameline(a) {
    return '<div class="nameline"><h2>' + esc(a.name) + "</h2>" +
           '<div class="meta">' + esc(a.year) + " &nbsp;·&nbsp; " + esc(a.sport) + "</div></div>";
  }

  function plate(a) {
    return '<div class="plate"><img src="' + IMG + "/plates/" + a.slug +
           '.webp" alt="' + esc(a.name) + ' nameplate" loading="lazy"></div>';
  }

  function buildPage(p, index) {
    var page = el("div", "page"), a = p.a, h = "";

    switch (p.type) {

      case "cover":
        page.className = "page cover";
        page.innerHTML =
          '<img class="crest" src="' + IMG + '/ui/logo.webp" alt="Granite Bay Grizzlies crest">' +
          '<div class="school">' + esc(DATA.event.school) + "</div>" +
          "<h2>" + esc(DATA.event.title) + "</h2>" +
          '<div class="class">' + esc(DATA.event.subtitle) + "</div>" +
          '<div class="motto">' + esc(DATA.event.motto) + "</div>" +
          '<div class="when">' + esc(DATA.event.date) + "</div>";
        return page;

      case "dedication":
        page.innerHTML =
          '<div class="eyebrow">' + esc(DATA.event.anniversary) + "</div>" +
          '<div class="rule"></div>' +
          '<div class="dedication">' +
            "<p>Thirty years ago a school opened its doors on a hillside in Granite Bay with no " +
            "banners in its gym, no records in its books, and no history to lean on. Everything " +
            "these pages celebrate had to be built from nothing.</p>" +
            "<p>The fourteen women and men in this inaugural class did that building. They set " +
            "the first records, won the first championships, and left the standard that every " +
            "Grizzly since has measured themselves against. Some went on to the Olympics, the " +
            "NFL, the LPGA, and Major League Baseball. One of them started the football program " +
            "itself and coached here for nineteen seasons.</p>" +
            "<p>What follows is their record — in their coaches' words, their families' words, " +
            "and their own.</p>" +
          "</div>" +
          '<div class="byline">' + esc(DATA.event.motto) + "</div>";
        break;

      case "contents":
        h = '<div class="eyebrow">The Inaugural Class</div><div class="contents">';
        DATA.inductees.forEach(function (a) {
          h += '<button class="toc-item" data-goto="' + a.slug + '">' +
                 '<span class="idx">' + a.n + "</span>" +
                 '<span class="who">' + esc(a.name) + "</span>" +
                 '<span class="dots"></span>' +
                 '<span class="what">' + esc(a.sport) + "</span>" +
               "</button>";
        });
        h += "</div>";
        page.innerHTML = h;
        break;

      case "portrait":
        page.innerHTML =
          plate(a) +
          '<div class="portrait"><img src="' + PHOTO(a.slug, a.hero) +
            '" alt="' + esc(a.name) + '" loading="lazy"' + FOCUS(a, a.hero) + "></div>" +
          '<div class="tagline">' + esc(a.tagline) + "</div>";
        break;

      case "highlights":
        h = nameline(a) + '<div class="rule"></div><ul class="highlights">';
        a.highlights.forEach(function (row) {
          h += "<li><strong>" + esc(row[0]) + "</strong>" + esc(row[1]) + "</li>";
        });
        h += "</ul>";
        page.innerHTML = h;
        break;

      case "gallery":
        h = '<div class="eyebrow">' + esc(a.name) + "</div><div class=\"gallery\">";
        lay(a, p.photos).forEach(function (c) {
          h += '<figure class="' + c.cls + '"' +
               ' data-full="' + PHOTO(a.slug, c.n) + '">' +
               '<img src="' + PHOTO(a.slug, c.n, true) + '" alt="' + esc(a.name) +
               '" loading="lazy"' + FOCUS(a, c.n) + "></figure>";
        });
        h += "</div>";
        page.innerHTML = h;
        break;

      case "retro":
        h = '<div class="eyebrow">Retrospective</div><div class="retro">';
        a.retro.paras.forEach(function (t) { h += "<p>" + esc(t) + "</p>"; });
        h += '</div><div class="byline">' + esc(a.retro.author) +
             "<span>" + esc(a.retro.role) + "</span></div>";
        page.innerHTML = h;
        break;

      case "bio":
        h = '<div class="eyebrow">Biography</div>' + nameline(a) +
            '<div class="rule"></div><div class="retro bio">';
        a.bio.paras.forEach(function (t) { h += "<p>" + esc(t) + "</p>"; });
        h += "</div>";
        page.innerHTML = h;
        break;

      case "note":
        page.innerHTML =
          '<div class="eyebrow">For the Record</div>' + nameline(a) +
          '<div class="rule"></div>' +
          '<div class="note">' + esc(a.note) + "</div>" +
          '<div class="tagline" style="margin-top:auto">' + esc(a.tagline) + "</div>";
        break;

      case "feature":
        page.innerHTML =
          '<div class="eyebrow">' + esc(a.name) + "</div>" +
          '<div class="portrait" style="margin-bottom:18px"><img src="' +
            PHOTO(a.slug, p.photo) + '" alt="' + esc(a.name) + '" loading="lazy"' +
            FOCUS(a, p.photo) + "></div>" +
          '<div class="tagline">' + esc(a.tagline) + "</div>";
        break;

      case "colophon":
        page.className = "page backcover";
        page.innerHTML =
          '<div class="colophon">' +
            '<img src="' + IMG + '/ui/qr-hof.png" alt="QR code linking to this program">' +
            '<p class="qr-cap">Scan to open this program on your phone</p>' +
            "<p>" + esc(DATA.event.title) + " &middot; " + esc(DATA.event.subtitle) + "</p>" +
            "<p>" + esc(DATA.event.date) + "<br>" + esc(DATA.event.venue) + "</p>" +
            "<p>" + esc(DATA.event.contact) + "</p>" +
          "</div>";
        return page;

      case "blank":
        page.innerHTML = "";
        return page;
    }

    page.appendChild(el("div", "page-num", String(index)));
    return page;
  }

  /* ---------------------------------------------------------------- build */

  var book     = document.getElementById("book");
  var folio    = document.getElementById("folio");
  var btnPrev  = document.getElementById("prev");
  var btnNext  = document.getElementById("next");
  var btnToc   = document.getElementById("toc");
  var lightbox = document.getElementById("lightbox");
  var lbImg    = lightbox.querySelector("img");

  var leaves = [];
  var faces  = [];
  var nLeaves = Math.ceil(pages.length / 2);

  for (var i = 0; i < nLeaves; i++) {
    var leaf = el("div", "leaf");
    ["front", "back"].forEach(function (side, s) {
      var idx  = i * 2 + s;
      var face = el("div", "face " + side);
      if (idx < pages.length) face.appendChild(buildPage(pages[idx], idx));
      face.dataset.page = idx;
      leaf.appendChild(face);
      faces[idx] = face;
    });
    leaves.push(leaf);
    book.appendChild(leaf);
  }

  /* ------------------------------------------------------------ navigate */

  var leafAt = 0;   // desktop: leaves flipped so far
  var pageAt = 0;   // phone: current page

  function isPhone() {
    return window.matchMedia("(max-width: 900px), (max-height: 620px)").matches;
  }

  /* While a leaf is mid-turn it must sit above every other leaf, otherwise it
     animates through the stack. Its resting z-index is restored on completion. */
  var turnTimer = null;
  function raiseTurningLeaf(i) {
    if (i < 0 || i >= nLeaves) return;
    var leaf = leaves[i];
    clearTimeout(turnTimer);
    leaf.style.zIndex = nLeaves + 1;
    leaf.classList.add("turning");
    turnTimer = setTimeout(function () {
      leaf.classList.remove("turning");
      render();
    }, parseInt(getComputedStyle(document.documentElement)
                 .getPropertyValue("--leaf-ms"), 10) || 820);
  }

  function render() {
    var phone = isPhone();

    if (phone) {
      faces.forEach(function (f, i) { f.classList.toggle("is-current", i === pageAt); });
      folio.textContent = "Page " + (pageAt + 1) + " of " + pages.length;
      btnPrev.disabled = pageAt === 0;
      btnNext.disabled = pageAt >= pages.length - 1;
    } else {
      leaves.forEach(function (leaf, i) {
        var flipped = i < leafAt;
        leaf.classList.toggle("flipped", flipped);
        if (!leaf.classList.contains("turning")) {
          leaf.style.zIndex = flipped ? i : nLeaves - i;
        }
      });
      book.classList.toggle("at-cover", leafAt === 0);
      book.classList.toggle("at-end", leafAt === nLeaves);
      folio.textContent = leafAt === 0 ? "Cover"
        : leafAt >= nLeaves ? "End"
        : "Pages " + (leafAt * 2 - 1) + "–" + (leafAt * 2) + " of " + pages.length;
      btnPrev.disabled = leafAt === 0;
      btnNext.disabled = leafAt >= nLeaves;
    }
  }

  function go(delta) {
    if (isPhone()) {
      pageAt = Math.max(0, Math.min(pages.length - 1, pageAt + delta));
      leafAt = Math.floor(pageAt / 2);
    } else {
      var from = leafAt;
      leafAt = Math.max(0, Math.min(nLeaves, leafAt + delta));
      if (leafAt !== from) raiseTurningLeaf(delta > 0 ? from : leafAt);
      // keep the phone cursor on the right-hand page of the open spread
      pageAt = Math.min(pages.length - 1, Math.max(0, leafAt * 2));
    }
    render();
  }

  /* A spread at leafAt = k shows page 2k-1 on the left and 2k on the right.
     So an odd page opens at k = (p+1)/2 and an even page at k = p/2 — both
     of which are ceil(p/2). */
  function jumpToPage(idx) {
    pageAt = Math.max(0, Math.min(pages.length - 1, idx));
    leafAt = Math.max(0, Math.min(nLeaves, Math.ceil(pageAt / 2)));
    render();
  }

  function jumpToSlug(slug) {
    if (anchors[slug] == null) return false;
    jumpToPage(anchors[slug]);
    return true;
  }

  btnPrev.addEventListener("click", function () { go(-1); });
  btnNext.addEventListener("click", function () { go(1); });
  btnToc.addEventListener("click", function () { jumpToPage(2); });

  document.addEventListener("keydown", function (e) {
    if (lightbox.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      return;
    }
    if (e.key === "ArrowRight" || e.key === "PageDown") { go(1);  e.preventDefault(); }
    if (e.key === "ArrowLeft"  || e.key === "PageUp")   { go(-1); e.preventDefault(); }
    if (e.key === "Home") jumpToPage(0);
    if (e.key === "End")  jumpToPage(pages.length - 1);
  });

  /* Table-of-contents buttons and gallery thumbnails (delegated). */
  book.addEventListener("click", function (e) {
    var toc = e.target.closest("[data-goto]");
    if (toc) {
      var slug = toc.dataset.goto;
      if (jumpToSlug(slug)) history.replaceState(null, "", "#/" + slug);
      return;
    }
    var fig = e.target.closest("figure[data-full]");
    if (fig) openLightbox(fig.dataset.full);
  });

  /* Swipe on phones. */
  (function swipe() {
    var x0 = null, y0 = null;
    book.addEventListener("touchstart", function (e) {
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    book.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
      x0 = y0 = null;
    }, { passive: true });
  })();

  /* --------------------------------------------------------- lightbox */

  function openLightbox(src) {
    lbImg.src = src;
    lightbox.classList.add("open");
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
    lbImg.src = "";
  }
  lightbox.addEventListener("click", closeLightbox);

  /* ------------------------------------------------------------ routing */

  function applyHash() {
    var m = /^#\/(.+)$/.exec(location.hash || "");
    if (m) jumpToSlug(decodeURIComponent(m[1]));
  }
  window.addEventListener("hashchange", applyHash);

  var wasPhone = isPhone();
  window.addEventListener("resize", function () {
    var now = isPhone();
    if (now !== wasPhone) { wasPhone = now; jumpToPage(pageAt); }
  });

  render();
  applyHash();
})();
