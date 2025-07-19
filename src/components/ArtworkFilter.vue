<script setup>
  import { ref, computed, onMounted } from "vue";
  import ArtworkCard from "./ArtworkCard.vue";

  const props = defineProps({
    allArtworks: {
      type: Array,
      required: true,
    },
    artists: {
      type: Array,
      required: true,
    },
    currentLocale: {
      type: String,
      required: true,
    },
    translations: {
      type: Object,
      required: true,
    },
  });

  // État local
  const filteredArtworks = ref([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(40);
  const totalPages = ref(1);

  // Filtres
  const filters = ref({
    artist: "",
    medium: "",
    subject: "",
    limited_edition: false,
  });

  // Listes pour les filtres (à remplir dynamiquement)
  const mediums = ref([]);
  const subjects = ref([]);

  // Fonction pour mélanger un tableau (algorithme Fisher-Yates)
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Fonction pour trier les œuvres par highlight puis aléatoirement
  function sortArtworksByHighlight(artworks) {
    // Séparer les œuvres highlighted et non-highlighted
    const highlighted = artworks.filter(
      (artwork) => artwork.highlight === true
    );
    const regular = artworks.filter((artwork) => artwork.highlight !== true);

    // Mélanger chaque groupe aléatoirement
    const shuffledHighlighted = shuffleArray(highlighted);
    const shuffledRegular = shuffleArray(regular);

    // Retourner les highlighted en premier, puis les regular
    return [...shuffledHighlighted, ...shuffledRegular];
  }

  // Calcul des œuvres visibles avec pagination
  const visibleArtworks = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage.value;
    const endIndex = startIndex + itemsPerPage.value;
    return filteredArtworks.value.slice(startIndex, endIndex);
  });

  // Initialisation des données
  onMounted(() => {
    // Remplir les listes de filtres avec des valeurs uniques
    const uniqueMediums = new Set();
    const uniqueSubjects = new Set();

    props.allArtworks.forEach((artwork) => {
      if (artwork.medium) uniqueMediums.add(artwork.medium);
      if (artwork.subject) uniqueSubjects.add(artwork.subject);
    });

    mediums.value = Array.from(uniqueMediums).sort();
    subjects.value = Array.from(uniqueSubjects).sort();

    // Initialiser les œuvres filtrées
    applyFilters();
  });

  // Appliquer les filtres
  function applyFilters() {
    // Filtrer les œuvres en fonction des critères
    let filtered = props.allArtworks.filter((artwork) => {
      // Filtre par artiste
      if (
        filters.value.artist &&
        (!artwork.artist || artwork.artist._id !== filters.value.artist)
      ) {
        return false;
      }

      // Filtre par medium
      if (filters.value.medium && artwork.medium !== filters.value.medium) {
        return false;
      }

      // Filtre par sujet
      if (filters.value.subject && artwork.subject !== filters.value.subject) {
        return false;
      }

      // Filtre par édition limitée
      if (filters.value.limited_edition && !artwork.limited_edition) {
        return false;
      }

      return true;
    });

    // Trier les œuvres filtrées par highlight puis aléatoirement
    filteredArtworks.value = sortArtworksByHighlight(filtered);

    // Mettre à jour la pagination
    totalPages.value = Math.ceil(
      filteredArtworks.value.length / itemsPerPage.value
    );
    currentPage.value = 1; // Retour à la première page après filtrage
  }

  // Fonction pour changer de page
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  }

  // Réinitialiser les filtres
  function resetFilters() {
    filters.value = {
      artist: "",
      medium: "",
      subject: "",
      limited_edition: false,
    };
    applyFilters();
  }
</script>

<template>
  <div>
    <!-- Formulaire de filtrage -->
    <form
      @submit.prevent="applyFilters"
      class="filter-form border-b border-gray-300 py-8 mb-8"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <!-- Filtre par artiste -->
        <div class="form-group flex items-center gap-4">
          <label
            for="artist"
            class="block text-sm font-medium text-gray-500 mb-1"
          >
            {{ translations.filters.artist }}
          </label>
          <select
            id="artist"
            v-model="filters.artist"
            class="w-full p-2 border-b border-gray-300"
          >
            <option value="">{{ translations.filters.all }}</option>
            <option
              v-for="artist in artists"
              :key="artist._id"
              :value="artist._id"
            >
              {{ artist.name }}
            </option>
          </select>
        </div>

        <!-- Filtre par medium -->
        <div class="form-group flex items-center gap-4">
          <label
            for="medium"
            class="block text-sm font-medium text-gray-500 mb-1"
          >
            {{ translations.filters.medium }}
          </label>
          <select
            id="medium"
            v-model="filters.medium"
            class="w-full p-2 border-b border-gray-300"
          >
            <option value="">{{ translations.filters.all }}</option>
            <option v-for="medium in mediums" :key="medium" :value="medium">
              {{ medium }}
            </option>
          </select>
        </div>

        <!-- Filtre par sujet -->
        <div class="form-group flex items-center gap-4">
          <label
            for="subject"
            class="block text-sm font-medium text-gray-500 mb-1"
          >
            {{ translations.filters.subject }}
          </label>
          <select
            id="subject"
            v-model="filters.subject"
            class="w-full p-2 border-b border-gray-300"
          >
            <option value="">{{ translations.filters.all }}</option>
            <option v-for="subject in subjects" :key="subject" :value="subject">
              {{ subject }}
            </option>
          </select>
        </div>

        <!-- Filtre par édition limitée -->
        <div class="form-group flex items-center">
          <input
            type="checkbox"
            id="limitedEdition"
            v-model="filters.limited_edition"
            class="mr-2 h-5 w-5"
          />
          <label for="limitedEdition" class="text-sm font-medium text-gray-700">
            {{ translations.filters.limitedEdition }}
          </label>
        </div>
      </div>

      <div class="flex justify-end mt-4 space-x-2">
        <button
          type="button"
          @click="resetFilters"
          class="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {{ translations.filters.reset }}
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-black"
        >
          {{ translations.filters.apply }}
        </button>
      </div>
    </form>

    <!-- Résultats -->
    <div class="results-container">
      <p class="text-gray-600 mb-4">
        {{ filteredArtworks.length }} {{ translations.results.found }}
      </p>

      <!-- Grille d'œuvres -->
      <div class="card-grid">
        <ArtworkCard
          v-for="artwork in visibleArtworks"
          :key="artwork._id"
          :artwork="artwork"
          :currentLocale="props.currentLocale"
        />
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="pagination flex justify-center mt-8 space-x-1"
      >
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-1 border border-gray-900 disabled:opacity-50"
        >
          &laquo;
        </button>

        <template v-for="page in totalPages" :key="page">
          <button
            @click="changePage(page)"
            :class="[
              'px-3 py-1 border border-gray-900',
              currentPage === page ? 'bg-gray-900  text-white' : '',
            ]"
          >
            {{ page }}
          </button>
        </template>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 border border-gray-900 disabled:opacity-50"
        >
          &raquo;
        </button>
      </div>
    </div>
  </div>
</template>
