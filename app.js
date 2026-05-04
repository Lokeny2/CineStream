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

// Persistent state for user favorites stored in the browser[cite: 1]
let favourites = JSON.parse(localStorage.getItem("cineFavs")) || [];

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
    // Return null to distinguish network/API failures from "zero results"[cite: 1]
    console.error("fetch failed:", err);
    return null;
  }
}

/**
 * Handling the DOM manipulation for the movie grid.
 * Managing three distinct UI states: Error, Empty, and Success.
 */
function renderMovies(movies, title = "Popular Movies") {
  if (sectionTitle) sectionTitle.textContent = title;

  moviesGrid.innerHTML = "";

  if (movies === null) {
    moviesGrid.innerHTML =
      '<p class="error">Unable to load movies. Please check your connection.</p>';
    return;
  }

  if (movies.length === 0) {
    moviesGrid.innerHTML =
      '<p class="no-results">No movies found for this search.</p>';
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    card.innerHTML = `
      <img src="${getPoster(movie.poster_path)}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p class="year">${year}</p>
      <p class="rating">★ ${rating}</p>
      <button class="favorite-btn" data-id="${movie.id}">
        ${isFav(movie.id) ? "♥ Favourited" : "♡ Favourite"}
      </button>
    `;

    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", () => {
      toggleFav(movie);
      favBtn.textContent = isFav(movie.id) ? "♥ Favourited" : "♡ Favourite";
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
  const results = await fetchMovies("/search/movie", query);
  renderMovies(results, `Search Results for "${query}"`);
}

async function loadPopular() {
  moviesGrid.innerHTML = '<p class="loading">Loading movies...</p>';
  const movies = await fetchMovies("/movie/popular");
  renderMovies(movies, "Popular Movies");
}

// Event Listeners
window.addEventListener("DOMContentLoaded", loadPopular);
searchBtn.addEventListener("click", searchHandler);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchHandler();
});
