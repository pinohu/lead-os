(function() {
  var script = document.currentScript;
  var apiKey = script.getAttribute("data-key") || new URL(script.src).searchParams.get("key");
  var niche = script.getAttribute("data-niche") || new URL(script.src).searchParams.get("niche") || "general";
  var endpoint = script.src.split("/embed.js")[0] + "/api/embed/submit";

  // Create shadow DOM container
  var host = document.createElement("div");
  host.id = "erie-pro-embed";
  script.parentNode.insertBefore(host, script.nextSibling);
  var shadow = host.attachShadow({ mode: "closed" });

  // Inject form HTML + styles
  shadow.innerHTML = [
    '<style>',
    '* { box-sizing: border-box; font-family: Inter, system-ui, sans-serif; }',
    '.ep-form { max-width: 400px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }',
    '.ep-input { display: block; width: 100%; padding: 10px 12px; margin-bottom: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }',
    '.ep-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.2); }',
    '.ep-btn { display: block; width: 100%; padding: 12px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }',
    '.ep-btn:hover { background: #4338ca; }',
    '.ep-btn:disabled { opacity: 0.6; cursor: wait; }',
    '.ep-success { text-align: center; color: #059669; font-weight: 600; padding: 20px; }',
    '.ep-error { color: #dc2626; font-size: 13px; margin-bottom: 8px; display: none; }',
    '</style>',
    '<form class="ep-form">',
    '  <input class="ep-input" name="name" placeholder="Full name *" required aria-label="Full name" />',
    '  <input class="ep-input" name="email" type="email" placeholder="Email *" required aria-label="Email" />',
    '  <input class="ep-input" name="phone" type="tel" placeholder="Phone" aria-label="Phone" />',
    '  <textarea class="ep-input" name="message" placeholder="What do you need?" rows="3" aria-label="Message"></textarea>',
    '  <div class="ep-error" role="alert"></div>',
    '  <button class="ep-btn" type="submit">Get a Free Quote</button>',
    '</form>'
  ].join('\n');

  var form = shadow.querySelector("form");
  var errEl = shadow.querySelector(".ep-error");

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    errEl.style.display = "none";

    var fd = new FormData(form);
    var payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      message: fd.get("message"),
      niche: niche
    };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        form.innerHTML = '<div class="ep-success">Request submitted! A provider will contact you shortly.</div>';
      } else {
        errEl.textContent = data.error || "Something went wrong";
        errEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Get a Free Quote";
      }
    })
    .catch(function() {
      errEl.textContent = "Network error. Please try again.";
      errEl.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Get a Free Quote";
    });
  });
})();
