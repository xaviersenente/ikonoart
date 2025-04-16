document.addEventListener("DOMContentLoaded", () => {
  // Récupération de l'élément du sélecteur de langue
  const languagePicker = document.getElementById("language-picker");

  if (languagePicker) {
    // Ajouter un écouteur d'événement sur le changement de valeur du sélecteur
    languagePicker.addEventListener("change", (event) => {
      // Récupération de la langue sélectionnée dans le menu déroulant
      const selectedLocale = event.target.value;
      // Récupération du chemin actuel de la page (ex: "/fr/page-exemple")
      const currentPath = window.location.pathname;
      // Suppression du préfixe de langue actuel dans l'URL (ex: "/fr/page-exemple" devient "/page-exemple")
      const pathWithoutLocale = currentPath.replace(/^\/[^/]+/, "");
      // Construction du nouvel URL en ajoutant la langue sélectionnée en préfixe (ex: "/en/page-exemple")
      const newPath = `/${selectedLocale}${pathWithoutLocale}`;
      // Redirection de l'utilisateur vers la nouvelle URL
      window.location.href = newPath;
    });
  }
});
