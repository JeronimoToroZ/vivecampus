// =========================================================
// ViveCampus — lógica general y animaciones
// Íconos, scroll suave (Lenis) y animaciones de entrada (GSAP + ScrollTrigger).
// =========================================================

// ---------- 1. Íconos ----------
// Convierte cada <i data-lucide="nombre"> en su ícono SVG
if (window.lucide) lucide.createIcons();

// ---------- 2. Navbar: sombra al hacer scroll ----------
const navbar = document.querySelector(".navbar");

function actualizarNavbar() {
  navbar.classList.toggle("navbar--scroll", window.scrollY > 20);
}

window.addEventListener("scroll", actualizarNavbar, { passive: true });
actualizarNavbar();

// Preferencia del sistema: menos movimiento (la usan el menú y las animaciones)
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- 3. Menú de celular ----------
const menuBoton = document.getElementById("menu-boton");
const menu = document.getElementById("menu-principal");

// Se declara aquí arriba porque el menú y las animaciones lo comparten.
// Si las animaciones no se activan, se queda en null y el menú igual funciona.
let lenis = null;

function cambiarMenu(abrir) {
  navbar.classList.toggle("navbar--menu-abierto", abrir);
  menuBoton.setAttribute("aria-expanded", String(abrir));
  menuBoton.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");

  // Con el menú abierto, la página de atrás no se mueve
  document.body.style.overflow = abrir ? "hidden" : "";
  if (lenis) abrir ? lenis.stop() : lenis.start();
}

function menuAbierto() {
  return navbar.classList.contains("navbar--menu-abierto");
}

menuBoton.addEventListener("click", () => {
  cambiarMenu(!menuAbierto());
  if (menuAbierto()) menu.querySelector("a").focus(); // el teclado salta al primer enlace
});

// Al tocar un enlace: cerrar el menú y luego ir a la sección
menu.addEventListener("click", (evento) => {
  const enlace = evento.target.closest('a[href^="#"]');
  if (!enlace || !menuAbierto()) return; // en escritorio, el enlace funciona normal

  evento.preventDefault();
  evento.stopPropagation(); // que nadie más procese este clic: ya lo manejamos aquí
  cambiarMenu(false);

  const destino = document.querySelector(enlace.getAttribute("href"));
  if (!destino) return;
  if (lenis) lenis.scrollTo(destino); // Lenis ya respeta el scroll-margin-top del CSS
  else destino.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth" });
});

// Escape cierra el menú y devuelve el foco al botón
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && menuAbierto()) {
    cambiarMenu(false);
    menuBoton.focus();
  }
});

// Si la pantalla se agranda (girar el celular, ventana más ancha), el menú se cierra
window.matchMedia("(min-width: 761px)").addEventListener("change", (consulta) => {
  if (consulta.matches && menuAbierto()) cambiarMenu(false);
});

// ---------- 4. Animaciones ----------
// Regla de oro: si el usuario pidió menos movimiento en su sistema,
// o las librerías no cargaron, la página se muestra completa y quieta.
const hayLibrerias = window.gsap && window.ScrollTrigger && window.Lenis;

if (!sinMovimiento && hayLibrerias) {
  iniciarAnimaciones();
}

function iniciarAnimaciones() {
  gsap.registerPlugin(ScrollTrigger);

  // ----- 3.1 Scroll suave con Lenis -----
  lenis = new Lenis({
    duration: 1.1,
    anchors: true, // los enlaces #seccion también se mueven suave (el espacio para la navbar lo da scroll-margin-top en el CSS)
  });

  // Lenis y GSAP comparten el mismo "reloj", así las animaciones de scroll no tiemblan
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((tiempo) => lenis.raf(tiempo * 1000));
  gsap.ticker.lagSmoothing(0);

  // Mientras la ventana de detalle está abierta, la página de atrás no se mueve
  const ventana = document.getElementById("detalle");
  new MutationObserver(() => (ventana.open ? lenis.stop() : lenis.start())).observe(ventana, {
    attributes: true,
    attributeFilter: ["open"],
  });

  // ----- 3.2 Entrada del hero (al cargar la página) -----
  gsap
    .timeline({ defaults: { ease: "power3.out", duration: 0.9 } })
    .from(".hero__etiqueta", { y: 20, opacity: 0 })
    .from(".hero__titulo", { y: 40, opacity: 0 }, "-=0.6") // "-=0.6": empieza antes de que termine la anterior
    .from(".hero__subtitulo", { y: 20, opacity: 0 }, "-=0.6")
    .from(".hero__botones .boton", { y: 20, opacity: 0, stagger: 0.1 }, "-=0.6")
    .from(".hero__dato", { opacity: 0 }, "-=0.4");

  // ----- 3.3 Títulos de sección: aparecen al llegar a ellos -----
  gsap.utils.toArray(".seccion__etiqueta, .seccion__titulo").forEach((elemento) => {
    gsap.from(elemento, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: elemento,
        start: "top 85%", // cuando el borde superior llega al 85 % de la pantalla
      },
    });
  });

  // ----- 3.4 Grupos (tarjetas, pasos, beneficios…): entran uno tras otro -----
  // batch agrupa los elementos que aparecen al mismo tiempo y los anima en cascada.
  const grupos = [
    ".tarjeta-problema",
    ".paso",
    ".verificacion",
    ".filtros",
    ".calculadora__campos",
    ".calculadora__resultado",
    ".beneficio",
    ".plan",
    ".pregunta",
    ".lista-espera__puntos li",
    ".formulario",
  ].join(", ");

  gsap.set(grupos, { y: 40, opacity: 0 });

  ScrollTrigger.batch(grupos, {
    start: "top 88%",
    once: true, // se anima una sola vez; al volver a subir ya está ahí
    onEnter: (elementos) =>
      gsap.to(elementos, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
      }),
  });

  // ----- 3.5 El "8 de 10" del problema cuenta desde 0 -----
  const cifra = document.querySelector(".tarjeta-problema__cifra");
  if (cifra) {
    const numero = { valor: 0 };
    gsap.to(numero, {
      valor: 8,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: { trigger: cifra, start: "top 85%" },
      onUpdate: () => (cifra.textContent = `${Math.round(numero.valor)} de 10`),
    });
  }
}
