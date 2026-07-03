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

  resultados.forEach(({ receta, porcentaje, faltantes }) => {
    const pct = Math.round(porcentaje * 100);
    const mensajeFaltantes = faltantes.length > 0
      ? `Te faltarían: ${faltantes.join(", ")}`
      : `¡Tienes todo lo necesario! 🎉`;

    const card = document.createElement("article");
    card.className = "receta-card";
    card.innerHTML = `
      <h3>${receta.nombre}</h3>
      <p class="match">${pct}% de coincidencia</p>
      <p class="faltantes">${mensajeFaltantes}</p>
      <p class="tiempo">⏱ ${receta.tiempo_min} min · 🍽 ${receta.porciones} porciones</p>
    `;
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
