document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector("[data-sidebar]");

  if (!sidebar) {
    return;
  }

  const cacheBuster = `?v=${new Date().getTime()}`;
  const sidebarUrl = sidebar.dataset.sidebar + cacheBuster;

  fetch(sidebarUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Sidebar gagal dimuat");
      }

      return response.text();
    })
    .then((html) => {
      sidebar.innerHTML = html;
      console.log("Sidebar berhasil dimuat:", html.length, "characters");
    })
    .catch((error) => {
      sidebar.innerHTML = "<p>Sidebar tidak dapat dimuat.</p>";
      console.error("Error loading sidebar:", error);
    });
});
