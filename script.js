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
      <h3>${receta.nombre}</h3>
      <p class="match">${pct}% de coincidencia</p>
      <p class="faltantes">${mensajeFaltantes}</p>
      <p class="tiempo">⏱ ${receta.tiempo_min} min · 🍽 ${receta.porciones} porciones</p>
      <p class="card-cta">Ver receta completa →</p>
    `;
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
  .then(data => { recetas = data; })
  .catch(() => {
    // Fallback defensivo: si el fetch falla (ej. abrir index.html sin servidor local),
    // mostrar un mensaje claro en vez de que la app quede muda.
    document.getElementById("resultados").innerHTML =
      `<p class="mensaje">No se pudieron cargar las recetas. Verifica tu conexión o vuelve a intentar.</p>`;
  });

document.getElementById("form-ingredientes").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("input-ingredientes").value;
  const resultados = recomendar(input, recetas);
  mostrarResultados(resultados);
});

// ─── Modal de receta completa ─────────────────────────────────────────────────

function abrirModal(receta, coincidencias, faltantes) {
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

  document.getElementById("modal-nombre").textContent = receta.nombre;
  document.getElementById("modal-meta").textContent =
    `⏱ ${receta.tiempo_min} min · 🍽 ${receta.porciones} porciones`;
  document.getElementById("modal-ingredientes").innerHTML = ingredientesHTML;
  document.getElementById("modal-pasos").innerHTML = pasosHTML;

  const modal = document.getElementById("modal");
  modal.removeAttribute("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Foco inicial en el botón cerrar para accesibilidad
  document.getElementById("modal-cerrar").focus();
}

function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.setAttribute("hidden", "");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Eventos de cierre del modal
document.getElementById("modal-cerrar").addEventListener("click", cerrarModal);
document.getElementById("modal-overlay").addEventListener("click", cerrarModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});
