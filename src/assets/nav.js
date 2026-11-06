(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.querySelector(".site-header .site-nav");
  if (!toggle || !nav) return;

  function closeMenu() {
    toggle.checked = false;
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu();
  });
})();
