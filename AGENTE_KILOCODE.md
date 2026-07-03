# Brief para el Agente (Kilo Code) — SazónIA MVP

Este documento es tu especificación de trabajo. Síguela en orden. No inventes alcance adicional al descrito aquí — el objetivo es un MVP funcional para una demo académica hoy, no un producto completo.

---

## 0. Contexto del proyecto

SazónIA es una plataforma que recomienda **recetas peruanas de plato de fondo (almuerzo)** según los ingredientes que el usuario ya tiene en casa. El usuario escribe sus ingredientes en un campo de texto, separados por comas, y la app le muestra la(s) receta(s) que mejor coincidan, indicando qué le falta si no tiene el 100%.

**Regla de negocio no negociable:** la app **nunca** debe quedar en blanco o mostrar un error cuando el usuario busca. Si no hay coincidencia alta, se muestra igual la mejor opción disponible con sus ingredientes faltantes.

---

## 1. Alcance (léelo antes de escribir código)

### Dentro de alcance
- Input de texto libre de ingredientes (separados por coma).
- Motor de recomendación en JavaScript puro, corriendo en el navegador (sin backend, sin llamadas a APIs externas).
- Base de datos = archivo estático `data/recetas.json`.
- Solo **plato de fondo / almuerzo**. No incluir entradas, postres ni bebidas.
- Diseño responsive (mobile, tablet, desktop) siguiendo el Design System adjunto.
- Deploy final en Vercel como sitio estático.

### Fuera de alcance (no lo implementes aunque se te ocurra)
- Backend / API / servidor propio.
- Base de datos real (MongoDB, PostgreSQL, etc.).
- Autenticación de usuarios, favoritos persistentes.
- Llamadas en tiempo real a un LLM (Gemini, OpenAI, etc.) para generar recomendaciones.
- Frameworks de frontend (React, Vue, etc.) o CSS (Tailwind, Bootstrap).
- Build tools (Vite, Webpack, etc.). Todo debe correr abriendo `index.html` directo o vía `vercel dev`, sin paso de compilación.
- Escalador de porciones, carrito de compras, multi-idioma.

---

## 2. Estructura de archivos (ya creada — no la reorganices)

```
sazonia/
├── index.html
├── style.css
├── script.js
├── data/
│   └── recetas.json
├── assets/
│   └── sazonia-logo.svg     ← ya existe, úsalo en el header
└── README.md
```

Trabaja directamente sobre estos archivos. No agregues carpetas nuevas (`src/`, `components/`, etc.) ni archivos de configuración de build.

---

## 3. Sistema de diseño — tokens exactos (no improvises colores/fuentes)

Declara estos valores como CSS custom properties en `:root` dentro de `style.css`, y úsalos en todo el proyecto. No introduzcas colores, tamaños de fuente o pesos que no estén en esta lista.

```css
:root {
  /* Tipografía */
  --font-principal: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --font-weight-light: 300;   /* cuerpo, nav, labels */
  --font-weight-medium: 500;  /* headings, botones, énfasis */

  --text-h1: 72px;
  --text-h2: 52px;
  --text-h3: 32px;
  --text-h4: 20px;
  --text-body: 16px;
  --text-small: 12px;
  --text-nav: 14px;

  /* Colores — Brand */
  --color-brand-blue: #000BFF;
  --color-ink: #0d0d0d;
  --color-white: #ffffff;
  --color-offwhite: #fdfcfb;

  /* Fondos de sección */
  --bg-white: #ffffff;
  --bg-warm-gray: #f9f8f6;
  --bg-soft-blue: #eef0ff;
  --bg-stone: #e7e7e2;
  --bg-dark: #1a1a1a;

  /* Texto */
  --text-primary: #0d0d0d;
  --text-subheading: #262320;
  --text-secondary: rgba(13, 13, 13, 0.55);
  --text-muted: rgba(13, 13, 13, 0.35);
}
```

### Reglas tipográficas
- `font-weight: 300` (Light) para todo el cuerpo, párrafos, navegación, inputs.
- `font-weight: 500` (Medium) exclusivamente para headings (h1–h4), botones y labels de énfasis.
- **No uses** `400` (Regular) ni `700` (Bold) — no están contemplados en el sistema.
- En mobile, reduce `--text-h1` y `--text-h2` con `clamp()` o media queries (72px y 52px son demasiado grandes para pantallas chicas). Sugerencia: `clamp(2rem, 8vw, 4.5rem)` para h1 en el header.

### Botón primario (usar para "Buscar recetas")
```css
.btn-primario {
  background: var(--color-brand-blue);
  color: var(--color-white);
  padding: 12px 20px;
  border-radius: 9999px; /* pill */
  border: none;
  font-family: var(--font-principal);
  font-size: var(--text-nav);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.btn-primario:hover {
  opacity: 0.75;
  transform: scale(1.03);
}
```

### Fondos
- Header: `var(--bg-offwhite)` o `var(--bg-white)`.
- Sección de resultados: `var(--bg-warm-gray)` o `var(--bg-soft-blue)` para las cards, alternando si visualmente ayuda a separar del fondo.
- Si agregas un footer simple, usa `var(--bg-dark)` con texto blanco y el botón "sobre fondo oscuro" (mismo azul `#000BFF`, texto blanco).

### Logo
Usa `assets/sazonia-logo.svg` en el header, junto al nombre "SazónIA". Tamaño razonable (ej. 32–40px de alto), alineado con el texto.

---

## 4. Datos: `data/recetas.json`

**Este archivo ya existe y está completo — no lo regeneres ni lo modifiques.** Contiene 14 recetas de plato de fondo peruano, ya validadas como JSON sintácticamente correcto (arroz con pollo, lomo saltado, ají de gallina, tallarín saltado, causa rellena, seco de res, pollo al horno con papas, arroz chaufa, tacu tacu, estofado de pollo, arroz tapado, papa rellena, bistec a lo pobre, pollo guisado con arroz). Trátalo como un dato fijo del proyecto: solo léelo con `fetch()` desde `script.js`, tal como se describe en la sección 5.

Este es el schema que ya sigue el archivo, para que sepas qué estructura esperar al consumirlo:

```json
[
  {
    "id": "arroz-con-pollo",
    "nombre": "Arroz con Pollo",
    "ingredientes": ["pollo", "arroz", "cebolla china", "culantro", "ajo", "aji amarillo", "arveja", "zanahoria"],
    "tiempo_min": 45,
    "porciones": 4,
    "pasos": [
      "Licuar culantro con un poco de agua.",
      "Sellar el pollo en una olla con aceite.",
      "Agregar cebolla, ajo y ají amarillo picados, sofreír.",
      "Incorporar el arroz y el licuado de culantro.",
      "Añadir agua o caldo, arveja y zanahoria, cocinar tapado a fuego bajo hasta que el arroz esté listo."
    ]
  }
]
```

Reglas para los ingredientes:
- Todo en minúsculas, sin tildes (ej. `"aji amarillo"`, no `"ají amarillo"`), para simplificar el matching.
- Nombres de ingredientes tal como los diría una persona común, no términos técnicos.

**Antes de continuar:** valida que el JSON completo sea sintácticamente correcto (`JSON.parse` sin errores). Es el paso donde más se rompen las cosas — revísalo dos veces.

---

## 5. Motor de recomendación (`script.js`)

Implementa exactamente esta lógica (puedes ajustar nombres de funciones, pero no la regla de negocio):

```javascript
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
```

Carga de datos y conexión con el formulario:

```javascript
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
```

Renderizado — respeta la regla de "nunca vacío":

```javascript
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
```

---

## 6. Estructura de `index.html`

- Header con logo (`assets/sazonia-logo.svg`) + nombre "SazónIA" + tagline corto.
- Formulario con un `<input type="text">` (placeholder tipo "Ej: pollo, arroz, cebolla") + botón "Buscar recetas" (`.btn-primario`).
- Sección `#resultados` donde se inyectan las tarjetas de receta vía JS.
- Sin `<form action>` que recargue la página — usar `e.preventDefault()` como en el código de arriba.

---

## 7. Responsive — checklist obligatorio

- [ ] Mobile-first: probar en viewport 375px de ancho antes que nada.
- [ ] Input y botón con altura táctil mínima de 44px.
- [ ] Grid de resultados: 1 columna en mobile, 2 columnas desde `min-width: 640px`.
- [ ] `--text-h1` y `--text-h2` escalados con `clamp()` para no romper el layout en mobile.
- [ ] Probar también en desktop ancho (>1200px) que el contenido no se estire de borde a borde — usar `max-width` contenedor (ej. 700–900px) centrado.

---

## 8. Definición de "hecho" (acceptance criteria)

La tarea está completa cuando:
1. Al escribir ingredientes que coinciden 100% con una receta, aparece esa receta con el mensaje "¡Tienes todo lo necesario!".
2. Al escribir ingredientes que no coinciden con nada exactamente, igual aparece al menos una receta sugerida con su lista de faltantes (nunca pantalla en blanco).
3. Al enviar el formulario vacío, no rompe nada (el `required` del input ya lo previene, pero valida igual en JS).
4. No hay errores en la consola del navegador (F12).
5. El sitio se ve y funciona correctamente en un viewport de celular (375px) y en desktop.
6. Todos los colores, fuentes y componentes visuales usan los tokens de la sección 3 — cero valores hardcodeados fuera de esos tokens.
7. El logo aparece en el header.
8. `data/recetas.json` es válido y contiene entre 12 y 15 recetas de plato de fondo.

---

## 9. Reglas de trabajo para el agente

- No instales dependencias npm ni agregues `package.json` salvo que sea estrictamente necesario para el deploy en Vercel (no debería serlo para un sitio estático).
- No modifiques la estructura de carpetas ya creada.
- Haz commits pequeños y descriptivos por cada bloque funcional (ej. `feat: motor de recomendación`, `feat: UI responsive`, `feat: datos de recetas`).
- Si algo de esta especificación es ambiguo, prioriza siempre la regla de negocio de la sección 0 (nunca pantalla vacía) y el alcance de la sección 1 (no agregar funcionalidad de más).
- Al terminar, deja el proyecto listo para `git push` y deploy en Vercel sin pasos de build adicionales.
