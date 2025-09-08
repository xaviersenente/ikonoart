/**
 * Gestion de la popup d'enquête pour les œuvres d'art
 * Fichier TypeScript externe pour [artwork_slug].astro
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
   * Attache tous les event listeners
   */
  private bindEvents(): void {
    // Nettoyer les anciens event listeners pour éviter les doublons
    this.unbindEvents();

    // Event listeners principaux
    this.elements.enquiryBtn?.addEventListener(
      "click",
      this.openPopup.bind(this)
    );
    this.elements.closeBtn?.addEventListener(
      "click",
      this.closePopup.bind(this)
    );

    // Fermer en cliquant sur l'overlay (en dehors du panel)
    this.elements.overlay?.addEventListener(
      "click",
      this.handleOverlayClick.bind(this)
    );

    // Empêcher la fermeture si on clique sur le panel
    this.elements.panel?.addEventListener(
      "click",
      this.handlePanelClick.bind(this)
    );

    // Gestion du formulaire
    this.elements.form?.addEventListener(
      "submit",
      this.handleFormSubmit.bind(this)
    );

    // Event listener pour la touche Escape
    document.addEventListener("keydown", this.escapeHandler);
  }

  /**
   * Supprime tous les event listeners
   */
  private unbindEvents(): void {
    this.elements.enquiryBtn?.removeEventListener(
      "click",
      this.openPopup.bind(this)
    );
    this.elements.closeBtn?.removeEventListener(
      "click",
      this.closePopup.bind(this)
    );
    this.elements.overlay?.removeEventListener(
      "click",
      this.handleOverlayClick.bind(this)
    );
    this.elements.panel?.removeEventListener(
      "click",
      this.handlePanelClick.bind(this)
    );
    this.elements.form?.removeEventListener(
      "submit",
      this.handleFormSubmit.bind(this)
    );
    document.removeEventListener("keydown", this.escapeHandler);
  }

  /**
   * Ouvre la popup avec animation
   */
  private openPopup(): void {
    if (this.state.isAnimating || this.state.isOpen) return;

    this.state.isAnimating = true;

    if (this.elements.popup && this.elements.panel && this.elements.overlay) {
      // Sauvegarder l'état actuel du scroll
      this.originalBodyOverflow = document.body.style.overflow;

      // Afficher la popup
      this.elements.popup.classList.remove("hidden");

      // Ajouter le flou à l'arrière-plan
      this.addBackgroundBlur();

      // Animation de l'overlay et du panel
      setTimeout(() => {
        this.elements.overlay?.classList.add(
          "backdrop-blur-(--my-backdrop-blur)"
        );
        this.elements.overlay?.classList.add("bg-black/30");
        this.elements.panel?.classList.remove("translate-x-full");

        // Empêcher le scroll du body
        document.body.style.overflow = "hidden";

        this.state.isOpen = true;
        this.state.isAnimating = false;
      }, 10);
    }
  }

  /**
   * Ferme la popup avec animation
   */
  private closePopup(): void {
    if (this.state.isAnimating || !this.state.isOpen) return;

    this.state.isAnimating = true;

    if (this.elements.popup && this.elements.panel && this.elements.overlay) {
      // Animation de fermeture
      this.elements.overlay.classList.remove(
        "backdrop-blur-(--my-backdrop-blur)"
      );
      this.elements.overlay.classList.remove("bg-black/30");
      this.elements.panel.classList.add("translate-x-full");

      // Supprimer le flou de l'arrière-plan
      this.removeBackgroundBlur();

      // Attendre la fin de l'animation avant de cacher
      setTimeout(() => {
        this.elements.popup?.classList.add("hidden");

        // Restaurer le scroll du body
        document.body.style.overflow = this.originalBodyOverflow;

        this.state.isOpen = false;
        this.state.isAnimating = false;
      }, 300);
    }
  }

  /**
   * Ajoute un effet de flou à l'arrière-plan
   */
  private addBackgroundBlur(): void {
    const mainContent = document.querySelector("main");
    const header = document.querySelector("header");
    const nav = document.querySelector("nav");

    [mainContent, header, nav].forEach((element) => {
      if (element) {
        element.classList.add("blur-sm", "transition-all", "duration-300");
      }
    });
  }

  /**
   * Supprime l'effet de flou de l'arrière-plan
   */
  private removeBackgroundBlur(): void {
    const mainContent = document.querySelector("main");
    const header = document.querySelector("header");
    const nav = document.querySelector("nav");

    [mainContent, header, nav].forEach((element) => {
      if (element) {
        element.classList.remove("blur-sm");
        // Garder les classes de transition pour une animation fluide
        setTimeout(() => {
          element.classList.remove("transition-all", "duration-300");
        }, 300);
      }
    });
  }

  /**
   * Gère le clic sur l'overlay (fermeture de la popup)
   */
  private handleOverlayClick(e: MouseEvent): void {
    // S'assurer qu'on clique bien sur l'overlay et pas sur le panel
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
   * Gère la soumission du formulaire avec gestion d'erreurs complète
   */
  private async handleFormSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault(); // Empêcher le rechargement de la page

    if (!this.elements.form || !this.elements.submitBtn) return;

    // Désactiver le bouton et afficher l'état de chargement
    this.setFormLoadingState(true);

    try {
      const form = this.elements.form;
      const formData = new FormData(form);
      // S'assurer que Netlify identifie le formulaire
      formData.append("form-name", "artwork-enquiry");

      // Envoyer le formulaire à Netlify
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (response.ok) {
        // Succès - fermer la popup et afficher le message
        this.closePopup();
        this.showSuccessMessage();
        this.resetForm();
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire:", error);
      this.showErrorMessage(
        "Une erreur est survenue lors de l'envoi. Veuillez réessayer."
      );
    } finally {
      this.setFormLoadingState(false);
    }
  }

  /**
   * Gère l'état de chargement du formulaire
   */
  private setFormLoadingState(isLoading: boolean): void {
    if (!this.elements.submitBtn || !this.elements.form) return;

    if (isLoading) {
      this.elements.submitBtn.disabled = true;
      this.elements.submitBtn.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="loading-spinner"></div>
          <span>Envoi en cours...</span>
        </div>
      `;
      this.elements.form.classList.add("form-loading");
    } else {
      this.elements.submitBtn.disabled = false;
      this.elements.submitBtn.textContent = "Envoyer la demande";
      this.elements.form.classList.remove("form-loading");
    }
  }

  /**
   * Remet à zéro le formulaire
   */
  private resetForm(): void {
    if (this.elements.form) {
      this.elements.form.reset();
    }
  }

  /**
   * Vérifie si le formulaire a été soumis avec succès (plus nécessaire maintenant)
   */
  private checkFormSubmissionStatus(): void {
    // Cette méthode n'est plus nécessaire car nous gérons tout en client
    // Mais on la garde pour la compatibilité si jamais il y a des liens directs
    const urlParams = new URLSearchParams(window.location.search);

    if (
      urlParams.get("form") === "artwork-enquiry" ||
      urlParams.get("success") === "true"
    ) {
      this.showSuccessMessage();

      // Nettoyer l'URL sans rechargement
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }

  /**
   * Affiche un message de succès amélioré
   */
  private showSuccessMessage(): void {
    const successMessage = document.createElement("div");
    successMessage.className = "status-message success";

    successMessage.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold">Message envoyé !</h4>
          <p class="text-sm opacity-90">Votre demande a été transmise avec succès. Nous vous répondrons dans les plus brefs délais.</p>
        </div>
        <button class="flex-shrink-0 ml-2 p-1 hover:bg-white/20 rounded" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(successMessage);

    // Animation d'entrée
    setTimeout(() => {
      successMessage.classList.add("success-slide");
    }, 100);

    // Suppression automatique après 6 secondes
    setTimeout(() => {
      this.hideMessage(successMessage);
    }, 6000);
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    const errorMessage = document.createElement("div");
    errorMessage.className = "status-message error";

    errorMessage.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold">Erreur d'envoi</h4>
          <p class="text-sm opacity-90">${message}</p>
        </div>
        <button class="flex-shrink-0 ml-2 p-1 hover:bg-white/20 rounded" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(errorMessage);

    // Animation d'entrée
    setTimeout(() => {
      errorMessage.classList.add("success-slide");
    }, 100);

    // Suppression automatique après 8 secondes (plus long pour les erreurs)
    setTimeout(() => {
      this.hideMessage(errorMessage);
    }, 8000);
  }

  /**
   * Cache un message avec animation
   */
  private hideMessage(messageElement: HTMLElement): void {
    messageElement.classList.add("success-slide-out");
    setTimeout(() => {
      messageElement.remove();
    }, 300);
  }

  /**
   * Nettoie les event listeners et restaure l'état
   */
  public destroy(): void {
    this.unbindEvents();

    // Restaurer le scroll si nécessaire
    if (this.state.isOpen) {
      document.body.style.overflow = this.originalBodyOverflow;
      this.removeBackgroundBlur();
    }
  }
}

// Instance globale
let enquiryPopupInstance: EnquiryPopup | null = null;

/**
 * Fonction d'initialisation principale
 */
function initializeEnquiryPopup(): void {
  // Détruire l'instance existante si elle existe
  if (enquiryPopupInstance) {
    enquiryPopupInstance.destroy();
  }

  // Créer une nouvelle instance
  enquiryPopupInstance = new EnquiryPopup();
  enquiryPopupInstance.init();
}

/**
 * Fonction de nettoyage
 */
function cleanupEnquiryPopup(): void {
  if (enquiryPopupInstance) {
    enquiryPopupInstance.destroy();
    enquiryPopupInstance = null;
  }
}

// Export pour utilisation dans d'autres modules
export { EnquiryPopup, initializeEnquiryPopup, cleanupEnquiryPopup };

// Auto-initialisation pour le navigateur
if (typeof window !== "undefined") {
  // Initialisation au chargement de la page
  document.addEventListener("DOMContentLoaded", initializeEnquiryPopup);

  // Réinitialisation lors de la navigation côté client d'Astro
  document.addEventListener("astro:page-load", initializeEnquiryPopup);

  // Nettoyage lors du départ de la page
  document.addEventListener("astro:before-preparation", cleanupEnquiryPopup);
}
