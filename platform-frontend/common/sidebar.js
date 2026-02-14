fetch("/common/sidebar.html")
  .then(res => res.text())
  .then(html => {
    // Inject sidebar
    document.getElementById("sidebar-container").innerHTML = html;

    // Highlight active link AFTER sidebar is injected
    const currentPage = window.location.pathname.split("/").pop();

    const navLinks = document.querySelectorAll(".nav-item");

    navLinks.forEach(link => {
      const linkPage = link.getAttribute("href");

      if (linkPage === currentPage) {
        link.classList.add("active");
      }
    });
  })
  .catch(err => console.error("Sidebar load failed", err));