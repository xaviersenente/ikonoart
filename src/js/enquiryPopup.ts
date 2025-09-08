/**
 * Gestion de la popup d'enquête pour les œuvres d'art
 * Version corrigée pour Netlify Forms
 */

interface PopupElements {
  enquiryBtn: HTMLButtonElement | null;
  popup: HTMLDivElement | null;
  closeBtn: HTMLButtonElement | null;
  panel: HTMLDivElement | null;
  overlay: HTMLDivElement | null;
  form: HTMLFormElement | null;
  submitBtn: HTMLButtonElement | null;
}

interface PopupState {
  isOpen: boolean;
  isAnimating: boolean;
}

class EnquiryPopup {
  private elements: PopupElements;
  private state: PopupState;
  private escapeHandler: (e: KeyboardEvent) => void;
  private originalBodyOverflow: string;

  constructor() {
    this.elements = {
      enquiryBtn: null,
      popup: null,
      closeBtn: null,
      panel: null,
      overlay: null,
      form: null,
      submitBtn: null,
    };

    this.state = {
      isOpen: false,
      isAnimating: false,
    };

    this.originalBodyOverflow = "";
    this.escapeHandler = this.handleEscapeKey.bind(this);
  }

  /**
   * Initialise la popup et ses event listeners
   */
  public init(): void {
    this.getElements();

    if (
      !this.elements.enquiryBtn ||
      !this.elements.popup ||
      !this.elements.closeBtn
    ) {
      console.warn("EnquiryPopup: Éléments requis non trouvés");
      return;
    }

    this.bindEvents();
    this.checkFormSubmissionStatus();
  }

  /**
   * Récupère tous les éléments DOM nécessaires
   */
  private getElements(): void {
    this.elements.enquiryBtn = document.getElementById(
      "enquiry-btn"
    ) as HTMLButtonElement;
    this.elements.popup = document.getElementById(
      "enquiry-popup"
    ) as HTMLDivElement;
    this.elements.closeBtn = document.getElementById(
      "close-popup"
    ) as HTMLButtonElement;
    this.elements.overlay = this.elements.popup?.querySelector(
      ".absolute.inset-0"
    ) as HTMLDivElement;
    this.elements.panel = this.elements.popup?.querySelector(
      ".absolute.top-0.right-0"
    ) as HTMLDivElement;
    this.elements.form = this.elements.popup?.querySelector(
      "form"
    ) as HTMLFormElement;
    this.elements.submitBtn = document.getElementById(
      "submit-btn"
    ) as HTMLButtonElement;
  }

  /**
   * Attache les event listeners
   */
  private bindEvents(): void {
    if (this.elements.enquiryBtn) {
      this.elements.enquiryBtn.addEventListener("click", () =>
        this.openPopup()
      );
    }

    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener("click", () => this.closePopup());
    }

    if (this.elements.overlay) {
      this.elements.overlay.addEventListener("click", (e) =>
        this.handleOverlayClick(e)
      );
    }

    if (this.elements.panel) {
      this.elements.panel.addEventListener("click", (e) =>
        this.handlePanelClick(e)
      );
    }

    // Formulaire - MODIFICATION IMPORTANTE : Ne plus intercepter la soumission
    if (this.elements.form) {
      this.elements.form.addEventListener("submit", (e) =>
        this.handleFormSubmit(e)
      );
    }

    // Escape key
    document.addEventListener("keydown", this.escapeHandler);
  }

  /**
   * Ouvre la popup
   */
  private openPopup(): void {
    if (this.state.isAnimating || this.state.isOpen) return;

    this.state.isAnimating = true;
    this.state.isOpen = true;

    if (this.elements.popup && this.elements.panel) {
      // Sauvegarder et désactiver le scroll
      this.originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Afficher la popup
      this.elements.popup.classList.remove("hidden");

      // Déclencher l'animation après un petit délai
      setTimeout(() => {
        if (this.elements.panel) {
          this.elements.panel.classList.remove("translate-x-full");
        }
        this.state.isAnimating = false;
      }, 10);

      // Appliquer le flou au contenu principal
      this.applyBlur();
    }
  }

  /**
   * Ferme la popup
   */
  private closePopup(): void {
    if (this.state.isAnimating || !this.state.isOpen) return;

    this.state.isAnimating = true;
    this.state.isOpen = false;

    if (this.elements.popup && this.elements.panel) {
      // Animation de sortie
      this.elements.panel.classList.add("translate-x-full");

      // Cacher après l'animation
      setTimeout(() => {
        if (this.elements.popup) {
          this.elements.popup.classList.add("hidden");
        }
        this.state.isAnimating = false;
      }, 300);

      // Restaurer le scroll
      document.body.style.overflow = this.originalBodyOverflow;

      // Enlever le flou
      this.removeBlur();
    }
  }

  /**
   * Applique un flou au contenu principal
   */
  private applyBlur(): void {
    const mainContent = document.querySelector("main");
    const header = document.querySelector("header");
    const nav = document.querySelector("nav");

    [mainContent, header, nav].forEach((element) => {
      if (element) {
        element.classList.add("transition-all", "duration-300", "blur-sm");
      }
    });
  }

  /**
   * Supprime le flou du contenu principal
   */
  private removeBlur(): void {
    const mainContent = document.querySelector("main");
    const header = document.querySelector("header");
    const nav = document.querySelector("nav");

    [mainContent, header, nav].forEach((element) => {
      if (element) {
        element.classList.remove("blur-sm");
        setTimeout(() => {
          element.classList.remove("transition-all", "duration-300");
        }, 300);
      }
    });
  }

  /**
   * Gère le clic sur l'overlay
   */
  private handleOverlayClick(e: MouseEvent): void {
    if (e.target === this.elements.overlay) {
      this.closePopup();
    }
  }

  /**
   * Empêche la propagation du clic sur le panel
   */
  private handlePanelClick(e: MouseEvent): void {
    e.stopPropagation();
  }

  /**
   * Gère la touche Escape
   */
  private handleEscapeKey(e: KeyboardEvent): void {
    if (e.key === "Escape" && this.state.isOpen) {
      this.closePopup();
    }
  }

  /**
   * Gère la soumission du formulaire - VERSION CORRIGÉE
   */
  private handleFormSubmit(e: SubmitEvent): void {
    // NE PLUS faire e.preventDefault() !
    // Laisser Netlify gérer la soumission naturellement

    if (!this.elements.form || !this.elements.submitBtn) return;

    // Juste changer l'état du bouton pour feedback utilisateur
    this.setFormLoadingState(true);

    // Le formulaire va se soumettre naturellement vers Netlify
    // La page va se recharger et Netlify va traiter le formulaire
  }

  /**
   * Gère l'état de chargement du formulaire
   */
  private setFormLoadingState(isLoading: boolean): void {
    if (!this.elements.submitBtn) return;

    if (isLoading) {
      this.elements.submitBtn.disabled = true;
      this.elements.submitBtn.innerHTML = `
        <div class="flex items-center justify-center gap-2">
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Envoi en cours...</span>
        </div>
      `;
    } else {
      this.elements.submitBtn.disabled = false;
      this.elements.submitBtn.textContent = "Envoyer la demande";
    }
  }

  /**
   * Vérifie le statut de soumission du formulaire
   */
  private checkFormSubmissionStatus(): void {
    const urlParams = new URLSearchParams(window.location.search);

    // Netlify redirige vers ?success=true ou similar après soumission
    if (urlParams.has("success") || urlParams.has("form")) {
      this.showSuccessMessage();

      // Nettoyer l'URL
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }

  /**
   * Affiche un message de succès
   */
  private showSuccessMessage(): void {
    const successMessage = document.createElement("div");
    successMessage.className = `
      fixed top-4 right-4 z-50 max-w-md
      bg-green-500 text-white p-4 rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      translate-x-full opacity-0
    `;

    successMessage.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-sm">Message envoyé !</h4>
          <p class="text-xs opacity-90 mt-1">Votre demande a été transmise avec succès.</p>
        </div>
        <button class="flex-shrink-0 text-white/80 hover:text-white ml-2" 
                onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(successMessage);

    // Animation d'entrée
    setTimeout(() => {
      successMessage.classList.remove("translate-x-full", "opacity-0");
    }, 10);

    // Suppression automatique
    setTimeout(() => {
      if (successMessage.parentElement) {
        successMessage.classList.add("translate-x-full", "opacity-0");
        setTimeout(() => {
          successMessage.remove();
        }, 300);
      }
    }, 5000);
  }

  /**
   * Nettoie les event listeners
   */
  public destroy(): void {
    document.removeEventListener("keydown", this.escapeHandler);
    document.body.style.overflow = this.originalBodyOverflow;
  }
}

// Initialisation
let popup: EnquiryPopup | null = null;

function initializeEnquiryPopup(): void {
  // Détruire l'instance précédente si elle existe
  if (popup) {
    popup.destroy();
  }

  // Créer une nouvelle instance
  popup = new EnquiryPopup();
  popup.init();
}

// Initialisation au chargement
document.addEventListener("DOMContentLoaded", initializeEnquiryPopup);

// Réinitialisation pour Astro (navigation côté client)
document.addEventListener("astro:page-load", initializeEnquiryPopup);

// Nettoyage avant changement de page
document.addEventListener("astro:before-preparation", () => {
  if (popup) {
    popup.destroy();
  }
});
