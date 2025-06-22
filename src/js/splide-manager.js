// src/scripts/splide-manager.js
import Splide, { LOOP } from "@splidejs/splide";
import "@splidejs/splide/css";

class SplideManager {
  constructor() {
    this.instances = [];
    this.init();
  }

  init() {
    document.addEventListener("astro:page-load", () => this.initCarousels());
    document.addEventListener("astro:before-preparation", () =>
      this.destroyAll()
    );
  }

  destroyAll() {
    this.instances.forEach((instance) => {
      if (instance && typeof instance.destroy === "function") {
        instance.destroy();
      }
    });
    this.instances = [];
  }

  initCarousels() {
    this.destroyAll();

    // Configuration pour les carousels de la page d'accueil (4 items par page)
    const homeCarousels = document.querySelectorAll(".splide.home-carousel");
    homeCarousels.forEach((element) => {
      const instance = new Splide(element, {
        type: LOOP,
        perPage: 4,
        perMove: 1,
        pagination: false,
        rewind: true,
        rewindSpeed: 3000,
        speed: 600,
        autoplay: false,
        gap: "2rem",
        breakpoints: {
          1024: { perPage: 2 },
          768: { perPage: 1 },
        },
      });
      instance.mount();
      this.instances.push(instance);
    });

    // Configuration pour les carousels fade (images hero, galeries, etc.)
    const fadeCarousels = document.querySelectorAll(".splide.fade-carousel");
    fadeCarousels.forEach((element) => {
      const instance = new Splide(element, {
        perPage: 1,
        type: "fade",
        rewind: true,
        rewindSpeed: 3000,
        speed: 600,
        autoplay: true,
        interval: 4000, // 4 secondes entre chaque slide
        pauseOnHover: true,
        pauseOnFocus: true,
      });
      instance.mount();
      this.instances.push(instance);
    });

    // Configuration pour les carousels produits/services (sans fade)
    const productCarousels = document.querySelectorAll(
      ".splide.product-carousel"
    );
    productCarousels.forEach((element) => {
      const instance = new Splide(element, {
        type: LOOP,
        perPage: 3,
        perMove: 1,
        pagination: false,
        rewind: true,
        speed: 600,
        autoplay: false,
        gap: "1.5rem",
        breakpoints: {
          1024: { perPage: 2 },
          768: { perPage: 1 },
        },
      });
      instance.mount();
      this.instances.push(instance);
    });

    // Configuration pour les carousels de témoignages
    const testimonialCarousels = document.querySelectorAll(
      ".splide.testimonial-carousel"
    );
    testimonialCarousels.forEach((element) => {
      const instance = new Splide(element, {
        perPage: 1,
        rewind: true,
        speed: 800,
        autoplay: true,
        interval: 5000,
        pauseOnHover: true,
        pagination: true,
        arrows: false,
      });
      instance.mount();
      this.instances.push(instance);
    });
  }
}

// Initialiser le gestionnaire
new SplideManager();
