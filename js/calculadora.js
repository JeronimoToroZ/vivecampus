// =========================================================
// ViveCampus — calculadora de costos
// Suma arriendo, servicios, transporte, alimentación y otros gastos.
// =========================================================

// ---------- 1. Configuración de cada gasto ----------
// Un solo arreglo describe todos los gastos: su id en el HTML, su nombre y su color.
// Para agregar un gasto nuevo, agregas una línea aquí y un <input> en el HTML.
const GASTOS = [
  { id: "gasto-alquiler", nombre: "Arriendo", color: "#3f5614" },
  { id: "gasto-servicios", nombre: "Servicios públicos", color: "#6b8e23" },
  { id: "gasto-transporte", nombre: "Transporte", color: "#9bb35a" },
  { id: "gasto-alimentacion", nombre: "Alimentación", color: "#c4d295" },
  { id: "gasto-otros", nombre: "Otros gastos", color: "#e2e8c8" },
];

// Tope por campo: 999.999.999 (9 dígitos). Nadie paga mil millones al mes.
const MAX_DIGITOS = 9;

const formCalculadora = document.getElementById("calculadora-form");
const campoAlquiler = document.getElementById("gasto-alquiler");
const textoTotal = document.getElementById("calculadora-total");
const barra = document.getElementById("calculadora-barra");
const desglose = document.getElementById("calculadora-desglose");
const textoOrigen = document.getElementById("calculadora-origen");

// ---------- 2. Ayudas ----------
const formatoMiles = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

function formatearCOP(numero) {
  return "COP " + formatoMiles.format(numero);
}

// Convierte lo que escribió el usuario en un número entero de pesos.
// "1.350.000" -> 1350000 · "1.350.000,50" -> 1350000 (se ignoran los centavos)
// "$ 900.000" -> 900000  · "" o "abc" -> 0
function textoANumero(texto) {
  const parteEntera = texto.split(",")[0]; // en Colombia la coma separa decimales
  const digitos = parteEntera.replace(/\D/g, "").slice(0, MAX_DIGITOS);
  return digitos === "" ? 0 : Number(digitos);
}

function leerValor(id) {
  return textoANumero(document.getElementById(id).value);
}

// Reescribe el campo con puntos de miles mientras el usuario escribe,
// sin que el cursor salte al final.
function formatearCampo(campo) {
  const texto = campo.value;

  // ¿Cuántos dígitos hay a la izquierda del cursor?
  const cursor = campo.selectionStart ?? texto.length;
  const digitosAntes = texto.slice(0, cursor).replace(/\D/g, "").length;

  const [parteEntera, ...resto] = texto.split(",");
  const digitosEnteros = parteEntera.replace(/\D/g, "").slice(0, MAX_DIGITOS);

  // Sin dígitos (vacío, letras, "$", "-") -> el campo queda vacío
  let nuevoTexto = digitosEnteros === "" ? "" : formatoMiles.format(Number(digitosEnteros));

  // Si escribió coma, dejamos ver los centavos (máx. 2), aunque no se sumen
  if (resto.length > 0 && nuevoTexto !== "") {
    nuevoTexto += "," + resto.join("").replace(/\D/g, "").slice(0, 2);
  }

  campo.value = nuevoTexto;

  // Si estaba escribiendo al final (lo normal), el cursor sigue al final
  if (cursor === texto.length) {
    campo.setSelectionRange(nuevoTexto.length, nuevoTexto.length);
    return;
  }

  // Si estaba editando en medio, lo dejamos después del mismo número de dígitos
  let posicion = 0;
  let contados = 0;
  while (posicion < nuevoTexto.length && contados < digitosAntes) {
    if (/\d/.test(nuevoTexto[posicion])) contados++;
    posicion++;
  }
  campo.setSelectionRange(posicion, posicion);
}

// Porcentajes enteros que siempre suman exactamente 100
// (método del mayor residuo: redondea hacia abajo y reparte lo que falta
// a los que tenían la parte decimal más grande).
function porcentajesQueSuman100(valores, total) {
  if (total === 0) return valores.map(() => 0);

  const exactos = valores.map((v) => (v / total) * 100);
  const enteros = exactos.map(Math.floor);
  let faltan = 100 - enteros.reduce((a, b) => a + b, 0);

  exactos
    .map((exacto, i) => ({ i, residuo: exacto - enteros[i] }))
    .sort((a, b) => b.residuo - a.residuo)
    .forEach(({ i }) => {
      if (faltan > 0) {
        enteros[i]++;
        faltan--;
      }
    });

  return enteros;
}

// ---------- 3. Calcular y mostrar ----------
function calcular() {
  // Convertimos la configuración en datos con su valor actual
  const valores = GASTOS.map((gasto) => ({ ...gasto, valor: leerValor(gasto.id) }));

  // reduce: recorre la lista acumulando la suma
  const total = valores.reduce((suma, gasto) => suma + gasto.valor, 0);
  const porcentajes = porcentajesQueSuman100(valores.map((g) => g.valor), total);

  textoTotal.textContent = formatearCOP(total);

  // Barra: cada pedazo mide su porcentaje del total
  barra.innerHTML = valores
    .map((gasto, i) =>
      gasto.valor > 0
        ? `<span style="width:${(gasto.valor / total) * 100}%; background:${gasto.color}"
                 title="${gasto.nombre}: ${porcentajes[i]}%"></span>`
        : ""
    )
    .join("");

  // Desglose: una fila por gasto
  desglose.innerHTML = valores
    .map(
      (gasto, i) => `
        <li>
          <span class="desglose__nombre">
            <span class="desglose__punto" style="background:${gasto.color}"></span>
            ${gasto.nombre}
          </span>
          <span class="desglose__valor">${formatearCOP(gasto.valor)} <small>${porcentajes[i]}%</small></span>
        </li>`
    )
    .join("");
}

// ---------- 4. Eventos ----------

// "input" se dispara con cada tecla: formateamos el campo y recalculamos
formCalculadora.addEventListener("input", (evento) => {
  formatearCampo(evento.target);

  // Si el usuario cambia el arriendo a mano, ya no es el del apartamento elegido
  if (evento.target === campoAlquiler) {
    textoOrigen.textContent = "Cálculo personalizado";
  }

  calcular();
});

// Evita que Enter "envíe" el formulario y recargue la página
formCalculadora.addEventListener("submit", (evento) => evento.preventDefault());

// Cuando el buscador avisa que se eligió un apartamento, ponemos su precio
document.addEventListener("apartamento-elegido", (evento) => {
  const apto = evento.detail;
  if (!apto) return;

  campoAlquiler.value = formatoMiles.format(apto.precio);
  textoOrigen.textContent = `Calculando para: ${apto.nombre} · ${apto.conjunto}`;
  calcular();
});

// Primer cálculo con los valores por defecto
calcular();
