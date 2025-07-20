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
      page.classList.remove("noscroll");
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

    // Empêcher le scroll uniquement sur mobile quand le menu est ouvert
    if (window.innerWidth < lgBreakpoint) {
      page.classList.toggle("noscroll", newState);

      if (newState) {
        menu.removeAttribute("inert");
      } else {
        menu.setAttribute("inert", "");
      }
    }
  };

  // Fermer le menu au clic sur un lien (mobile seulement)
  const closeMenuOnLinkClick = (): void => {
    if (!menuBtn || !menu) return;

    if (window.innerWidth < lgBreakpoint) {
      menuBtn.setAttribute("aria-expanded", "false");
      menu.setAttribute("data-state", "closed");
      menu.setAttribute("inert", "");
      page.classList.remove("noscroll");
    }
  };

  // Ajouter les event listeners si les éléments existent
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", toggleMenu);

    // Fermer le menu au clic sur les liens de navigation
    const navLinks = menu.querySelectorAll("a");
    navLinks.forEach((link) => {
      link.addEventListener("click", closeMenuOnLinkClick);
    });

    // Utiliser un debounce pour la gestion du resize
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleMenuState, 100);
    });

    // Fermer le menu avec la touche Escape
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuBtn.getAttribute("aria-expanded") === "true"
      ) {
        toggleMenu();
      }
    });

    // Initialisation
    handleMenuState();
  }

  // Gestion du logo - préserver le comportement original avec adaptation mobile
  const logoImage = document.querySelector(".logo-image") as HTMLElement | null;
  const siteHeader = document.getElementById(
    "site-header"
  ) as HTMLElement | null;

  // Fonction pour gérer le scroll - comportement original préservé
  const handleScroll = (): void => {
    if (!logoImage || !siteHeader) return;

    const isMobile: boolean = window.innerWidth < lgBreakpoint;
    const originalWidth: number = 150;
    const smallerWidth: number = 75;
    const mobileWidth: number = 80; // Taille fixe pour mobile
    const isScrolled: boolean = window.scrollY > 10;

    if (isMobile) {
      // Sur mobile : taille fixe, pas de changement au scroll
      logoImage.setAttribute("width", mobileWidth.toString());
    } else {
      // Sur desktop : comportement original avec transitions fluides
      logoImage.setAttribute(
        "width",
        isScrolled ? smallerWidth.toString() : originalWidth.toString()
      );
    }

    // Gérer le padding du header (pour tous les écrans)
    if (isScrolled) {
      siteHeader.classList.add("py-2");
      siteHeader.classList.remove("py-4");
    } else {
      siteHeader.classList.remove("py-2");
      siteHeader.classList.add("py-4");
    }
  };

  // Fonction pour gérer le redimensionnement
  const handleResize = (): void => {
    // Réappliquer l'état de scroll après redimensionnement
    handleScroll();
  };

  if (logoImage && siteHeader) {
    // Ajouter les event listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 100);
    });

    // Exécuter une fois au chargement pour définir l'état initial
    handleScroll();
  }

  // Fonction de nettoyage pour Astro
  return () => {
    if (menuBtn) {
      menuBtn.removeEventListener("click", toggleMenu);
      const navLinks = menu?.querySelectorAll("a");
      navLinks?.forEach((link) => {
        link.removeEventListener("click", closeMenuOnLinkClick);
      });
    }
    window.removeEventListener("resize", () => clearTimeout(resizeTimer));
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("keydown", (event) => {
      if (event.key === "Escape") toggleMenu();
    });
  };
});
