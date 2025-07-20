// src/scripts/splide-manager.js
import Splide, { LOOP, FADE } from "@splidejs/splide";
import "@splidejs/splide/css";

class SplideManager {
  constructor() {
    this.instances = [];
    this.intersectionObserver = null;
    this.lazyCarousels = new Set();
    this.init();
  }

  init() {
    document.addEventListener("astro:page-load", () => this.initCarousels());
    document.addEventListener("astro:before-preparation", () =>
      this.destroyAll()
    );

    // Initialiser l'Intersection Observer pour le lazy loading
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    if (!("IntersectionObserver" in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.lazyCarousels.has(entry.target)) {
            this.lazyCarousels.delete(entry.target);
            this.initSingleCarousel(entry.target);
            this.intersectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px 0px", // Charger 100px avant que l'élément soit visible
        threshold: 0.1,
      }
    );
  }

  destroyAll() {
    this.instances.forEach((instance) => {
      if (instance && typeof instance.destroy === "function") {
        instance.destroy();
      }
    });
    this.instances = [];
    this.lazyCarousels.clear();
  }

  // Configuration commune pour tous les carousels
  getBaseConfig() {
    return {
      // Performance optimizations
      useScroll: false, // Désactive le scroll par défaut pour de meilleures perfs
      waitForTransition: false, // Améliore la réactivité
      releaseWheel: true, // Libère la roue après l'interaction

      // Accessibility
      keyboard: true,
      focus: "center",

      // Responsive behavior
      updateOnMove: true,

      // Lazy loading des slides
      lazyLoad: "nearby", // Charge seulement les slides proches

      // Classes personnalisées
      classes: {
        prev: "splide__arrow--prev custom-prev",
        next: "splide__arrow--next custom-next",
        page: "splide__pagination__page custom-page",
      },
    };
  }

  // Configuration spécifique pour carousel home
  getHomeCarouselConfig() {
    return {
      ...this.getBaseConfig(),
      type: LOOP,
      perPage: 4,
      perMove: 1,
      focus: "left",
      pagination: false,
      arrows: true,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      autoplay: false,
      gap: "2rem",

      // Breakpoints optimisés
      breakpoints: {
        1280: {
          perPage: 3,
          gap: "1.5rem",
          arrows: true,
        },
        1024: {
          perPage: 2,
          gap: "1rem",
          arrows: false,
          pagination: true,
        },
        768: {
          perPage: 1,
          gap: "1rem",
          arrows: false,
          pagination: true,
          // padding: { left: "1rem", right: "1rem" },
        },
      },

      // Wheel options pour un meilleur contrôle
      wheel: true,
      wheelMinThreshold: 40,
      wheelSleep: 100,

      // Drag options
      drag: true,
      dragMinThreshold: {
        mouse: 4,
        touch: 10,
      },
      flickMaxPages: 3,
    };
  }

  // Configuration spécifique pour carousel fade
  getFadeCarouselConfig() {
    return {
      ...this.getBaseConfig(),
      type: FADE,
      perPage: 1,
      rewind: true,
      rewindSpeed: 1000,
      speed: 800,
      easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      autoplay: true,
      interval: 5000, // Augmenté à 5 secondes
      pauseOnHover: true,
      pauseOnFocus: true,
      resetProgress: false, // Garde la progression lors de la pause

      // Intersection pour autoplay intelligent
      intersection: {
        inView: {
          autoplay: true,
        },
        outView: {
          autoplay: false,
        },
      },

      // Preload pour un fade plus fluide
      preloadPages: 1,

      // Pagination personnalisée pour les fade carousels
      pagination: true,
      arrows: false,

      // Animation CSS custom pour le fade
      classes: {
        ...this.getBaseConfig().classes,
        slide: "splide__slide fade-slide",
      },
    };
  }

  // Configuration pour carousel produit/artwork
  getProductCarouselConfig() {
    return {
      ...this.getBaseConfig(),
      type: "slide",
      perPage: 3,
      perMove: 1,
      pagination: false,
      arrows: true,
      rewind: true,
      speed: 600,
      gap: "1.5rem",
      autoplay: false,

      // Optimisations pour les images de produits
      lazyLoad: "sequential", // Charge séquentiellement pour les images haute qualité
      preloadPages: 2,

      breakpoints: {
        1024: {
          perPage: 2,
          arrows: false,
          pagination: true,
        },
        768: {
          perPage: 1,
          pagination: true,
          padding: { left: "2rem", right: "2rem" },
        },
      },

      // Focus pour l'accessibilité des produits
      focus: "center",
      trimSpace: false,
    };
  }

  initSingleCarousel(element) {
    let config;
    let instance;

    // Déterminer la configuration selon la classe
    if (element.classList.contains("home-carousel")) {
      config = this.getHomeCarouselConfig();
    } else if (element.classList.contains("fade-carousel")) {
      config = this.getFadeCarouselConfig();
    } else if (element.classList.contains("product-carousel")) {
      config = this.getProductCarouselConfig();
    } else {
      // Configuration par défaut
      config = this.getBaseConfig();
    }

    try {
      instance = new Splide(element, config);

      // Événements personnalisés
      this.setupCarouselEvents(instance);

      instance.mount();
      this.instances.push(instance);

      // Log pour debug (à retirer en production)
      console.log(`Carousel ${element.className} initialisé avec succès`);
    } catch (error) {
      console.error("Erreur lors de l'initialisation du carousel:", error);
    }
  }

  setupCarouselEvents(instance) {
    // Événement pour la performance - pause l'autoplay si tab en arrière-plan
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        instance.Components.Autoplay?.pause();
      } else {
        instance.Components.Autoplay?.play();
      }
    });

    // Événement pour l'accessibilité
    instance.on("move", (newIndex) => {
      // Annonce le changement de slide pour les lecteurs d'écran
      const activeSlide = instance.Components.Slides.getAt(newIndex);
      if (activeSlide && activeSlide.slide) {
        activeSlide.slide.focus();
      }
    });

    // Préchargement intelligent des images
    instance.on("moved", (newIndex) => {
      this.preloadNearbyImages(instance, newIndex);
    });

    // Gestion des erreurs
    instance.on("overflow", (isOverflow) => {
      // Cache les flèches si pas assez de contenu
      const arrows = instance.root.querySelectorAll(".splide__arrow");
      arrows.forEach((arrow) => {
        arrow.style.display = isOverflow ? "block" : "none";
      });
    });
  }

  preloadNearbyImages(instance, currentIndex) {
    const slides = instance.Components.Slides;
    const totalSlides = slides.length;

    // Précharge les 2 slides suivantes
    for (let i = 1; i <= 2; i++) {
      const nextIndex = (currentIndex + i) % totalSlides;
      const slide = slides.getAt(nextIndex);

      if (slide) {
        const images = slide.slide.querySelectorAll("img[data-src]");
        images.forEach((img) => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
          }
        });
      }
    }
  }

  initCarousels() {
    this.destroyAll();

    // Sélectionner tous les carousels
    const allCarousels = document.querySelectorAll(".splide");

    allCarousels.forEach((element) => {
      // Déterminer si le carousel doit être chargé immédiatement ou en lazy
      const shouldLazyLoad = this.shouldLazyLoadCarousel(element);

      if (shouldLazyLoad && this.intersectionObserver) {
        this.lazyCarousels.add(element);
        this.intersectionObserver.observe(element);
      } else {
        this.initSingleCarousel(element);
      }
    });
  }

  shouldLazyLoadCarousel(element) {
    // Les carousels hero ne doivent pas être lazy loadés
    if (element.classList.contains("fade-carousel")) {
      return false;
    }

    // Lazy load si le carousel n'est pas dans le viewport initial
    const rect = element.getBoundingClientRect();
    return rect.top > window.innerHeight;
  }

  // Méthode publique pour ajouter un carousel dynamiquement
  addCarousel(element, type = "default") {
    element.classList.add(type + "-carousel");
    this.initSingleCarousel(element);
  }

  // Méthode publique pour détruire un carousel spécifique
  destroyCarousel(element) {
    const index = this.instances.findIndex(
      (instance) => instance.root === element
    );

    if (index !== -1) {
      this.instances[index].destroy();
      this.instances.splice(index, 1);
    }
  }
}

// Initialiser le gestionnaire
const splideManager = new SplideManager();

// Export pour utilisation dans d'autres modules
export default splideManager;
