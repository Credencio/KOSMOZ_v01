/* Barra de abas comum a todas as páginas: uma aba por formulário (ordem de window.SURVEYS). */
(function () {
  function build() {
    const el = document.getElementById("navTabs"); if (!el || !window.SURVEYS) return;
    const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    el.innerHTML = window.SURVEYS.map((s, i) => {
      const active = s.page.toLowerCase() === here || (here === "" && s.page === "index.html");
      const n = String(i + 1).padStart(2, "0");
      return `<a class="nav-tab${active ? " active" : ""}" href="${s.page}${location.search.includes("demo") ? "?demo" : ""}"${active ? ' aria-current="page"' : ""}>`
        + `<span class="nav-num">${n}</span><span class="nav-txt"><span class="nav-name">${s.tab}</span>${s.navSub ? `<span class="nav-sub">${s.navSub}</span>` : ""}</span></a>`;
    }).join("");
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", build) : build();
})();
