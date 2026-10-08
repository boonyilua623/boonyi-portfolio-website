"use strict";

/* Image lightbox */
function openLightbox(src, caption) {
  var opener = document.activeElement;
  var box = document.createElement("div");
  box.className = "lb";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Image preview");
  box.innerHTML =
    '<button type="button">Close</button><figure><img alt=""><figcaption></figcaption></figure>';
  var img = box.querySelector("img");
  img.src = src;
  img.alt = caption;
  box.querySelector("figcaption").textContent = caption;

  function close() {
    box.remove();
    document.removeEventListener("keydown", onKey);
    if (opener && opener.focus) opener.focus();
  }
  function onKey(e) {
    if (e.key === "Escape") close();
  }
  box.onclick = close;
  document.addEventListener("keydown", onKey);
  document.body.appendChild(box);
  box.querySelector("button").focus();
}

/* Media slots: show an asset, or let the owner preview a local file while editing */
var picker = document.createElement("input");
picker.type = "file";
picker.accept = "image/*,video/*";

function onActivate(el, fn) {
  el.onclick = fn;
  el.onkeydown = function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}

document.querySelectorAll(".slot").forEach(function (slot) {
  var ratio = slot.dataset.r || "4/3";
  var kind = slot.dataset.k || "img";
  var caption = slot.dataset.c || "";
  slot.innerHTML =
    '<div class="box" style="aspect-ratio:' +
    ratio +
    '" tabindex="0" role="button"></div><figcaption>' +
    caption +
    "</figcaption>";
  var box = slot.firstChild;

  function fill(src, isVideo) {
    box.className = "box on";
    box.removeAttribute("role");
    box.removeAttribute("tabindex");
    box.onclick = box.onkeydown = null;
    if (isVideo) {
      if (slot.hasAttribute("data-loop")) {
        box.innerHTML =
          '<video src="' +
          src +
          '" muted loop playsinline preload="auto" aria-label="' +
          (slot.dataset.a || caption) +
          '"></video>';
        var clip = box.firstChild;
        clip.muted = true; /* required for autoplay in most browsers */
        if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
          clip.controls = true; /* respect reduced motion: no autoplay */
        } else if ("IntersectionObserver" in window) {
          new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) clip.play().catch(function () {});
                else clip.pause();
              });
            },
            { threshold: 0.25 },
          ).observe(clip);
        } else {
          clip.play().catch(function () {});
        }
        return;
      }
      box.innerHTML = '<video src="' + src + '" controls playsinline preload="metadata"></video>';
      return;
    }
    box.innerHTML = '<img src="' + src + '" alt="' + (slot.dataset.a || caption) + '">';
    if (slot.dataset.p) box.firstChild.style.objectPosition = slot.dataset.p;
    box.classList.add("zm");
    box.tabIndex = 0;
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", "Zoom image: " + (slot.dataset.a || caption));
    onActivate(box, function () {
      openLightbox(src, caption);
    });
  }

  var source = slot.dataset.src;
  if (source) {
    fill(source, /^data:video|\.(mp4|webm|mov)(\?|$)/i.test(source));
    return;
  }
  box.innerHTML =
    "<span><i>+</i>Add " + (slot.dataset.l || (kind === "video" ? "video" : "image")) + "</span>";
  onActivate(box, function () {
    picker.onchange = function () {
      var file = picker.files[0];
      if (file) fill(URL.createObjectURL(file), file.type.indexOf("video") === 0);
      picker.value = "";
    };
    picker.click();
  });
});

/* Project tabs */
var tabs = [].slice.call(document.querySelectorAll("[role=tab]"));
var seg = document.querySelector(".seg");
var indicator = seg.querySelector(".ind");
var current = 0;
function moveIndicator(index) {
  var tab = tabs[index];
  current = index;
  indicator.style.width = tab.offsetWidth + "px";
  indicator.style.height = tab.offsetHeight + "px";
  indicator.style.transform = "translate(" + tab.offsetLeft + "px," + tab.offsetTop + "px)";
}
function showTab(index) {
  moveIndicator(index);
  if (tabs[index].scrollIntoView)
    tabs[index].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  tabs.forEach(function (tab, i) {
    var on = i === index;
    tab.setAttribute("aria-selected", on);
    tab.tabIndex = on ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
  });
}
tabs.forEach(function (tab, i) {
  tab.addEventListener("click", function () {
    showTab(i);
  });
  tab.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var next = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    showTab(next);
    tabs[next].focus();
  });
});

/* Sliding pill: place it without animation first, then switch transitions on */
moveIndicator(0);
requestAnimationFrame(function () {
  seg.classList.add("ready");
});
function replace() {
  seg.classList.remove("ready");
  moveIndicator(current);
  requestAnimationFrame(function () {
    seg.classList.add("ready");
  });
}
window.addEventListener("resize", replace);
if (document.fonts) document.fonts.ready.then(replace);

/* Portrait: 3D tilt and glare that follow the cursor (mouse devices only) */
var frame = document.querySelector(".pf");
if (frame && matchMedia("(hover:hover) and (prefers-reduced-motion:no-preference)").matches) {
  frame.addEventListener("pointermove", function (e) {
    var r = frame.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top) / r.height;
    frame.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
    frame.style.setProperty("--rx", ((0.5 - y) * 14).toFixed(2) + "deg");
    frame.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    frame.style.setProperty("--my", (y * 100).toFixed(1) + "%");
  });
  frame.addEventListener("pointerleave", function () {
    frame.style.removeProperty("--rx");
    frame.style.removeProperty("--ry");
  });
}

/* Profile animations: CGPA bar + number, highlight numbers count up, then their text fades in */
(function () {
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return; /* leave final state as-is */

  /* ---- speed settings (milliseconds) ---- */
  var BAR_MS = 1000; /* CGPA bar fill + CGPA number count */
  var BAR_DELAY = 100; /* wait before the CGPA starts */
  var COUNT_MS = 900; /* highlight numbers count-up */

  function whenVisible(el, fn, threshold) {
    if (!("IntersectionObserver" in window)) return fn();
    var io = new IntersectionObserver(
      function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        fn();
      },
      { threshold: threshold },
    );
    io.observe(el);
  }

  /* count a number element from 0 to its real value, then call done() */
  function countUp(num, duration, delay, done) {
    var to = +num.dataset.to;
    var decimals = +num.dataset.dec;
    var start = null;
    function step(now) {
      if (start === null) start = now + delay;
      var p = Math.max(Math.min((now - start) / duration, 1), 0);
      num.textContent = (to * (1 - Math.pow(1 - p, 4))).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }
  function prepNumber(item) {
    var num = item.querySelector(".gn");
    var text = num.textContent.trim();
    num.dataset.to = text;
    num.dataset.dec = (text.split(".")[1] || "").length;
    num.textContent = (0).toFixed(+num.dataset.dec);
    item.classList.add("pre"); /* hides the text that fades in afterwards */
    return num;
  }

  /* CGPA: bar fills and 0.00 -> 3.49 counts up together, then "/ 4.0" fades in */
  var fillBar = document.querySelector(".gbar i");
  if (fillBar) {
    var cgpa = fillBar.closest(".gpa");
    var cgpaNum = prepNumber(cgpa);
    var target = fillBar.style.width;
    fillBar.style.width = "0";
    whenVisible(
      fillBar.parentNode,
      function () {
        void fillBar.offsetWidth; /* commit the 0 width before animating */
        fillBar.style.transition =
          "width " + BAR_MS + "ms cubic-bezier(.22,1,.36,1) " + BAR_DELAY + "ms";
        fillBar.style.width = target;
        countUp(cgpaNum, BAR_MS, BAR_DELAY, function () {
          cgpa.classList.remove("pre");
        });
      },
      0.6,
    );
  }

  /* Highlights: count from 0 to the real number, then fade in the text after it */
  var hl = document.querySelector(".hl");
  if (hl) {
    var items = [].slice.call(hl.querySelectorAll(".gpa"));
    var nums = items.map(prepNumber);
    whenVisible(
      hl,
      function () {
        items.forEach(function (item, i) {
          countUp(nums[i], COUNT_MS, 0, function () {
            item.classList.remove("pre"); /* triggers the fade-in */
          });
        });
      },
      0.5,
    );
  }
})();
