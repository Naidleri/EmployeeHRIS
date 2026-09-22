const router = {
  routes: {
    "": "pages/employee_list.html",
    "employee": "pages/employee_list.html",
    "onboarding": "pages/onboarding.html",
    "onboarding/create": "pages/onboarding/create.html"
  },

  async loadPage(hash) {
    const appContent = document.querySelector("#app-content");
    const route = hash.split("?")[0];
    const pagePath = this.routes[route] || this.routes[""];

    try {
      const response = await fetch(pagePath);

      if (!response.ok) {
        throw new Error(`Halaman tidak ditemukan: ${response.status}`);
      }

      const pageHtml = await response.text();
      const pageDocument = new DOMParser().parseFromString(pageHtml, "text/html");

      appContent.innerHTML = pageDocument.body.innerHTML;
      document.title = pageDocument.title || "Employee HRIS";

      if (route === "onboarding" && window.OnboardingTabs) {
        new window.OnboardingTabs();
      }

      if (route === "onboarding/create" && window.initOnboardingCreate) {
        window.initOnboardingCreate();
      }

      if (route === "employee" || route === "") {
        window.initEmployeeList?.();
      }

      this.updateActiveLink(route);
    } catch (error) {
      appContent.innerHTML = "<p>Halaman gagal dimuat.</p>";
      console.error(error);
    }
  },

  updateActiveLink(hash) {
    document.querySelectorAll(".sidebar__link").forEach(link => {
      link.classList.remove("is-active");
    });

    document.querySelectorAll(".sidebar__section").forEach(section => {
      section.classList.remove("is-open");
    });

    const activeLink = document.querySelector(`[data-route="${hash}"]`);
    if (activeLink) {
      activeLink.classList.add("is-active");
      
      const parentSection = activeLink.closest(".sidebar__section");
      if (parentSection) {
        parentSection.classList.add("is-open");
      }
    }
  },

  init() {
    const hash = window.location.hash.slice(1); 
    this.loadPage(hash);

    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-route]");
      if (link) {
        e.preventDefault();
        const route = link.dataset.route;
        window.location.hash = route;
      }

      const title = e.target.closest(".sidebar__title");
      if (title) {
        const section = title.closest(".sidebar__section");
        if (section) {
          const isOpen = section.classList.contains("is-open");
          
          document.querySelectorAll(".sidebar__section").forEach(s => {
            s.classList.remove("is-open");
          });
          
          if (!isOpen) {
            section.classList.add("is-open");
          }
        }
      }
    });

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.slice(1);
      this.loadPage(hash);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    router.init();
  }, 100);
});
