/* Barra de abas comum a todas as páginas: uma aba por formulário (ordem de window.SURVEYS). */
(function () {
  function build() {
    const el = document.getElementById("navTabs"); if (!el || !window.SURVEYS) return;
    const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    el.innerHTML = window.SURVEYS.map((s) => {
      const active = s.page.toLowerCase() === here || (here === "" && s.page === "index.html");
      return `<a class="nav-tab${active ? " active" : ""}" href="${s.page}${location.search.includes("demo") ? "?demo" : ""}"${active ? ' aria-current="page"' : ""}>${s.tab}</a>`;
    }).join("");
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", build) : build();
})();
