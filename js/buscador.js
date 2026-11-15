// =========================================================
// ViveCampus — buscador
// Lee data/apartamentos.json, aplica los filtros y dibuja las tarjetas.
// =========================================================

// ---------- 1. Referencias a los elementos del HTML ----------
// Las buscamos una sola vez al inicio y las guardamos en constantes.
const contenedorResultados = document.getElementById("resultados");
const contador = document.getElementById("contador-resultados");
const formularioFiltros = document.getElementById("filtros");
const filtroPrecio = document.getElementById("filtro-precio");
const filtroHabitaciones = document.getElementById("filtro-habitaciones");
const filtroMinutos = document.getElementById("filtro-minutos");
const ventanaDetalle = document.getElementById("detalle");
const contenidoDetalle = document.getElementById("detalle-contenido");
const botonCerrar = document.getElementById("detalle-cerrar");

// Aquí guardamos los apartamentos cuando lleguen del JSON.
let apartamentos = [];

// Cuántas tarjetas se muestran a la vez y cuántas hay en pantalla ahora
const POR_PAGINA = 6;
let cantidadVisible = POR_PAGINA;
const botonVerMas = document.getElementById("ver-mas");

// El apartamento que está abierto en la ventana de detalle.
let aptoSeleccionado = null;

// Textos de cada verificación (los usa el detalle).
const VERIFICACIONES = {
  documentos: { titulo: "Documentos revisados", icono: "file-check" },
  inspeccion: { titulo: "Inspección presencial", icono: "house" },
  arrendador: { titulo: "Arrendador verificado", icono: "user-check" },
};

// ---------- 2. Funciones de ayuda ----------

// Dibuja los íconos de Lucide. Si la librería no cargó (sin internet),
// la página sigue funcionando, solo que sin íconos.
function dibujarIconos() {
  if (window.lucide) lucide.createIcons();
}

// 1350000 -> "1.350.000" (formato colombiano)
function formatearPrecio(numero) {
  return new Intl.NumberFormat("es-CO").format(numero);
}

// Cuenta cuántas de las 3 verificaciones están en true
function contarVerificaciones(verificacion) {
  return Object.values(verificacion).filter(Boolean).length;
}

// Devuelve el texto y la clase CSS de la insignia según el conteo.
// Todo arrendador paga el Plan Verificado, así que un inmueble nunca está
// "sin verificar": o ya pasó las 3 revisiones, o está en proceso.
function describirInsignia(total) {
  if (total === 3) return { texto: "Verificado · 3 de 3", clase: "insignia--completa" };
  if (total === 0) return { texto: "Verificación pendiente", clase: "insignia--ninguna" };
  return { texto: `En verificación · ${total} de 3`, clase: "insignia--parcial" };
}

// Si una foto no carga, probamos la de respaldo; si tampoco, la quitamos
// y queda el fondo verde con el ícono. Así nunca se ve una imagen rota.
function fotoFallida(img) {
  const respaldo = img.dataset.respaldo;
  if (respaldo) {
    img.dataset.respaldo = ""; // solo se intenta una vez
    img.src = respaldo;
  } else {
    img.closest(".tarjeta__foto")?.querySelector(".foto-ilustrativa")?.remove();
    img.remove();
  }
}

// HTML de la foto: primero el interior del apartamento; de respaldo, la del conjunto
function crearFoto(apto) {
  return `
    <div class="tarjeta__foto">
      <i data-lucide="building-2"></i>
      <img src="${apto.foto}" data-respaldo="${apto.fotoConjunto}"
           alt="${apto.nombre} en ${apto.conjunto}" loading="lazy"
           onerror="fotoFallida(this)">
      <span class="foto-ilustrativa">Imagen ilustrativa</span>
    </div>`;
}

// ---------- 3. Dibujar una tarjeta ----------
function crearTarjeta(apto) {
  const total = contarVerificaciones(apto.verificacion);
  const insignia = describirInsignia(total);

  // Un ícono por verificación: verde si pasó, gris si no
  const iconos = Object.entries(VERIFICACIONES)
    .map(([clave, info]) => {
      const estado = apto.verificacion[clave] ? "ok" : "pendiente";
      return `<i data-lucide="${info.icono}" class="${estado}"></i>`;
    })
    .join("");

  return `
    <article class="tarjeta">
      ${crearFoto(apto)}
      <div class="tarjeta__cuerpo">
        <p class="tarjeta__conjunto">${apto.conjunto}</p>
        <h3 class="tarjeta__nombre">${apto.nombre}</h3>
        <p class="tarjeta__datos">
          ${apto.habitaciones} hab. · ${apto.minutosUninorte} min a pie de Uninorte
        </p>
        <p class="tarjeta__precio">COP ${formatearPrecio(apto.precio)} <span>/ mes</span></p>
        <div class="insignia ${insignia.clase}">
          <span class="insignia__iconos">${iconos}</span>
          ${insignia.texto}
        </div>
        <button class="boton boton--primario" data-id="${apto.id}">Ver detalles</button>
      </div>
    </article>`;
}

// ---------- 4. Filtrar ----------
function filtrarApartamentos() {
  const precio = filtroPrecio.value;
  const habitaciones = filtroHabitaciones.value;
  const minutos = filtroMinutos.value;

  return apartamentos.filter((apto) => {
    // Precio: el valor del select es "min-max"
    if (precio !== "todos") {
      const [min, max] = precio.split("-").map(Number);
      if (apto.precio < min || apto.precio > max) return false;
    }

    // Habitaciones: "3" significa 3 o más
    if (habitaciones !== "todas") {
      const hab = Number(habitaciones);
      if (hab === 3 ? apto.habitaciones < 3 : apto.habitaciones !== hab) return false;
    }

    // Minutos: hasta X minutos
    if (minutos !== "todos" && apto.minutosUninorte > Number(minutos)) return false;

    return true; // pasó todos los filtros
  });
}

// ---------- 5. Mostrar resultados en pantalla ----------
// desde: índice de la primera tarjeta nueva (para animar solo esas al tocar "Ver más")
function mostrarResultados(desde = 0) {
  const lista = filtrarApartamentos();
  const visibles = lista.slice(0, cantidadVisible); // slice: toma solo las primeras N

  // "Mostrando 6 de 22" solo si faltan por mostrar; si se ven todos, basta con el total
  if (lista.length === 1) contador.textContent = "1 apartamento encontrado";
  else if (visibles.length === lista.length) contador.textContent = `${lista.length} apartamentos encontrados`;
  else contador.textContent = `Mostrando ${visibles.length} de ${lista.length} apartamentos`;

  // El botón solo aparece si quedan apartamentos por mostrar
  const restantes = lista.length - visibles.length;
  botonVerMas.hidden = restantes <= 0;
  botonVerMas.textContent = `Ver más apartamentos (${restantes})`;

  if (lista.length === 0) {
    contenedorResultados.innerHTML = `
      <p class="sin-resultados">
        No hay apartamentos con esos filtros. Prueba ampliar el precio o la distancia.
      </p>`;
    return;
  }

  contenedorResultados.innerHTML = visibles.map(crearTarjeta).join("");
  dibujarIconos(); // convierte los íconos nuevos en SVG
  animarTarjetas(desde);
}

// Al filtrar, las tarjetas nuevas entran una tras otra
function animarTarjetas(desde = 0) {
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!window.gsap || reducir) return;

  const nuevas = [...document.querySelectorAll("#resultados .tarjeta")].slice(desde);
  gsap.from(nuevas, {
    y: 24,
    opacity: 0,
    duration: 0.45,
    ease: "power2.out",
    stagger: 0.06, // 0,06 s entre una tarjeta y la siguiente
  });
}

// ---------- 6. Ventana de detalle ----------
function abrirDetalle(id) {
  const apto = apartamentos.find((a) => a.id === id);
  if (!apto) return;
  aptoSeleccionado = apto; // lo recordamos para la calculadora

  const listaVerificaciones = Object.entries(VERIFICACIONES)
    .map(([clave, info]) => {
      const paso = apto.verificacion[clave];
      return `
        <li>
          <i data-lucide="${paso ? "circle-check" : "circle-dashed"}" class="${paso ? "ok" : "pendiente"}"></i>
          <div>
            <strong>${info.titulo}</strong>
            <small>${paso ? "Aprobado" : "Pendiente"}</small>
          </div>
        </li>`;
    })
    .join("");

  const resena = apto.resena
    ? `<blockquote class="resena">
         <p>"${apto.resena.texto}"</p>
         <small>${apto.resena.autor} · Reseña de ejemplo</small>
       </blockquote>`
    : `<p class="resena"><small>Este apartamento aún no tiene reseñas.</small></p>`;

  contenidoDetalle.innerHTML = `
    ${crearFoto(apto)}
    <div class="detalle__cuerpo">
      <p class="tarjeta__conjunto">${apto.conjunto} · Mallorquín</p>
      <h3>${apto.nombre}</h3>
      <p class="tarjeta__precio">COP ${formatearPrecio(apto.precio)} <span>/ mes</span></p>
      <p class="tarjeta__datos">
        ${apto.habitaciones} habitación(es) · ${apto.minutosUninorte} min a pie de Uninorte
      </p>
      <ul class="detalle__lista">${listaVerificaciones}</ul>
      ${resena}
      <figure class="detalle__conjunto">
        <img src="${apto.fotoConjunto}" alt="Fachada de ${apto.conjunto}" loading="lazy"
             onerror="this.parentElement.remove()">
        <figcaption>${apto.conjunto}</figcaption>
      </figure>
      <a href="#calculadora" class="boton boton--primario" id="detalle-calcular">Calcular mi costo mensual</a>
    </div>`;

  dibujarIconos();
  ventanaDetalle.showModal();
}

// ---------- 7. Eventos ----------

// Cada vez que cambia un filtro, volvemos a dibujar (no hace falta botón)
// Al cambiar un filtro se vuelve a empezar desde las primeras 6
formularioFiltros.addEventListener("change", () => {
  cantidadVisible = POR_PAGINA;
  mostrarResultados();
});

// "Ver más": 6 tarjetas más; solo se animan las nuevas
botonVerMas.addEventListener("click", () => {
  const antes = cantidadVisible;
  cantidadVisible += POR_PAGINA;
  mostrarResultados(antes);

  // Para quien usa teclado: el foco pasa al botón de la primera tarjeta nueva
  contenedorResultados.querySelectorAll(".tarjeta")[antes]?.querySelector("button")?.focus({ preventScroll: true });
});

// Delegación de eventos: un solo listener en el contenedor atiende
// los clics de TODOS los botones "Ver detalles", incluso los que se crean después.
contenedorResultados.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-id]");
  if (boton) abrirDetalle(Number(boton.dataset.id));
});

// Cerrar el detalle: con la X, haciendo clic afuera, o al ir a la calculadora
botonCerrar.addEventListener("click", () => ventanaDetalle.close());

ventanaDetalle.addEventListener("click", (evento) => {
  if (evento.target === ventanaDetalle) ventanaDetalle.close(); // clic en el fondo oscuro
  if (evento.target.closest("#detalle-calcular")) {
    ventanaDetalle.close();

    // Avisamos a la calculadora qué apartamento se eligió.
    // buscador.js no toca la calculadora directamente: solo lanza un evento,
    // y calculadora.js decide qué hacer con él. Así cada archivo es independiente.
    document.dispatchEvent(
      new CustomEvent("apartamento-elegido", { detail: aptoSeleccionado })
    );
  }
});

// El dato del hero se calcula con los datos reales: si agregan un apartamento, se actualiza solo
function actualizarDatoHero() {
  const dato = document.getElementById("hero-dato");
  if (!dato) return;
  const conjuntos = new Set(apartamentos.map((a) => a.conjunto)).size; // Set elimina repetidos
  dato.textContent = `${conjuntos} conjuntos y ${apartamentos.length} apartamentos · a minutos de Uninorte`;
}

// ---------- 8. Inicio: cargar el JSON ----------
async function iniciarBuscador() {
  try {
    const respuesta = await fetch("data/apartamentos.json");
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    apartamentos = await respuesta.json();
    actualizarDatoHero();
    mostrarResultados();
  } catch (error) {
    console.error("No se pudieron cargar los apartamentos:", error);
    contenedorResultados.innerHTML = `
      <p class="sin-resultados">
        No se pudieron cargar los apartamentos. ¿Abriste la página con Live Server?
      </p>`;
  }
}

iniciarBuscador();
