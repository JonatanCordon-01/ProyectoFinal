/* funciones.js - Completo y funcional
   Controla: navegación, login, carrito, carruseles, visibilidad y colores dinámicos.
*/

/* ------------------ Configuración global ------------------ */
const CARRUSEL_AUTOPLAY_MS = 9000;
let carrito = [];
let usuarioActivo = false;
let slideTimers = {};
let lastAction = {};

/* ------------------ Control de visualización ------------------ */
function ocultarTodas() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
}

function mostrar(id) {
  ocultarTodas();
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  controlarHeader(id);
}

/* ------------------ Header / Selector / Tienda ------------------ */
function controlarHeader(id) {
  const sel = document.getElementById('selector-tienda');
  if (!sel) return;

  if (
    id === 'inicio' || 
    id === 'login' || 
    id === 'registro' || 
    id === 'final' || 
    id === 'carrito'  
  ) {
    sel.style.display = 'none';
    document.body.setAttribute('data-tienda', 'inicio');
  } else {
    sel.style.display = 'inline-block';
    const sec = document.getElementById(id);
    const cat = sec?.dataset?.cat || id.split('-')[0] || id;
    document.body.setAttribute('data-tienda', cat);
    sel.value = cat;
    iniciarCarruselAuto(cat);
  }
}


/* ------------------ Navegación general ------------------ */
function mostrarInicio() {
  document.body.setAttribute('data-tienda', 'inicio');
  mostrar('inicio');
}

function abrirCategoria(tienda) {
  const sec = document.getElementById(tienda);
  if (!sec) return;
  document.body.setAttribute('data-tienda', tienda);
  mostrar(tienda);
  const sel = document.getElementById('selector-tienda');
  if (sel) { sel.value = tienda; sel.style.display = 'inline-block'; }
  iniciarCarruselAuto(tienda);
}

function cambiarTienda() {
  const sel = document.getElementById('selector-tienda');
  if (!sel) return;
  abrirCategoria(sel.value);
}

function abrirSubseccion(tienda, tipo) {
  const id = `${tienda}-${tipo}`;
  const sec = document.getElementById(id);
  if (!sec) return;
  document.body.setAttribute('data-tienda', tienda);
  mostrar(id);
}

function volverTienda(tienda) {
  abrirCategoria(tienda);
}

/* ------------------ Registro con contraseña (guarda en localStorage) ------------------ */
function registrar() {
  const nombre = (document.getElementById('reg-nombre')?.value || '').trim();
  const email = (document.getElementById('reg-email')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('reg-password')?.value || '');
  const edad = Number((document.getElementById('reg-edad')?.value || '').trim());
  const acepta = !!document.getElementById('reg-acepta')?.checked;

  // Campos del tutor (pueden no existir si no son menores)
  const tutorBox = document.getElementById('tutor-fields');
  const tutorNombre = tutorBox ? (document.getElementById('tutor-nombre')?.value || '').trim() : "";
  const tutorEmail  = tutorBox ? (document.getElementById('tutor-email')?.value || '').trim().toLowerCase() : "";
  const tutorAutoriza = tutorBox ? !!document.getElementById('tutor-autoriza')?.checked : false;

  const msg = document.getElementById('mensajeRegistro');

  /* ==========================
       VALIDACIONES BÁSICAS
     ========================== */
  if (!nombre || !email || !password || !edad || !acepta) {
    if (msg) { msg.textContent = 'Completa todos los campos y acepta los términos.'; msg.style.color = 'salmon'; }
    return;
  }

  if (password.length < 6) {
    if (msg) { msg.textContent = 'La contraseña debe tener al menos 6 caracteres.'; msg.style.color = 'salmon'; }
    return;
  }

  /* ==========================
      CUENTA DE PRUEBA: NO GUARDAR
     ========================== */
  if (email === 'alumno' || (nombre.toLowerCase() === 'alumno' && password === '2025')) {
    if (msg) { msg.textContent = 'Cuenta de prueba detectada; no se guardará en el sistema.'; msg.style.color = 'orange'; }
    mostrar('login');
    return;
  }

  /* ==========================
      VALIDACIÓN DE MENORES
     ========================== */
  let dataTutor = null;

  if (edad < 18) {
    // Se requiere la información del tutor
    if (!tutorNombre || !tutorEmail || !tutorAutoriza) {
      if (msg) { msg.textContent = 'El tutor debe completar sus datos y autorizar para continuar.'; msg.style.color = 'salmon'; }
      return;
    }

    dataTutor = {
      tutorNombre,
      tutorEmail,
      tutorAutoriza
    };
  }

  /* ==========================
      GUARDAR EN LOCALSTORAGE
     ========================== */
  let users = {};
  try {
    users = JSON.parse(localStorage.getItem('users') || '{}');
  } catch (e) {
    users = {};
  }

  if (users[email]) {
    if (msg) { msg.textContent = 'Ya existe una cuenta con ese correo.'; msg.style.color = 'salmon'; }
    return;
  }

  // Guardamos usuario con su tutor (si aplica)
  users[email] = { 
    nombre, 
    email, 
    password, 
    edad,
    tutor: dataTutor // null si es mayor
  };

  localStorage.setItem('users', JSON.stringify(users));

  if (msg) { msg.textContent = 'Registro exitoso. Ahora puedes iniciar sesión.'; msg.style.color = 'lightgreen'; }

  // Limpiar campos
  document.getElementById('reg-nombre').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('reg-edad').value = '';
  document.getElementById('reg-acepta').checked = false;

  if (document.getElementById('tutor-fields')) {
    document.getElementById('tutor-nombre').value = '';
    document.getElementById('tutor-email').value = '';
    document.getElementById('tutor-autoriza').checked = false;
  }

  mostrar('login');
}


/* ------------------ Iniciar sesión (usa localStorage o el usuario de prueba) ------------------ */
function iniciarSesion() {
  const userInput = (document.getElementById('usuario')?.value || '').trim().toLowerCase();
  const pass = (document.getElementById('contrasena')?.value || '').trim();
  const msg = document.getElementById('mensajeLogin');

  /* ============================================================================
      CASO ESPECIAL: CUENTA DE PRUEBA alumno / 2025
    ============================================================================ */
  if (userInput === 'alumno' && pass === '2025') {
    usuarioActivo = true;

    sessionStorage.setItem('activeUser', JSON.stringify({
      nombre: 'alumno',
      email: 'alumno',
      edad: 99,
      tutor: null,
      esMenor: false
    }));

    if (msg) { msg.textContent = 'Sesión iniciada (cuenta de prueba).'; msg.style.color = 'lightgreen'; }

    document.getElementById('btn-login')?.style.setProperty('display','none');
    document.getElementById('btn-registro')?.style.setProperty('display','none');
    mostrarInicio();
    return;
  }

  /* ============================================================================
      BUSCAR USUARIO REGISTRADO EN localStorage
    ============================================================================ */
  let users = {};
  try { 
    users = JSON.parse(localStorage.getItem('users') || '{}'); 
  } catch(e){ 
    users = {}; 
  }

  // Buscar por email o por nombre
  const user = Object.values(users).find(u =>
    (u.email === userInput || u.nombre.toLowerCase() === userInput)
  );

  if (!user || user.password !== pass) {
    if (msg) { msg.textContent = 'Usuario o contraseña incorrectos.'; msg.style.color = 'salmon'; }
    return;
  }

  /* ============================================================================
      DETECTAR SI ES MENOR Y GUARDAR INFORMACIÓN DEL TUTOR
    ============================================================================ */
  const esMenor = Number(user.edad) < 18;
  let tutorEmail = null;

  if (esMenor && user.tutor) {
    tutorEmail = user.tutor.tutorEmail;
  }

  usuarioActivo = true;

  // Guardar usuario activo en sessionStorage
  sessionStorage.setItem('activeUser', JSON.stringify({
    nombre: user.nombre,
    email: user.email,
    edad: user.edad,
    tutor: user.tutor || null,
    esMenor: esMenor,
    tutorEmail: tutorEmail
  }));

  /* Mensaje bonito */
  if (msg) { 
    msg.textContent = esMenor 
      ? 'Sesión iniciada (cuenta supervisada por tutor legal).' 
      : 'Sesión iniciada correctamente.';
    msg.style.color = 'lightgreen';
  }

  /* Ocultar botones */
  document.getElementById('btn-login')?.style.setProperty('display','none');
  document.getElementById('btn-registro')?.style.setProperty('display','none');

  mostrarInicio();
}


/* ------------------ Carrito global ------------------ */
function agregarCarrito(nombre, precio) {
  if (!usuarioActivo) { alert('Debes iniciar sesión para agregar productos al carrito.'); return; }
  carrito.push({ nombre, precio: Number(precio) });
  actualizarContador();
}

function actualizarContador() {
  const c = document.getElementById('contador');
  if (c) c.textContent = carrito.length;
}

function mostrarCarrito() {
  if (!usuarioActivo) { alert('Inicia sesión para ver tu carrito.'); return; }
  mostrar('carrito');
  const lista = document.getElementById('listaCarrito');
  lista.innerHTML = '';
  let suma = 0;
  carrito.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = `${p.nombre} — Q${Number(p.precio).toFixed(2)}`;
    const btnQ = document.createElement('button');
    btnQ.textContent = 'Eliminar';
    btnQ.style.marginLeft = '8px';
    btnQ.onclick = () => {
      carrito.splice(i, 1);
      actualizarContador();
      mostrarCarrito();
    };
    li.appendChild(btnQ);
    lista.appendChild(li);
    suma += Number(p.precio);
  });
  const total = document.getElementById('total');
  if (total) total.textContent = `Total: Q${suma.toFixed(2)}`;
}

/* ------------------ Finalizar compra: abrir modal de pago (en vez de finalizar directamente) ------------------ */
function finalizarCompra() {
  if (carrito.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }

  const activeUser = JSON.parse(sessionStorage.getItem('activeUser') || '{}');
  const correoDestino = activeUser.esMenor ? activeUser.tutorEmail : activeUser.email;

  if (!correoDestino) {
    alert("No se encontró un correo para enviar el recibo.");
    return;
  }

  let recibo = "Gracias por tu compra\n\nDetalle:\n";
  let total = 0;

  carrito.forEach(p => {
    recibo += `• ${p.nombre} — Q${p.precio}\n`;
    total += Number(p.precio);
  });

  recibo += `\nTotal pagado: Q${total}\n`;

  if (activeUser.esMenor) {
    recibo += "\nEsta cuenta está supervisada por un tutor legal.\n";
  }

  // mailto
  window.location.href =
    `mailto:${correoDestino}?subject=Recibo de compra&body=${encodeURIComponent(recibo)}`;

  carrito = [];
  actualizarContador();
  mostrar('final');
}


/* ------------------ Modal y proceso de pago (simulado) ------------------ */
function abrirModalPago() {
  const modal = document.getElementById('modalPago');
  const modalUser = document.getElementById('modalUserInfo');
  // obtener correo del usuario activo (sessionStorage) si existe
  let active = null;
  try { active = JSON.parse(sessionStorage.getItem('activeUser') || 'null'); } catch(e){ active = null; }
  if (active && active.email) {
    modalUser.textContent = `Pagar como: ${active.nombre} — ${active.email}`;
  } else {
    modalUser.textContent = `Pagar como invitado. Si deseas recibir recibo por correo, inicia sesión o ingresa tu email en el servicio de pago.`;
  }
  document.getElementById('mensajePago').textContent = '';
  modal.style.display = 'flex';
}

function cerrarModalPago() {
  const modal = document.getElementById('modalPago');
  modal.style.display = 'none';
}

/* ------------------ Procesar pago (simulado) ------------------ */
function procesarPago() {
  const nombreTarjeta = (document.getElementById('tarjeta-nombre')?.value || '').trim();
  const numTarjeta = (document.getElementById('tarjeta-num')?.value || '').trim();
  const exp = (document.getElementById('tarjeta-exp')?.value || '').trim();
  const cvv = (document.getElementById('tarjeta-cvv')?.value || '').trim();
  const msg = document.getElementById('mensajePago');

  // Validaciones simples (no guardamos ni transmitimos nada)
  if (!nombreTarjeta || !numTarjeta || !exp || !cvv) {
    if (msg) { msg.textContent = 'Completa todos los datos de la tarjeta (esto es una simulación).'; }
    return;
  }
  // Simular verificación (longitud mínima)
  if (numTarjeta.replace(/\s+/g,'').length < 12 || cvv.length < 3) {
    if (msg) { msg.textContent = 'Datos de tarjeta inválidos (simulación).'; }
    return;
  }

  // Simular procesamiento (puedes añadir loader visual)
  if (msg) { msg.textContent = 'Procesando pago...'; msg.style.color = 'lightgreen'; }

  // Crear recibo con detalles del carrito
  let total = 0;
  let lines = carrito.map((p, i) => {
    total += Number(p.precio);
    return `${i+1}. ${p.nombre} — Q${Number(p.precio).toFixed(2)}`;
  }).join('\n');

  const now = new Date();
  const fecha = now.toLocaleString();
  const receipt = `RECIBO - Tienda Gamer\nFecha: ${fecha}\n\nProductos:\n${lines}\n\nTotal: Q${total.toFixed(2)}\n\nPagado por: ${nombreTarjeta}\n(Información de tarjeta no almacenada — demo)\n\nGracias por su compra.`;

  // Intentar obtener email del usuario activo
  let destEmail = null;
  try {
    const active = JSON.parse(sessionStorage.getItem('activeUser') || 'null');
    if (active && active.email && active.email !== 'alumno') destEmail = active.email;
  } catch (e){ destEmail = null; }

  // 1) Abrir cliente de correo con mailto (prellenar asunto y cuerpo)
  const subject = encodeURIComponent('Recibo de compra - Tienda Gamer');
  const body = encodeURIComponent(receipt);
  // mailto tiene límite en longitud; si es demasiado largo el navegador truncará
  const mailto = `mailto:${destEmail || ''}?subject=${subject}&body=${body}`;
  // Abrir mailto en nueva ventana para que el usuario envíe el correo
  window.open(mailto, '_blank');

  // 2) Descargar recibo como archivo .txt para guardar localmente
  const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recibo_tiendagamer_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // Limpiar carrito y cerrar modal
  carrito = [];
  actualizarContador();
  cerrarModalPago();
  // Mostrar pantalla final
  mostrar('final');
}

/* ------------------ Carruseles ------------------ */
function inicializarTodosCarruseles() {
  document.querySelectorAll('.carrusel').forEach(c => {
    crearDotsPara(c);
    const slidesRow = c.querySelector('.slides');
    if (slidesRow) slidesRow.style.transform = 'translateX(0%)';
    if (slideTimers[c.id]) clearInterval(slideTimers[c.id]);
    lastAction[c.id] = Date.now();
  });
}

function crearDotsPara(carrusel) {
  const slides = carrusel.querySelectorAll('.slide');
  let dotsWrap = carrusel.querySelector('.dots');
  if (!dotsWrap) {
    dotsWrap = document.createElement('div');
    dotsWrap.className = 'dots';
    carrusel.appendChild(dotsWrap);
  }
  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i === 0) dot.classList.add('active');
    dot.onclick = () => {
      cambiarSlide(carrusel, i);
      reiniciarAutoplay(carrusel.id);
    };
    dotsWrap.appendChild(dot);
  });
}

function cambiarSlide(carrusel, index) {
  if (!carrusel) return;
  const slides = Array.from(carrusel.querySelectorAll('.slide'));
  const dots = Array.from(carrusel.querySelectorAll('.dot'));
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  const realIndex = Math.max(0, Math.min(index, slides.length - 1));
  slides[realIndex].classList.add('active');
  if (dots[realIndex]) dots[realIndex].classList.add('active');
  const slidesRow = carrusel.querySelector('.slides');
  if (slidesRow) slidesRow.style.transform = `translateX(-${realIndex * 100}%)`;
  lastAction[carrusel.id] = Date.now();
}

function moverCarrusel(id, paso) {
  const carrusel = document.getElementById(id);
  if (!carrusel) return;
  const slides = Array.from(carrusel.querySelectorAll('.slide'));
  let activo = slides.findIndex(s => s.classList.contains('active'));
  if (activo < 0) activo = 0;
  let nuevo = (activo + paso + slides.length) % slides.length;
  cambiarSlide(carrusel, nuevo);
  reiniciarAutoplay(id);
}

function iniciarCarruselAuto(tienda) {
  const id = `carrusel-${tienda}`;
  const carrusel = document.getElementById(id);
  if (!carrusel) return;
  crearDotsPara(carrusel);
  if (slideTimers[id]) { clearInterval(slideTimers[id]); slideTimers[id] = null; }
  cambiarSlide(carrusel, 0);

  slideTimers[id] = setInterval(() => {
    const page = carrusel.closest('.page');
    if (!page || !page.classList.contains('active')) return;
    const now = Date.now();
    if (now - (lastAction[id] || 0) < CARRUSEL_AUTOPLAY_MS) return;
    moverCarrusel(id, 1);
    lastAction[id] = Date.now();
  }, 1000);
  lastAction[id] = Date.now();
}

function reiniciarAutoplay(id) {
  lastAction[id] = Date.now();
}

/* ------------------ Inicialización ------------------ */
document.addEventListener('DOMContentLoaded', () => {
  inicializarTodosCarruseles();
  mostrarInicio();

  const sel = document.getElementById('selector-tienda');
  if (sel && sel.value) {
    const current = document.body.getAttribute('data-tienda') || 'inicio';
    if (current !== 'inicio') {
      sel.value = current;
      iniciarCarruselAuto(current);
    }
  }
});

/* ------------------ Botón de regreso inteligente ------------------ */
function volverUltimaTienda() {
  // Detecta la tienda activa guardada en el atributo data-tienda
  const tiendaActual = document.body.getAttribute('data-tienda');

  // Si no hay tienda activa o está en "inicio", regresa al inicio
  if (!tiendaActual || tiendaActual === 'inicio') {
    mostrarInicio();
    return;
  }

  // Si la tienda actual es válida, abre su categoría
  abrirCategoria(tiendaActual);
}


/* ------------------ Exportar globalmente ------------------ */
window.mostrar = mostrar;
window.mostrarInicio = mostrarInicio;
window.abrirCategoria = abrirCategoria;
window.cambiarTienda = cambiarTienda;
window.abrirSubseccion = abrirSubseccion;
window.volverTienda = volverTienda;
window.iniciarSesion = iniciarSesion;
window.registrar = registrar;
window.agregarCarrito = agregarCarrito;
window.mostrarCarrito = mostrarCarrito;
window.finalizarCompra = finalizarCompra;
window.moverCarrusel = moverCarrusel;
window.iniciarCarruselAuto = iniciarCarruselAuto;
window.cambiarSlide = cambiarSlide;
window.reiniciarAutoplay = reiniciarAutoplay;
window.agregarDesdeTarjeta = agregarDesdeTarjeta;
window.volverUltimaTienda = volverUltimaTienda;


/* ------------------ Agregar desde tarjeta ------------------ */
function agregarDesdeTarjeta(boton) {
  const card = boton.closest('.card-producto');
  if (!card) return;

  // Obtener el nombre (texto del <h4>)
  const nombre = card.querySelector('h4')?.textContent.trim() || 'Producto sin nombre';

  // Obtener el precio (texto del <p>), eliminando la "Q" y espacios
  let precioTexto = card.querySelector('p')?.textContent.trim().replace('Q', '').replace(',', '') || '0';
  const precio = parseFloat(precioTexto);

  if (isNaN(precio)) {
    alert('Error al leer el precio del producto.');
    return;
  }

  agregarCarrito(nombre, precio);
}
