// ─── Normalización ───────────────────────────────────────────────────────────

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseIngredientesUsuario(input) {
  return input
    .split(",")
    .map(normalizar)
    .filter(Boolean);
}

// ─── Motor de coincidencia ────────────────────────────────────────────────────

function calcularCoincidencia(ingredientesUsuario, receta) {
  const ingredientesReceta = receta.ingredientes.map(normalizar);
  const coincidencias = ingredientesReceta.filter(ing =>
    ingredientesUsuario.some(userIng => ing.includes(userIng) || userIng.includes(ing))
  );
  const faltantes = ingredientesReceta.filter(ing => !coincidencias.includes(ing));
  const porcentaje = coincidencias.length / ingredientesReceta.length;
  return { receta, porcentaje, coincidencias, faltantes };
}

function recomendar(inputUsuario, recetas) {
  const ingredientesUsuario = parseIngredientesUsuario(inputUsuario);
  if (ingredientesUsuario.length === 0) return [];

  return recetas
    .map(r => calcularCoincidencia(ingredientesUsuario, r))
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, 3); // top 3, pero muestra siempre al menos 1
}

// ─── Renderizado de resultados ────────────────────────────────────────────────

function crearBotonFavorito(receta) {
  const fav = esFavorito(receta.id);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-favorito";
  btn.setAttribute("aria-pressed", fav ? "true" : "false");
  btn.setAttribute("aria-label", fav ? `Quitar ${receta.nombre} de favoritos` : `Marcar ${receta.nombre} como favorita`);
  btn.textContent = fav ? "★" : "☆";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorito(receta.id);
    const ahoraFav = esFavorito(receta.id);
    btn.textContent = ahoraFav ? "★" : "☆";
    btn.setAttribute("aria-pressed", ahoraFav ? "true" : "false");
    btn.setAttribute("aria-label", ahoraFav ? `Quitar ${receta.nombre} de favoritos` : `Marcar ${receta.nombre} como favorita`);
    renderFavoritos();
    if (modalAbierto && recetaModalActual?.id === receta.id) {
      actualizarBotonFavoritoModal();
    }
  });
  return btn;
}

function mostrarResultados(resultados) {
  const contenedor = document.getElementById("resultados");
  contenedor.innerHTML = "";

  if (resultados.length === 0) {
    contenedor.innerHTML = `<p class="mensaje">Escribe al menos un ingrediente para empezar 🍳</p>`;
    return;
  }

  resultados.forEach(({ receta, porcentaje, coincidencias, faltantes }) => {
    const pct = Math.round(porcentaje * 100);
    const mensajeFaltantes = faltantes.length > 0
      ? `Te faltarían: ${faltantes.join(", ")}`
      : `¡Tienes todo lo necesario! 🎉`;

    const card = document.createElement("article");
    card.className = "receta-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Ver receta completa de ${receta.nombre}`);
    card.innerHTML = `
      <div class="receta-card-cabecera">
        <h3>${receta.nombre}</h3>
      </div>
      <p class="match">${pct}% de coincidencia</p>
      <p class="faltantes">${mensajeFaltantes}</p>
      <p class="tiempo">⏱ ${receta.tiempo_min} min · 🍽 ${receta.porciones} porciones · 📊 ${receta.dificultad}</p>
      <p class="card-cta">Ver receta completa →</p>
    `;
    const botonFav = crearBotonFavorito(receta);
    card.querySelector(".receta-card-cabecera").appendChild(botonFav);
    card.addEventListener("click", () => abrirModal(receta, coincidencias, faltantes));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrirModal(receta, coincidencias, faltantes);
      }
    });
    contenedor.appendChild(card);
  });
}

// ─── Carga de datos y evento del formulario ───────────────────────────────────

let recetas = [];

fetch("data/recetas.json")
  .then(res => res.json())
  .then(data => {
    recetas = data;
    renderFavoritos();
  })
  .catch(() => {
    // Fallback defensivo: si el fetch falla (ej. abrir index.html sin servidor local),
    // mostrar un mensaje claro en vez de que la app quede muda.
    document.getElementById("resultados").innerHTML =
      `<p class="mensaje">No se pudieron cargar las recetas. Verifica tu conexión o vuelve a intentar.</p>`;
  });

// ─── Favoritos (localStorage) ─────────────────────────────────────────────────

const FAVORITOS_KEY = "sazonia_favoritos";

function cargarFavoritos() {
  try {
    const raw = localStorage.getItem(FAVORITOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === "string") : [];
  } catch {
    return [];
  }
}

let favoritos = cargarFavoritos();

function guardarFavoritos() {
  try {
    localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.): se ignora.
  }
}

function esFavorito(id) {
  return favoritos.includes(id);
}

function toggleFavorito(id) {
  if (esFavorito(id)) {
    favoritos = favoritos.filter(x => x !== id);
  } else {
    favoritos = [...favoritos, id];
  }
  guardarFavoritos();
}

function renderFavoritos() {
  const cont = document.getElementById("favoritos-grid");
  if (!cont) return;
  cont.innerHTML = "";

  if (favoritos.length === 0) {
    cont.innerHTML = `<p class="mensaje">Aún no tienes recetas favoritas. Dale clic a la estrella en cualquier receta.</p>`;
    return;
  }

  const encontrados = favoritos
    .map(id => recetas.find(r => r.id === id))
    .filter(Boolean);

  if (encontrados.length === 0) {
    cont.innerHTML = `<p class="mensaje">Aún no tienes recetas favoritas. Dale clic a la estrella en cualquier receta.</p>`;
    return;
  }

  encontrados.forEach(receta => {
    const card = document.createElement("article");
    card.className = "receta-card receta-card-favorita";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Ver receta favorita de ${receta.nombre}`);
    card.innerHTML = `
      <div class="receta-card-cabecera">
        <h3>${receta.nombre}</h3>
      </div>
      <p class="tiempo">⏱ ${receta.tiempo_min} min · 🍽 ${receta.porciones} porciones · 📊 ${receta.dificultad}</p>
      <p class="card-cta">Ver receta completa →</p>
    `;
    const botonFav = crearBotonFavorito(receta);
    card.querySelector(".receta-card-cabecera").appendChild(botonFav);
    card.addEventListener("click", () => {
      const todosIngredientes = receta.ingredientes.map(normalizar);
      abrirModal(receta, todosIngredientes, []);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const todosIngredientes = receta.ingredientes.map(normalizar);
        abrirModal(receta, todosIngredientes, []);
      }
    });
    cont.appendChild(card);
  });
}

// Pintar favoritos lo antes posible (si el JSON ya estuviera cacheado, igual funciona
// porque renderFavoritos no hace nada si `recetas` aún está vacío).
renderFavoritos();

document.getElementById("form-ingredientes").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("input-ingredientes").value;
  const resultados = recomendar(input, recetas);
  mostrarResultados(resultados);
});

// ─── Modal de receta completa ─────────────────────────────────────────────────

let modalAbierto = false;
let recetaModalActual = null;

function abrirModal(receta, coincidencias, faltantes) {
  recetaModalActual = receta;

  const ingredientesHTML = receta.ingredientes.map(ing => {
    const ingNorm = normalizar(ing);
    const tieneIngrediente = coincidencias.includes(ingNorm);
    const icono = tieneIngrediente ? "✓" : "✗";
    const clase = tieneIngrediente ? "ing-tiene" : "ing-falta";
    return `<li class="ing-item ${clase}"><span class="ing-icono">${icono}</span>${ing}</li>`;
  }).join("");

  const pasosHTML = receta.pasos.map((paso, i) =>
    `<li class="paso-item"><span class="paso-num">${i + 1}</span><span>${paso}</span></li>`
  ).join("");

  const listaCompras = document.getElementById("modal-lista-compras");
  const compraItems = document.getElementById("modal-compra-items");
  if (faltantes.length > 0) {
    compraItems.innerHTML = faltantes.map(ing =>
      `<li class="compra-item"><span class="compra-icono" aria-hidden="true">🛒</span><span>${ing}</span></li>`
    ).join("");
    listaCompras.removeAttribute("hidden");
  } else {
    compraItems.innerHTML = "";
    listaCompras.setAttribute("hidden", "");
  }

  document.getElementById("modal-nombre").textContent = receta.nombre;
  document.getElementById("modal-meta").textContent =
    `⏱ ${receta.tiempo_min} min · 🍽 ${receta.porciones} porciones · 📊 ${receta.dificultad}`;
  document.getElementById("modal-ingredientes").innerHTML = ingredientesHTML;
  document.getElementById("modal-pasos").innerHTML = pasosHTML;

  actualizarBotonFavoritoModal();

  const modal = document.getElementById("modal");
  modal.removeAttribute("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modalAbierto = true;

  // Foco inicial en el botón cerrar para accesibilidad
  document.getElementById("modal-cerrar").focus();
}

function actualizarBotonFavoritoModal() {
  const btn = document.getElementById("modal-favorito");
  if (!btn || !recetaModalActual) return;
  const fav = esFavorito(recetaModalActual.id);
  btn.textContent = fav ? "★" : "☆";
  btn.setAttribute("aria-pressed", fav ? "true" : "false");
  btn.setAttribute("aria-label", fav ? `Quitar ${recetaModalActual.nombre} de favoritos` : `Marcar ${recetaModalActual.nombre} como favorita`);
}

function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.setAttribute("hidden", "");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  modalAbierto = false;
  recetaModalActual = null;
}

// Eventos de cierre del modal
document.getElementById("modal-cerrar").addEventListener("click", cerrarModal);
document.getElementById("modal-overlay").addEventListener("click", cerrarModal);
document.getElementById("modal-favorito").addEventListener("click", () => {
  if (!recetaModalActual) return;
  toggleFavorito(recetaModalActual.id);
  actualizarBotonFavoritoModal();
  renderFavoritos();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});
