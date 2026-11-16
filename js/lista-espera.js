// =========================================================
// ViveCampus — lista de espera
// Valida el formulario y envía las respuestas a un Google Form del proyecto.
// =========================================================

// ---------- 1. Conexión con Google Forms ----------
// Formulario "Lista de espera ViveCampus" en la cuenta vivecampusproyecto@gmail.com.
// Las respuestas caen en la hoja "Respuestas lista de espera ViveCampus" de esa cuenta.
// - FORM_ID: el código del formulario publicado (va en la URL de envío).
// - CAMPOS: el número interno de cada pregunta, sacado del "enlace prellenado".
// Si algún día vacías FORM_ID, el formulario vuelve a "modo prueba": valida y muestra
// el mensaje de gracias, pero no envía nada.
const GOOGLE_FORM = {
  FORM_ID: "1FAIpQLSdgqcvopYOgZ4ubftiYOy3oSqtFeBZMP89YoZWTW4AQR8dJ4w",
  CAMPOS: {
    nombre: "entry.1251296849",
    correo: "entry.1336725185",
    rol: "entry.1531009376",
    ciudad: "entry.1215654857",
    prioridad: "entry.594913401",
    experiencia: "entry.715654150",
  },
};

// ---------- 2. Elementos ----------
const formEspera = document.getElementById("formulario-espera");
const errorEspera = document.getElementById("formulario-error");
const botonEnviar = document.getElementById("formulario-enviar");
const graciasEspera = document.getElementById("formulario-gracias");
const campoRol = document.getElementById("campo-rol");

// ---------- 3. Validación ----------
// Usamos las reglas del propio HTML (required, type="email") con checkValidity(),
// pero mostramos nuestros mensajes en vez de las burbujas del navegador.
function mensajeDeError(campo) {
  if (campo.validity.valueMissing) {
    if (campo.type === "checkbox") return "Debes aceptar el uso de tus datos para unirte.";
    if (campo.type === "radio") return "Cuéntanos si alguna vez te pasó lo del inmueble distinto.";
    return "Completa todos los campos.";
  }
  if (campo.validity.typeMismatch) return "Revisa tu correo: parece que le falta algo (ej. nombre@gmail.com).";
  return "Revisa los datos del formulario.";
}

function validar() {
  // Quitamos marcas de errores anteriores
  formEspera.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));

  const invalidos = [...formEspera.elements].filter((c) => c.willValidate && !c.checkValidity());
  if (invalidos.length === 0) {
    errorEspera.hidden = true;
    return true;
  }

  invalidos.forEach((c) => c.setAttribute("aria-invalid", "true"));
  errorEspera.textContent = mensajeDeError(invalidos[0]);
  errorEspera.hidden = false;
  invalidos[0].focus(); // llevamos al usuario al primer campo con problema
  return false;
}

// ---------- 4. Envío ----------
async function enviarAGoogleForms(datos) {
  const cuerpo = new FormData();
  for (const [clave, entrada] of Object.entries(GOOGLE_FORM.CAMPOS)) {
    cuerpo.append(entrada, datos.get(clave) ?? "");
  }

  // "no-cors": Google no deja leer su respuesta desde otra página.
  // Si la red falla, fetch lanza un error; si llega, asumimos que se guardó.
  await fetch(`https://docs.google.com/forms/d/e/${GOOGLE_FORM.FORM_ID}/formResponse`, {
    method: "POST",
    mode: "no-cors",
    body: cuerpo,
  });
}

function mostrarGracias() {
  formEspera.hidden = true;
  graciasEspera.hidden = false;
  graciasEspera.focus(); // el lector de pantalla anuncia el mensaje
}

formEspera.addEventListener("submit", async (evento) => {
  evento.preventDefault(); // sin esto, el navegador recargaría la página
  if (!validar()) return;

  const datos = new FormData(formEspera);

  // Si un bot llenó el campo trampa, fingimos éxito y no enviamos nada
  if (datos.get("sitio_web")) {
    mostrarGracias();
    return;
  }

  if (!GOOGLE_FORM.FORM_ID) {
    console.info("Lista de espera en modo prueba (falta FORM_ID). Datos:", Object.fromEntries(datos));
    mostrarGracias();
    return;
  }

  // Mientras se envía: botón desactivado, para que nadie lo toque dos veces
  botonEnviar.disabled = true;
  botonEnviar.textContent = "Enviando…";

  try {
    await enviarAGoogleForms(datos);
    mostrarGracias();
  } catch (error) {
    console.error("No se pudo enviar la lista de espera:", error);
    errorEspera.textContent = "No pudimos enviar tus datos. Revisa tu conexión e inténtalo de nuevo.";
    errorEspera.hidden = false;
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.textContent = "Unirme a la lista";
  }
});

// Cuando el usuario corrige un campo marcado en rojo, se le quita la marca
formEspera.addEventListener("input", (evento) => {
  if (evento.target.checkValidity()) evento.target.removeAttribute("aria-invalid");
});
formEspera.addEventListener("change", (evento) => {
  // Los radio comparten el error: al elegir uno, se limpian todos
  if (evento.target.type === "radio") {
    formEspera.querySelectorAll(`[name="${evento.target.name}"]`).forEach((r) => r.removeAttribute("aria-invalid"));
  }
});

// ---------- 5. "Publicar mi inmueble" deja elegido el rol de arrendador ----------
document.querySelectorAll("[data-rol]").forEach((enlace) => {
  enlace.addEventListener("click", () => {
    campoRol.value = enlace.dataset.rol;
  });
});
