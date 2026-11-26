/* Dial in your site (services.html): seven range settings estimate which
   website level a project lands on. A rough read only; the button goes to
   the quote form. Levels and prices match the Websites + Shopify list. */
(function () {
  var desk = document.querySelector("[data-desk]");
  if (!desk) return;
  desk.hidden = false;

  var levels = {
    starter: { name: "Starter", price: "From $750" },
    pro: { name: "Professional", price: "From $1,495" },
    complicated: { name: "Complicated", price: "From $2,495" }
  };
  var inputs = desk.querySelectorAll('input[type="range"]');
  var levelEl = desk.querySelector("[data-desk-level]");
  var priceEl = desk.querySelector("[data-desk-price]");
  var extrasEl = desk.querySelector("[data-desk-extras]");
  var hintTitle = desk.querySelector("[data-desk-hint-title]");
  var hintText = desk.querySelector("[data-desk-hint-text]");
  var cta = desk.querySelector("[data-desk-cta]");

  function val(name) { return Number(desk.elements[name].value); }

  function paint(input) {
    var stops = input.getAttribute("data-stops").split("|");
    var v = Number(input.value), max = Number(input.max);
    var label = stops[v].replace("&rsquo;", "’");
    input.setAttribute("aria-valuetext", label);
    input.style.setProperty("--fill", (max ? (v / max) * 100 : 0) + "%");
    var out = input.closest(".desk-row").querySelector("output");
    out.textContent = label;
  }

  function update() {
    var pages = val("pages"), features = val("features"), store = val("store"),
        tools = val("tools"), content = val("content"), start = val("start"), look = val("look");
    var level = "starter";
    if (store > 0 || features >= 2 || tools >= 2 || pages >= 3) level = "complicated";
    else if (pages >= 1 || features === 1 || tools === 1 || content === 1 || start === 1 || look === 1) level = "pro";

    levelEl.textContent = levels[level].name;
    priceEl.textContent = levels[level].price;
    desk.setAttribute("data-level", level);

    var extras = [];
    if (content === 2) extras.push("Plus a shoot day, half-day from $495");
    if (start === 1) extras.push("Moving your old site, quoted by what moves");
    if (look === 1) extras.push("Custom motion, quoted with your project");
    extrasEl.innerHTML = "";
    extras.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; extrasEl.appendChild(li); });

    cta.href = "contact.html?type=" + (store > 0 ? "Shopify" : "Website") + "#start";
  }

  function hint(input) {
    var row = input.closest(".desk-row");
    hintTitle.textContent = row.querySelector(".desk-label .mono").textContent + " " + row.querySelector("label").textContent;
    hintText.textContent = row.getAttribute("data-hint");
  }

  inputs.forEach(function (input) {
    paint(input);
    input.addEventListener("input", function () { paint(input); hint(input); update(); });
    input.addEventListener("focus", function () { hint(input); });
  });
  desk.addEventListener("reset", function () {
    setTimeout(function () { inputs.forEach(paint); hint(inputs[0]); update(); }, 0);
  });
  desk.addEventListener("submit", function (e) { e.preventDefault(); });
  update();
})();
