// CineStream app.js

const API_KEY = "TMDB_API_KEY";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";
const PLACEHOLDER = "assets/no-poster.png";

const moviesGrid = document.getElementById("moviesGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

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

async function fetchMovies(endpoint, query = "") {
  try {
    let url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=1`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    console.log("fetching:", url);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results;
  } catch (err) {
    console.error("fetch failed:", err);
    return [];
  }
}

function renderMovies(movies) {
  moviesGrid.innerHTML = "";

  if (!movies.length) {
    moviesGrid.innerHTML = '<p class="no-results">No movies found.</p>';
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    card.innerHTML = `
      <img src="${getPoster(movie.poster_path)}"
           alt="${movie.title}"
           onerror="this.onerror=null;this.src='https://placehold.co/300x450';">
      <h3>${movie.title}</h3>
      <p class="year">${year}</p>
      <p class="rating">★ ${rating}</p>
      <button class="favorite-btn">${isFav(movie.id) ? "♥ Favourited" : "♡ Favourite"}</button>
    `;

    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", () => {
      toggleFav(movie);
      favBtn.textContent = isFav(movie.id) ? "♥ Favourited" : "♡ Favourite";
    });

    moviesGrid.appendChild(card);
  });
}

// TODO: debounce this
async function searchHandler() {
  const query = searchInput.value.trim();
  if (!query) return;
  const results = await fetchMovies("/search/movie", query);
  renderMovies(results);
}

async function loadPopular() {
  const movies = await fetchMovies("/movie/popular");
  renderMovies(movies);
}

window.addEventListener("DOMContentLoaded", loadPopular);
searchBtn.addEventListener("click", searchHandler);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchHandler();
});
