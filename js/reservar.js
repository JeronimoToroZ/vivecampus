// =========================================================
// ViveCampus — página de reserva ("Confirma y paga")
// Es una SIMULACIÓN: no cobra, no pide datos de tarjeta y no envía nada.
// =========================================================

// ---------- 1. Elementos y ayudas ----------
const formReserva = document.getElementById("form-reserva");
const bloqueReserva = document.getElementById("reserva");
const bloqueError = document.getElementById("reserva-error");
const bloqueLista = document.getElementById("reserva-lista");
const resumen = document.getElementById("resumen-reserva");
const errorCampos = document.getElementById("reserva-error-campos");
const listaRevision = document.getElementById("revision");
const campoIngreso = document.getElementById("campo-ingreso");
const campoDuracion = document.getElementById("campo-duracion");

let apto = null;
let pasoActual = 1;

const formatoCOP = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const cop = (n) => "COP " + formatoCOP.format(n);

function dibujarIconos() {
  if (window.lucide) lucide.createIcons();
}

// "2026-12-01" -> "1 de diciembre de 2026"
function fechaLarga(texto) {
  if (!texto) return "";
  const [a, m, d] = texto.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

// ---------- 2. Resumen del apartamento (columna derecha) ----------
function pintarResumen() {
  const meses = Number(campoDuracion.value);
  const verificaciones = Object.values(apto.verificacion).filter(Boolean).length;

  resumen.innerHTML = `
    <div class="resumen-reserva__cabecera">
      <img src="${apto.foto}" alt="${apto.nombre}"
           onerror="this.onerror=null; this.src='${apto.fotoConjunto}'">
      <div>
        <p class="tarjeta__conjunto">${apto.conjunto}</p>
        <h2>${apto.nombre}</h2>
        <p class="resumen-reserva__verif"><i data-lucide="badge-check"></i> ${verificaciones} de 3 verificaciones</p>
      </div>
    </div>
    <h3>Detalle del pago</h3>
    <dl class="resumen-reserva__filas">
      <div><dt>Arriendo mensual</dt><dd>${cop(apto.precio)}</dd></div>
      <div><dt>Duración del contrato</dt><dd>${meses} meses</dd></div>
      <div><dt>Tarifa ViveCampus para estudiantes</dt><dd>${cop(0)}</dd></div>
      <div><dt>Depósito</dt><dd>No aplica</dd></div>
    </dl>
    <div class="resumen-reserva__total">
      <span>Total a pagar hoy <small>(primer mes)</small></span>
      <strong>${cop(apto.precio)}</strong>
    </div>
    <p class="resumen-reserva__nota">
      Valor total del contrato: ${cop(apto.precio * meses)}.
      En vivienda urbana no se cobran depósitos en dinero (Ley 820 de 2003).
    </p>`;
  dibujarIconos();
}

// ---------- 3. Pasos ----------
// Muestra el paso activo, colapsa los terminados (con su resumen) y bloquea los siguientes
function mostrarPaso(numero) {
  pasoActual = numero;
  document.querySelectorAll(".paso-reserva").forEach((paso) => {
    const n = Number(paso.dataset.paso);
    paso.classList.toggle("paso-reserva--activo", n === numero);
    paso.classList.toggle("paso-reserva--hecho", n < numero);
    paso.classList.toggle("paso-reserva--bloqueado", n > numero);
    paso.querySelector(".paso-reserva__cuerpo").hidden = n !== numero;
    paso.querySelector(".paso-reserva__resumen")?.toggleAttribute("hidden", n >= numero);
    paso.querySelector(".paso-reserva__editar")?.toggleAttribute("hidden", n >= numero);
  });
  errorCampos.hidden = true;
  if (numero === 3) pintarRevision();
}

// Valida solo los campos del paso indicado
function validarPaso(numero) {
  const paso = document.querySelector(`.paso-reserva[data-paso="${numero}"]`);
  const campos = [...paso.querySelectorAll("input, select")].filter((c) => c.willValidate);
  campos.forEach((c) => c.removeAttribute("aria-invalid"));
  const invalidos = campos.filter((c) => !c.checkValidity());
  if (invalidos.length === 0) return true;

  invalidos.forEach((c) => c.setAttribute("aria-invalid", "true"));
  const primero = invalidos[0];
  errorCampos.textContent =
    primero.type === "radio" ? "Elige un método de pago."
    : primero.type === "checkbox" ? "Debes aceptar las condiciones para continuar."
    : primero.validity.typeMismatch ? "Revisa tu correo (ej. nombre@gmail.com)."
    : primero.validity.rangeUnderflow ? "La fecha de ingreso no puede ser anterior a hoy."
    : "Completa todos los campos de este paso.";
  errorCampos.hidden = false;
  primero.focus();
  return false;
}

function resumenPaso(numero) {
  const d = new FormData(formReserva);
  const texto =
    numero === 1
      ? `${d.get("nombre")} · ${d.get("correo")} · ingreso el ${fechaLarga(d.get("ingreso"))}`
      : `Pago con ${d.get("metodo")}`;
  document.querySelector(`.paso-reserva[data-paso="${numero}"] .paso-reserva__resumen`).textContent = texto;
}

function pintarRevision() {
  const d = new FormData(formReserva);
  listaRevision.innerHTML = `
    <li><span>Apartamento</span><strong>${apto.nombre} · ${apto.conjunto}</strong></li>
    <li><span>Ingreso</span><strong>${fechaLarga(d.get("ingreso"))}</strong></li>
    <li><span>Contrato</span><strong>${d.get("duracion")} meses</strong></li>
    <li><span>Método de pago</span><strong>${d.get("metodo")}</strong></li>
    <li><span>Total a pagar hoy</span><strong>${cop(apto.precio)}</strong></li>`;
}

// ---------- 4. Confirmación ----------
function mostrarConfirmacion() {
  const d = new FormData(formReserva);
  const codigo = "VC-" + Math.floor(100000 + Math.random() * 900000); // código de ejemplo

  bloqueReserva.hidden = true;
  bloqueLista.hidden = false;
  bloqueLista.innerHTML = `
    <i data-lucide="party-popper" class="reserva-lista__icono"></i>
    <h2>¡Solicitud de reserva enviada!</h2>
    <p class="reserva-lista__codigo">Código de reserva: <strong>${codigo}</strong> <small>(simulación)</small></p>
    <p>${d.get("nombre").split(" ")[0]}, reservaste <strong>${apto.nombre}</strong> en ${apto.conjunto}
       a partir del ${fechaLarga(d.get("ingreso"))}.</p>
    <ol class="reserva-lista__pasos">
      <li>${apto.arrendador?.nombre ?? "El arrendador"} recibe tu solicitud y la confirma en 24 horas.</li>
      <li>Firmas el contrato digital de ${d.get("duracion")} meses.</li>
      <li>Pagas el primer mes con ${d.get("metodo")} y coordinas la entrega de llaves.</li>
    </ol>
    <a href="index.html" class="boton boton--primario">Volver al inicio</a>`;
  dibujarIconos();
  window.scrollTo({ top: 0, behavior: "smooth" });
  bloqueLista.focus({ preventScroll: true });
}

// ---------- 5. Eventos ----------
formReserva.addEventListener("click", (evento) => {
  const siguiente = evento.target.closest("[data-siguiente]");
  if (siguiente) {
    const n = Number(siguiente.dataset.siguiente);
    if (validarPaso(n)) {
      resumenPaso(n);
      mostrarPaso(n + 1);
    }
  }
  const editar = evento.target.closest("[data-editar]");
  if (editar) mostrarPaso(Number(editar.dataset.editar));
});

formReserva.addEventListener("submit", (evento) => {
  evento.preventDefault(); // nunca se envía a ningún lado: es una demostración
  if (validarPaso(3)) mostrarConfirmacion();
});

formReserva.addEventListener("input", (evento) => {
  if (evento.target.checkValidity()) evento.target.removeAttribute("aria-invalid");
});

campoDuracion.addEventListener("change", pintarResumen);

// ---------- 6. Inicio: leer el ?id= de la dirección y cargar el apartamento ----------
async function iniciar() {
  // reservar.html?id=6 -> "6"
  const id = Number(new URLSearchParams(location.search).get("id"));

  // La fecha de ingreso no puede ser antes de hoy
  const hoy = new Date();
  campoIngreso.min = [hoy.getFullYear(), String(hoy.getMonth() + 1).padStart(2, "0"), String(hoy.getDate()).padStart(2, "0")].join("-");

  try {
    const respuesta = await fetch("data/apartamentos.json");
    const apartamentos = await respuesta.json();
    apto = apartamentos.find((a) => a.id === id);
  } catch (error) {
    console.error("No se pudieron cargar los apartamentos:", error);
  }

  if (!apto) {
    bloqueError.hidden = false;
    dibujarIconos();
    return;
  }

  document.title = `Reservar ${apto.nombre} — ViveCampus`;
  bloqueReserva.hidden = false;
  pintarResumen();
  mostrarPaso(1);
  dibujarIconos();
}

iniciar();
