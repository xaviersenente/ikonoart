document.addEventListener("astro:page-load", () => {
  // Gestion du menu mobile
  const menuBtn = document.getElementById(
    "menu-btn"
  ) as HTMLButtonElement | null;
  const menu = document.getElementById("menu") as HTMLElement | null;
  const page = document.body;

  // Variables pour l'observation du redimensionnement
  let resizeTimer: number;
  const lgBreakpoint: number = 1024;

  // Fonction pour gérer l'état du menu selon la taille d'écran
  const handleMenuState = (): void => {
    if (!menuBtn || !menu) return;

    const isMobile: boolean = window.innerWidth < lgBreakpoint;
    const isMenuClosed: boolean =
      menuBtn.getAttribute("aria-expanded") === "false";

    if (!isMobile) {
      menu.removeAttribute("inert");
      menu.setAttribute("data-state", "open");
    } else if (isMenuClosed) {
      menu.setAttribute("inert", "");
      menu.setAttribute("data-state", "closed");
    }
  };

  // Fonction pour basculer l'état du menu
  const toggleMenu = (): void => {
    if (!menuBtn || !menu) return;

    const isExpanded: boolean =
      menuBtn.getAttribute("aria-expanded") === "true";
    const newState: boolean = !isExpanded;

    menuBtn.setAttribute("aria-expanded", String(newState));
    menu.setAttribute("data-state", newState ? "open" : "closed");
    page.classList.toggle("noscroll", !newState);

    if (window.innerWidth < lgBreakpoint) {
      if (newState) {
        menu.removeAttribute("inert");
      } else {
        menu.setAttribute("inert", "");
      }
    }
  };

  // Ajouter les event listeners si les éléments existent
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", toggleMenu);

    // Utiliser un debounce pour la gestion du resize
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleMenuState, 100);
    });

    // Initialisation
    handleMenuState();
  }

  // Gestion du logo
  const logoImage = document.querySelector(".logo-image") as HTMLElement | null;
  const siteHeader = document.getElementById(
    "site-header"
  ) as HTMLElement | null;

  // Fonction pour gérer le scroll
  const handleScroll = (): void => {
    if (!logoImage || !siteHeader) return;

    const originalWidth: number = 120;
    const smallerWidth: number = 75; // Taille réduite du logo
    const isScrolled: boolean = window.scrollY > 10;

    logoImage.setAttribute(
      "width",
      isScrolled ? smallerWidth.toString() : originalWidth.toString()
    );

    // Approche plus efficace pour les classes
    if (isScrolled) {
      siteHeader.classList.add("py-2");
      siteHeader.classList.remove("py-6");
    } else {
      siteHeader.classList.remove("py-2");
      siteHeader.classList.add("py-6");
    }
  };

  if (logoImage && siteHeader) {
    // Ajouter l'event listener
    window.addEventListener("scroll", handleScroll);

    // Exécuter une fois au chargement pour définir l'état initial
    handleScroll();
  }

  // Fonction de nettoyage pour Astro
  return () => {
    if (menuBtn) menuBtn.removeEventListener("click", toggleMenu);
    window.removeEventListener("resize", () => clearTimeout(resizeTimer));
    window.removeEventListener("scroll", handleScroll);
  };
});
