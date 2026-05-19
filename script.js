const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwD-BejuTnjtnrQjm8nq45yUMnPlpqdVCNtN966RAOOQdRhDyBCJMcfjaHdBJDV2UmKNcCt_goyH5S/pub?output=csv";

const input = document.getElementById("search");
const resultsList = document.getElementById("results");
const favList = document.getElementById("favorites-list");
const genreFilter = document.getElementById("genre-filter");
const availabilityFilter = document.getElementById("availability-filter");
const sortFilter = document.getElementById("sort-filter");
const counter = document.getElementById("counter");
const clearFavoritesButton = document.getElementById("clear-favorites");
const bookModal = document.getElementById("book-modal");
const bookModalContent = document.getElementById("book-modal-content");

let books = [];
let filtersReady = false;

function clean(value, fallback = "Non indicato") {
  const text = value ? String(value).trim() : "";
  return text || fallback;
}

function normalize(value) {
  return clean(value, "").toLowerCase();
}

function escapeHtml(value) {
  return clean(value, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getField(book, ...names) {
  for (const name of names) {
    if (
      book[name] !== undefined &&
      book[name] !== null &&
      String(book[name]).trim() !== ""
    ) {
      return book[name];
    }
  }
  return "";
}

function getTitle(book) {
  return getField(book, "TITOLO", "Titolo", "titolo");
}

function getAuthor(book) {
  return getField(book, "AUTORE", "Autore", "autore");
}

function getGenre(book) {
  return getField(book, "GENERE", "Genere", "genere");
}

function getIsbn(book) {
  return getField(book, "ISBN", "Isbn", "isbn");
}

function getBookId(book) {
  return (
    clean(getIsbn(book), "") ||
    `${clean(getTitle(book), "")}-${clean(getAuthor(book), "")}`
  );
}

function getBookCover(book) {
  let manualCover = clean(
    getField(
      book,
      "COPERTINA",
      "Copertina",
      "copertina",
      "URL COPERTINA",
      "URL Copertina",
      "url copertina"
    ),
    ""
  );

  if (manualCover !== "") {
    const driveMatch = manualCover.match(/\/d\/([^/]+)/);

    if (driveMatch && driveMatch[1]) {
      manualCover = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }

    return manualCover;
  }

  const isbn = clean(getIsbn(book), "");

  if (isbn !== "") {
    const cleanIsbn = isbn.replace(/[^0-9Xx]/g, "");
    return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;
