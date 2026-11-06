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

// Devuelve el texto y la clase CSS de la insignia según el conteo
function describirInsignia(total) {
  if (total === 3) return { texto: "3 de 3 verificaciones", clase: "insignia--completa" };
  if (total === 0) return { texto: "Sin verificar", clase: "insignia--ninguna" };
  return { texto: `${total} de 3 verificaciones`, clase: "insignia--parcial" };
}

// HTML de la foto: si la imagen no carga, se esconde y queda el fondo con ícono
function crearFoto(apto) {
  return `
    <div class="tarjeta__foto">
      <i data-lucide="building-2"></i>
      <img src="${apto.foto}" alt="${apto.nombre}" loading="lazy"
           onerror="this.remove()">
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
function mostrarResultados() {
  const lista = filtrarApartamentos();

  contador.textContent =
    lista.length === 1 ? "1 apartamento encontrado" : `${lista.length} apartamentos encontrados`;

  if (lista.length === 0) {
    contenedorResultados.innerHTML = `
      <p class="sin-resultados">
        No hay apartamentos con esos filtros. Prueba ampliar el precio o la distancia.
      </p>`;
    return;
  }

  contenedorResultados.innerHTML = lista.map(crearTarjeta).join("");
  dibujarIconos(); // convierte los íconos nuevos en SVG
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
      <a href="#calculadora" class="boton boton--primario" id="detalle-calcular">Calcular mi costo mensual</a>
    </div>`;

  dibujarIconos();
  ventanaDetalle.showModal();
}

// ---------- 7. Eventos ----------

// Cada vez que cambia un filtro, volvemos a dibujar (no hace falta botón)
formularioFiltros.addEventListener("change", mostrarResultados);

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

// ---------- 8. Inicio: cargar el JSON ----------
async function iniciarBuscador() {
  try {
    const respuesta = await fetch("data/apartamentos.json");
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    apartamentos = await respuesta.json();
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
