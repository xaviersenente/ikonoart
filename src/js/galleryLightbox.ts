// Visionneuse plein écran pour les grilles de galerie.
//
// Même cycle de vie que le gestionnaire de carrousels : initialisation sur
// `astro:page-load`, démontage sur `astro:before-swap`. Sans ça, les écouteurs
// s'empilent à chaque navigation du ClientRouter.

interface GalleryEntry {
  full: string;
  alt: string;
  trigger: HTMLElement;
}

class GalleryLightbox {
  private root: HTMLElement | null = null;
  private image: HTMLImageElement | null = null;
  private counter: HTMLElement | null = null;
  private entries: GalleryEntry[] = [];
  private index = 0;
  private lastFocused: HTMLElement | null = null;
  private previousOverflow = "";
  private cleanups: Array<() => void> = [];

  mount(): void {
    this.root = document.getElementById("gallery-lightbox");
    const grid = document.querySelector<HTMLElement>("[data-gallery]");
    if (!this.root || !grid) return;

    this.image = this.root.querySelector("[data-lightbox-image]");
    this.counter = this.root.querySelector("[data-lightbox-counter]");

    this.entries = [
      ...grid.querySelectorAll<HTMLElement>("[data-gallery-item]"),
    ].map((trigger) => ({
      full: trigger.dataset.full ?? "",
      alt: trigger.dataset.alt ?? "",
      trigger,
    }));

    if (this.entries.length === 0) return;

    // Délégation : un seul écouteur pour toute la grille.
    this.on(grid, "click", (event) => {
      const trigger = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-gallery-item]"
      );
      if (!trigger) return;
      this.open(Number(trigger.dataset.index ?? 0));
    });

    this.bind("[data-lightbox-close]", () => this.close());
    this.bind("[data-lightbox-overlay]", () => this.close());
    this.bind("[data-lightbox-prev]", () => this.go(-1));
    this.bind("[data-lightbox-next]", () => this.go(1));

    this.on(document, "keydown", (event) => {
      if (this.root?.classList.contains("hidden")) return;
      const key = (event as KeyboardEvent).key;
      if (key === "Escape") this.close();
      if (key === "ArrowLeft") this.go(-1);
      if (key === "ArrowRight") this.go(1);
    });
  }

  private bind(selector: string, handler: () => void): void {
    const el = this.root?.querySelector<HTMLElement>(selector);
    if (el) this.on(el, "click", handler);
  }

  private on(
    target: EventTarget,
    type: string,
    handler: (event: Event) => void
  ): void {
    target.addEventListener(type, handler);
    this.cleanups.push(() => target.removeEventListener(type, handler));
  }

  private open(index: number): void {
    if (!this.root) return;
    this.lastFocused = document.activeElement as HTMLElement;

    // Verrouille le défilement de la page pendant la consultation.
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    this.root.classList.remove("hidden");
    this.show(index);

    this.root
      .querySelector<HTMLElement>("[data-lightbox-close]")
      ?.focus({ preventScroll: true });
  }

  private close(): void {
    if (!this.root) return;
    this.root.classList.add("hidden");
    document.body.style.overflow = this.previousOverflow;
    // Rend le focus à la vignette d'où l'on vient.
    this.lastFocused?.focus({ preventScroll: true });
  }

  private go(step: number): void {
    const total = this.entries.length;
    this.show((this.index + step + total) % total);
  }

  private show(index: number): void {
    const entry = this.entries[index];
    if (!entry || !this.image) return;

    this.index = index;
    // Masque le temps du chargement pour éviter d'afficher l'image précédente
    // étirée aux dimensions de la nouvelle.
    this.image.style.opacity = "0";
    this.image.onload = () => {
      if (this.image) this.image.style.opacity = "1";
    };
    this.image.src = entry.full;
    this.image.alt = entry.alt;

    if (this.counter) {
      this.counter.textContent = `${index + 1} / ${this.entries.length}`;
    }

    this.preloadNeighbours();
  }

  // Précharge les images adjacentes pour que la navigation soit immédiate.
  private preloadNeighbours(): void {
    const total = this.entries.length;
    for (const step of [1, -1]) {
      const neighbour = this.entries[(this.index + step + total) % total];
      if (neighbour) new Image().src = neighbour.full;
    }
  }

  destroy(): void {
    // Ne jamais laisser le body verrouillé si on quitte la page ouverte.
    if (this.root && !this.root.classList.contains("hidden")) {
      document.body.style.overflow = this.previousOverflow;
    }
    this.cleanups.forEach((off) => off());
    this.cleanups = [];
    this.entries = [];
    this.root = null;
  }
}

let current: GalleryLightbox | null = null;

const setup = () => {
  current?.destroy();
  current = new GalleryLightbox();
  current.mount();
};

document.addEventListener("astro:page-load", setup);
document.addEventListener("astro:before-swap", () => {
  current?.destroy();
  current = null;
});
