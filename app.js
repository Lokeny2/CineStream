// CineStream app.js

const API_KEY = "TMDB_Key";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";
const PLACEHOLDER = "https://placehold.co/300x450?text=No+Poster";

const moviesGrid = document.getElementById("moviesGrid");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const sectionTitle =
  document.getElementById("sectionTitle") || document.querySelector("main h2");

// Navigation selectors
const navHome = document.getElementById("navHome");
const navMovies = document.getElementById("navMovies");
const navTV = document.getElementById("navTV");
const navFavs = document.getElementById("navFavs");

let favourites = JSON.parse(localStorage.getItem("cineFavs")) || [];
let searchTimer;

function getPoster(path) {
  return path ? `${IMG_BASE}${path}` : PLACEHOLDER;
}

function saveFavourites() {
  localStorage.setItem("cineFavs", JSON.stringify(favourites));
}

function isFav(id) {
  return favourites.some((f) => f.id === id);
}

function toggleFav(movie) {
  if (isFav(movie.id)) {
    favourites = favourites.filter((f) => f.id !== movie.id);
  } else {
    favourites.push(movie);
  }
  saveFavourites();
}

/*
 Active Nav state
 */
function updateActiveNav(activeId) {
  document.querySelectorAll("nav a").forEach((link) => {
    link.classList.toggle("active", link.id === activeId);
  });
}

/*
 Skeleton Loaders
 */
function showSkeletons() {
  moviesGrid.innerHTML = Array(10)
    .fill('<div class="movie-card skeleton" style="height: 400px;"></div>')
    .join("");
}

/*
Only append search inqueries
 */
async function fetchMovies(endpoint, query = "") {
  try {
    let url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=1`;

    if (query && endpoint.includes("search")) {
      url += `&query=${encodeURIComponent(query)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results;
  } catch (err) {
    console.error("fetch failed:", err);
    return null;
  }
}

function renderMovies(movies, title = "Popular Movies") {
  if (sectionTitle) sectionTitle.textContent = title;

  moviesGrid.innerHTML = "";

  if (movies === null) {
    moviesGrid.innerHTML =
      '<p class="error">Unable to load movies. Please check your connection.</p>';
    return;
  }

  if (movies.length === 0) {
    const message =
      title === "Your Favorites"
        ? "You haven't saved any favorites yet."
        : "No movies found for this search.";
    moviesGrid.innerHTML = `<p class="no-results">${message}</p>`;
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const displayTitle = movie.title || movie.name;
    const date = movie.release_date || movie.first_air_date;
    const year = date ? date.slice(0, 4) : "—";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    card.innerHTML = `
      <img src="${getPoster(movie.poster_path)}" alt="${displayTitle}">
      <h3>${displayTitle}</h3>
      <p class="year">${year}</p>
      <p class="rating">★ ${rating}</p>
      <button class="favorite-btn" data-id="${movie.id}">
        ${isFav(movie.id) ? "♥ Favourited" : "♡ Favourite"}
      </button>
    `;

    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", () => {
      toggleFav(movie);
      // Safe check using optional chaining
      if (sectionTitle?.textContent === "Your Favorites") {
        renderMovies(favourites, "Your Favorites");
      } else {
        favBtn.textContent = isFav(movie.id) ? "♥ Favourited" : "♡ Favourite";
      }
    });

    moviesGrid.appendChild(card);
  });
}

async function searchHandler() {
  const query = searchInput.value.trim();
  if (!query) {
    loadPopular();
    return;
  }
  showSkeletons(); // UI Feedback while searching
  const results = await fetchMovies("/search/movie", query);
  renderMovies(results, `Search Results for "${query}"`);
}

async function loadPopular() {
  showSkeletons();
  const movies = await fetchMovies("/movie/popular");
  renderMovies(movies, "Popular Movies");
}

// Event Listeners
window.addEventListener("DOMContentLoaded", () => {
  updateActiveNav("navHome");
  loadPopular();
});

searchBtn.addEventListener("click", searchHandler);

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(searchHandler, 500);
});

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchHandler();
});

if (navHome) {
  navHome.addEventListener("click", (e) => {
    e.preventDefault();
    updateActiveNav("navHome");
    loadPopular();
  });
}

if (navMovies) {
  navMovies.addEventListener("click", (e) => {
    e.preventDefault();
    updateActiveNav("navMovies");
    loadPopular();
  });
}

if (navTV) {
  navTV.addEventListener("click", async (e) => {
    e.preventDefault();
    updateActiveNav("navTV");
    showSkeletons();
    const shows = await fetchMovies("/tv/popular");
    renderMovies(shows, "Popular TV Shows");
  });
}

if (navFavs) {
  navFavs.addEventListener("click", (e) => {
    e.preventDefault();
    updateActiveNav("navFavs");
    renderMovies(favourites, "Your Favorites");
  });
}
