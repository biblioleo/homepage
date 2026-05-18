const sheetURL =\
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwD-BejuTnjtnrQjm8nq45yUMnPlpqdVCNtN966RAOOQdRhDyBCJMcfjaHdBJDV2UmKNcCt_goyH5S/pub?output=csv";\
\
const input = document.getElementById("search");\
const resultsList = document.getElementById("results");\
const favList = document.getElementById("favorites-list");\
const genreFilter = document.getElementById("genre-filter");\
const availabilityFilter = document.getElementById("availability-filter");\
const sortFilter = document.getElementById("sort-filter");\
const counter = document.getElementById("counter");\
const clearFavoritesButton = document.getElementById("clear-favorites");\
const bookModal = document.getElementById("book-modal");\
const bookModalContent = document.getElementById("book-modal-content");\
\
let books = [];\
let filtersReady = false;\
\
function clean(value, fallback = "Non indicato") \{\
  const text = value ? String(value).trim() : "";\
  return text || fallback;\
\}\
\
function normalize(value) \{\
  return clean(value, "").toLowerCase();\
\}\
\
function escapeHtml(value) \{\
  return clean(value, "")\
    .replaceAll("&", "&amp;")\
    .replaceAll("<", "&lt;")\
    .replaceAll(">", "&gt;")\
    .replaceAll('"', "&quot;")\
    .replaceAll("'", "&#039;");\
\}\
\
function getField(book, ...names) \{\
  for (const name of names) \{\
    if (\
      book[name] !== undefined &&\
      book[name] !== null &&\
      String(book[name]).trim() !== ""\
    ) \{\
      return book[name];\
    \}\
  \}\
  return "";\
\}\
\
function getTitle(book) \{\
  return getField(book, "TITOLO", "Titolo", "titolo");\
\}\
\
function getAuthor(book) \{\
  return getField(book, "AUTORE", "Autore", "autore");\
\}\
\
function getGenre(book) \{\
  return getField(book, "GENERE", "Genere", "genere");\
\}\
\
function getIsbn(book) \{\
  return getField(book, "ISBN", "Isbn", "isbn");\
\}\
\
function getBookId(book) \{\
  return (\
    clean(getIsbn(book), "") ||\
    `$\{clean(getTitle(book), "")\}-$\{clean(getAuthor(book), "")\}`\
  );\
\}\
\
function getBookCover(book) \{\
  let manualCover = clean(\
    getField(\
      book,\
      "COPERTINA",\
      "Copertina",\
      "copertina",\
      "URL COPERTINA",\
      "URL Copertina",\
      "url copertina"\
    ),\
    ""\
  );\
\
  if (manualCover !== "") \{\
    const driveMatch = manualCover.match(/\\/d\\/([^/]+)/);\
\
    if (driveMatch && driveMatch[1]) \{\
      manualCover = `https://drive.google.com/uc?export=view&id=$\{driveMatch[1]\}`;\
    \}\
\
    return manualCover;\
  \}\
\
  const isbn = clean(getIsbn(book), "");\
\
  if (isbn !== "") \{\
    const cleanIsbn = isbn.replace(/[^0-9Xx]/g, "");\
    return `https://covers.openlibrary.org/b/isbn/$\{cleanIsbn\}-L.jpg?default=false`;\
  \}\
\
  return "";\
\}\
\
function createPlaceholderCover(book) \{\
  const title = escapeHtml(clean(getTitle(book), "Titolo mancante"));\
  const author = escapeHtml(clean(getAuthor(book), "Autore non indicato"));\
\
  return `\
    <div class="book-placeholder-cover" aria-label="Copertina generata per $\{title\}">\
      <span class="placeholder-kicker">BiblioLeo</span>\
      <strong class="placeholder-title">$\{title\}</strong>\
      <span class="placeholder-author">$\{author\}</span>\
    </div>\
  `;\
\}\
\
function createCoverMarkup(book, cover) \{\
  const placeholder = createPlaceholderCover(book);\
\
  if (cover === "") \{\
    return placeholder;\
  \}\
\
  const title = escapeHtml(clean(getTitle(book), "libro"));\
\
  return `\
    <img\
      class="book-cover"\
      src="$\{escapeHtml(cover)\}"\
      alt="Copertina di $\{title\}"\
      loading="lazy"\
      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"\
    >\
    $\{placeholder\}\
  `;\
\}\
\
function getBookById(bookId) \{\
  return books.find((book) => getBookId(book) === bookId);\
\}\
\
function toggleFavorite(bookId) \{\
  let favorites = getFavorites();\
\
  if (favorites.includes(bookId)) \{\
    favorites = favorites.filter((id) => id !== bookId);\
  \} else \{\
    favorites.push(bookId);\
  \}\
\
  saveFavorites(favorites);\
\}\
\
function getFieldRows(book) \{\
  return [\
    ["Autore", clean(getAuthor(book), "Autore non indicato")],\
    ["Editore", clean(getField(book, "EDITORE", "Editore", "editore"))],\
    ["Anno", clean(getField(book, "ANNO", "Anno", "anno"), "s.d.")],\
    ["Genere", clean(getGenre(book))],\
    ["ISBN", clean(getIsbn(book))],\
    ["Collocazione", clean(getField(book, "COLLOCAZIONE", "Collocazione", "collocazione"))],\
    ["Quantit\'e0", clean(getField(book, "QUANTITA", "Quantita", "Quantit\'e0", "quantita", "quantit\'e0"))],\
    ["Luogo", clean(getField(book, "LUOGO", "Luogo", "luogo"))],\
    ["Prestito", clean(getField(book, "PRESTITO", "Prestito", "prestito"))],\
    ["Edizione", clean(getField(book, "EDIZIONE", "Edizione", "edizione"))],\
    ["Volume", clean(getField(book, "VOLUME", "Volume", "volume"))],\
    ["Pagine", clean(getField(book, "PAGINE", "Pagine", "pagine"))],\
    ["Lingua", clean(getField(book, "LINGUA", "Lingua", "lingua"))],\
  ];\
\}\
\
function updateFavoriteButtons() \{\
  const favorites = getFavorites();\
\
  document.querySelectorAll("[data-favorite-id]").forEach((button) => \{\
    const isFav = favorites.includes(button.dataset.favoriteId);\
    button.textContent = isFav ? "\uc0\u10084 \u65039 " : "\u9825 ";\
    button.setAttribute(\
      "aria-label",\
      isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"\
    );\
  \});\
\}\
\
function openBookModal(bookId) \{\
  const book = getBookById(bookId);\
\
  if (!book || !bookModal || !bookModalContent) return;\
\
  const available = isBookAvailable(book);\
  const cover = getBookCover(book);\
  const title = escapeHtml(clean(getTitle(book), "Titolo mancante"));\
  const author = escapeHtml(clean(getAuthor(book), "Autore non indicato"));\
  const abstract = escapeHtml(\
    clean(getField(book, "ABSTRACT", "Abstract", "abstract"), "Abstract non disponibile.")\
  );\
\
  const detailRows = getFieldRows(book)\
    .map(\
      ([label, value]) => `\
        <div class="modal-detail-row">\
          <span>$\{escapeHtml(label)\}</span>\
          <strong>$\{escapeHtml(value)\}</strong>\
        </div>\
      `\
    )\
    .join("");\
\
  bookModalContent.innerHTML = `\
    <div class="modal-book-layout">\
      <div class="modal-cover-wrap">\
        $\{createCoverMarkup(book, cover)\}\
      </div>\
\
      <div class="modal-book-info">\
        <span class="availability-badge $\{available ? "available" : "unavailable"\}">\
          $\{available ? "Disponibile" : "Non disponibile"\}\
        </span>\
\
        <h2 id="modal-title">$\{title\}</h2>\
        <p class="modal-author">$\{author\}</p>\
\
        <div class="modal-details-grid">\
          $\{detailRows\}\
        </div>\
\
        <div class="modal-abstract">\
          <h3>Abstract</h3>\
          <p>$\{abstract\}</p>\
        </div>\
      </div>\
    </div>\
  `;\
\
  bookModal.hidden = false;\
  document.body.classList.add("modal-open");\
\}\
\
function closeBookModal() \{\
  if (!bookModal) return;\
\
  bookModal.hidden = true;\
  document.body.classList.remove("modal-open");\
\}\
\
function getFavorites() \{\
  try \{\
    return JSON.parse(localStorage.getItem("favorites")) || [];\
  \} catch \{\
    return [];\
  \}\
\}\
\
function saveFavorites(favorites) \{\
  localStorage.setItem("favorites", JSON.stringify(favorites));\
\}\
\
function isBookAvailable(book) \{\
  const disponibilita = normalize(\
    getField(\
      book,\
      "DISPONIBILITA",\
      "Disponibilita",\
      "Disponibilit\'e0",\
      "disponibilita",\
      "disponibilit\'e0"\
    )\
  );\
\
  const quantita = Number(\
    getField(book, "QUANTITA", "Quantita", "Quantit\'e0", "quantita", "quantit\'e0") || 0\
  );\
\
  if (disponibilita.includes("non")) return false;\
  if (disponibilita.includes("disponibile")) return true;\
  if (quantita > 0) return true;\
\
  return false;\
\}\
\
function createBookCard(book) \{\
  const li = document.createElement("li");\
\
  const available = isBookAvailable(book);\
  const bookId = getBookId(book);\
  const favorites = getFavorites();\
  const isFav = favorites.includes(bookId);\
  const cover = getBookCover(book);\
  const title = escapeHtml(clean(getTitle(book), "Titolo mancante"));\
  const author = escapeHtml(clean(getAuthor(book), "Autore non indicato"));\
\
  li.className = "book-item";\
\
  li.innerHTML = `\
    <button\
      class="fav-btn"\
      type="button"\
      data-favorite-id="$\{escapeHtml(bookId)\}"\
      aria-label="$\{isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"\}"\
    >\
      $\{isFav ? "\uc0\u10084 \u65039 " : "\u9825 "\}\
    </button>\
\
    <button class="book-card-button" type="button" data-book-id="$\{escapeHtml(bookId)\}">\
      <article class="book-card-layout">\
        <div class="book-cover-box">\
          $\{createCoverMarkup(book, cover)\}\
        </div>\
\
        <div class="book-card-text">\
          <h3 class="book-title">$\{title\}</h3>\
          <p class="book-author">$\{author\}</p>\
          <span class="availability-badge $\{available ? "available" : "unavailable"\}">\
            $\{available ? "Disponibile" : "Non disponibile"\}\
          </span>\
          <span class="open-details-label">Apri scheda</span>\
        </div>\
      </article>\
    </button>\
  `;\
\
  const favButton = li.querySelector(".fav-btn");\
  const cardButton = li.querySelector(".book-card-button");\
\
  favButton.addEventListener("click", function (event) \{\
    event.stopPropagation();\
    toggleFavorite(bookId);\
    updateFavoriteButtons();\
    renderFavorites();\
  \});\
\
  cardButton.addEventListener("click", function () \{\
    openBookModal(bookId);\
  \});\
\
  return li;\
\}\
\
function renderBooks(list) \{\
  resultsList.innerHTML = "";\
\
  if (counter) \{\
    counter.textContent = `$\{list.length\} libro/i trovato/i`;\
  \}\
\
  if (list.length === 0) \{\
    resultsList.innerHTML = `<li class="empty-message">Nessun libro trovato.</li>`;\
    return;\
  \}\
\
  list.forEach((book) => \{\
    resultsList.appendChild(createBookCard(book));\
  \});\
\}\
\
function populateGenres() \{\
  genreFilter.innerHTML = `<option value="">Tutti i generi</option>`;\
\
  const genres = [\
    ...new Set(\
      books\
        .map((book) => clean(getGenre(book), ""))\
        .filter((genre) => genre !== "")\
    ),\
  ].sort();\
\
  genres.forEach((genre) => \{\
    const option = document.createElement("option");\
    option.value = genre;\
    option.textContent = genre;\
    genreFilter.appendChild(option);\
  \});\
\}\
\
function applyFilters() \{\
  const query = normalize(input.value);\
  const selectedGenre = genreFilter.value;\
  const selectedAvailability = availabilityFilter.value;\
  const selectedSort = sortFilter.value;\
\
  let filtered = books.filter((book) => \{\
    const searchableText = Object.values(book).join(" ").toLowerCase();\
    const available = isBookAvailable(book);\
\
    const matchesSearch = searchableText.includes(query);\
\
    const matchesGenre =\
      selectedGenre === "" || clean(getGenre(book), "") === selectedGenre;\
\
    const matchesAvailability =\
      selectedAvailability === "" ||\
      (selectedAvailability === "disponibile" && available) ||\
      (selectedAvailability === "non disponibile" && !available);\
\
    return matchesSearch && matchesGenre && matchesAvailability;\
  \});\
\
  if (selectedSort === "titolo") \{\
    filtered.sort((a, b) =>\
      normalize(getTitle(a)).localeCompare(normalize(getTitle(b)))\
    );\
  \}\
\
  if (selectedSort === "autore") \{\
    filtered.sort((a, b) =>\
      normalize(getAuthor(a)).localeCompare(normalize(getAuthor(b)))\
    );\
  \}\
\
  if (selectedSort === "anno") \{\
    filtered.sort(\
      (a, b) =>\
        Number(getField(a, "ANNO", "Anno", "anno") || 0) -\
        Number(getField(b, "ANNO", "Anno", "anno") || 0)\
    );\
  \}\
\
  renderBooks(filtered);\
\}\
\
function renderFavorites() \{\
  favList.innerHTML = "";\
\
  const favorites = getFavorites();\
\
  if (clearFavoritesButton) \{\
    clearFavoritesButton.hidden = favorites.length === 0;\
  \}\
\
  const favoriteBooks = books.filter((book) =>\
    favorites.includes(getBookId(book))\
  );\
\
  if (favoriteBooks.length === 0) \{\
    favList.innerHTML = `<li class="empty-message">Nessun libro preferito.</li>`;\
    return;\
  \}\
\
  favoriteBooks.forEach((book) => \{\
    favList.appendChild(createBookCard(book));\
  \});\
\}\
\
function initializeCatalog(data) \{\
  books = data.filter((book) => clean(getTitle(book), "") !== "");\
\
  populateGenres();\
  renderBooks(books);\
  renderFavorites();\
\
  if (filtersReady) return;\
\
  input.addEventListener("input", applyFilters);\
  genreFilter.addEventListener("change", applyFilters);\
  availabilityFilter.addEventListener("change", applyFilters);\
  sortFilter.addEventListener("change", applyFilters);\
  filtersReady = true;\
\}\
\
function showLoadingError() \{\
  resultsList.innerHTML =\
    `<li class="empty-message">Errore nel caricamento del catalogo. Controlla la connessione e riprova.</li>`;\
\}\
\
function parseCsvText(csvText) \{\
  const rows = [];\
  let row = [];\
  let value = "";\
  let insideQuotes = false;\
\
  for (let index = 0; index < csvText.length; index++) \{\
    const char = csvText[index];\
    const nextChar = csvText[index + 1];\
\
    if (char === '"' && insideQuotes && nextChar === '"') \{\
      value += '"';\
      index++;\
      continue;\
    \}\
\
    if (char === '"') \{\
      insideQuotes = !insideQuotes;\
      continue;\
    \}\
\
    if (char === "," && !insideQuotes) \{\
      row.push(value);\
      value = "";\
      continue;\
    \}\
\
    if ((char === "\\n" || char === "\\r") && !insideQuotes) \{\
      if (char === "\\r" && nextChar === "\\n") \{\
        index++;\
      \}\
\
      row.push(value);\
\
      if (row.some((cell) => clean(cell, "") !== "")) \{\
        rows.push(row);\
      \}\
\
      row = [];\
      value = "";\
      continue;\
    \}\
\
    value += char;\
  \}\
\
  row.push(value);\
\
  if (row.some((cell) => clean(cell, "") !== "")) \{\
    rows.push(row);\
  \}\
\
  const headers = rows.shift() || [];\
\
  return rows.map((cells) => \{\
    const book = \{\};\
\
    headers.forEach((header, index) => \{\
      if (clean(header, "") !== "") \{\
        book[header] = cells[index] || "";\
      \}\
    \});\
\
    return book;\
  \});\
\}\
\
function loadBooksWithFetch() \{\
  fetch(sheetURL)\
    .then((response) => \{\
      if (!response.ok) \{\
        throw new Error("Impossibile caricare il catalogo.");\
      \}\
\
      return response.text();\
    \})\
    .then((csvText) => \{\
      if (typeof Papa !== "undefined") \{\
        const parsed = Papa.parse(csvText, \{\
          header: true,\
          skipEmptyLines: true,\
        \});\
\
        initializeCatalog(parsed.data);\
        return;\
      \}\
\
      initializeCatalog(parseCsvText(csvText));\
    \})\
    .catch(function (error) \{\
      console.error(error);\
      showLoadingError();\
    \});\
\}\
\
function loadBooks() \{\
  resultsList.innerHTML = `<li class="empty-message">Caricamento catalogo...</li>`;\
\
  if (typeof Papa === "undefined") \{\
    loadBooksWithFetch();\
    return;\
  \}\
\
  Papa.parse(sheetURL, \{\
    download: true,\
    header: true,\
    skipEmptyLines: true,\
\
    complete: function (results) \{\
      initializeCatalog(results.data);\
    \},\
\
    error: function (error) \{\
      console.error(error);\
      loadBooksWithFetch();\
    \},\
  \});\
\}\
\
loadBooks();\
\
if (clearFavoritesButton) \{\
  clearFavoritesButton.addEventListener("click", function () \{\
    localStorage.removeItem("favorites");\
    renderBooks(books);\
    renderFavorites();\
  \});\
\}\
\
if (bookModal) \{\
  bookModal.addEventListener("click", function (event) \{\
    if (event.target.matches("[data-close-modal]")) \{\
      closeBookModal();\
    \}\
  \});\
\}\
\
document.addEventListener("keydown", function (event) \{\
  if (event.key === "Escape" && bookModal && !bookModal.hidden) \{\
    closeBookModal();\
  \}\
\});\
}
