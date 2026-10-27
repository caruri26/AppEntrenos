/* ============================================================
APP TRIATLÓN — script.js
Versión local: guarda los datos en localStorage.
No requiere base de datos externa.
   ============================================================ */

"use strict";
console.log("SCRIPT.JS SE ESTÁ EJECUTANDO");

const STORAGE_KEYS = {
    workouts: "feed_entrenos",
    profile: "user_profile_onboarding",
    health: "salud_registros",
    gymSession: "gym_session_active",
    adjustments: "ajustes_calendario"
};

const DB_API = {
    obtenerTodosLosEntrenos() {
        return leerJSON(STORAGE_KEYS.workouts, []);
    },
    obtenerEntrenosSemanaActual() {
        const inicio = obtenerInicioSemana(semanaSeleccionadaOffset);
        const fin = new Date(inicio);
        fin.setDate(fin.getDate() + 7);
        return this.obtenerTodosLosEntrenos().filter(e => {
            const fecha = obtenerFechaEntreno(e);
            return fecha && fecha >= inicio && fecha < fin;
        });
    },
    guardarRegistro(registro) {
        const feed = this.obtenerTodosLosEntrenos();
        const ahora = new Date();
        const completo = {
            ...registro,
            id: registro.id || (Date.now() + Math.floor(Math.random() * 1000)),
            fechaISO: registro.fechaISO || ahora.toISOString(),
            fecha: registro.fecha || ahora.toLocaleDateString("es-ES", {
                day: "2-digit", month: "short", year: "numeric"
            })
        };
        feed.unshift(completo);
        localStorage.setItem(STORAGE_KEYS.workouts, JSON.stringify(feed));
        return completo;
    }
};

function leerJSON(clave, fallback) {
    try {
        const valor = localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : fallback;
    } catch (error) {
        console.warn(`No se pudo leer ${clave}:`, error);
        return fallback;
    }
}

function obtenerFechaEntreno(entreno) {
    if (entreno?.fechaISO) {
        const fecha = new Date(entreno.fechaISO);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }
    if (typeof entreno?.id === "number" && entreno.id > 1000000000000) {
        const fecha = new Date(entreno.id);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }
    return null;
}

function obtenerInicioSemana(offset = 0) {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7) + offset * 7);
    return fecha;
}

function obtenerFechasSemana(offset = 0) {
    const inicio = obtenerInicioSemana(offset);
    return Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date(inicio);
        fecha.setDate(inicio.getDate() + i);
        return fecha;
    });
}

function formatearRangoSemana(inicio) {
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const opciones = { day: "2-digit", month: "short" };
    return `${inicio.toLocaleDateString("es-ES", opciones)} – ${fin.toLocaleDateString("es-ES", opciones)}`;
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[caracter]));
}

/* -------------------- RUTINAS PREDETERMINADAS -------------------- */
/* Los pesos son los valores de referencia que compartió el usuario.
   Ajusta cada peso al equipo real y al rendimiento del día. */
const RUTINAS_PREDETERMINADAS = {
    "Lunes": [
        { nombre: "Press de banca inclinado con mancuernas", grupo: "Pecho", sets: 3, repes: "8-10", peso: 14, calen: "1-2 series (10 kg×12, 14 kg×8)", descanso: "2 min", notas: "Énfasis en porción superior del pecho. Registrar peso de trabajo." },
        { nombre: "Press plano en máquina / multipress", grupo: "Pecho", sets: 3, repes: "8-10", peso: 37.5, calen: "1-2 series (20 kg×12, 30 kg×8)", descanso: "2 min", notas: "Trabajo pesado y guiado." },
        { nombre: "Aperturas en máquina (Peck Deck) o polea", grupo: "Pecho", sets: 3, repes: "12", peso: 30, calen: "1 serie ligera (15 kg×12)", descanso: "60-90 s", notas: "Apertura y contracción controlada." },
        { nombre: "Crossover / Cruce de poleas de arriba a abajo", grupo: "Pecho", sets: 3, repes: "12-15", peso: 10, calen: "1 serie ligera (10 kg×12)", descanso: "60 s", notas: "Enfocado en cruzar y apretar abajo." },
        { nombre: "Press militar con mancuernas sentado", grupo: "Hombro", sets: 3, repes: "8-10", peso: 5, calen: "1-2 series (6 kg×12, 8 kg×8)", descanso: "2 min", notas: "Referencia de 5 kg por lado en máquina; prioriza técnica." },
        { nombre: "Elevaciones laterales con mancuernas", grupo: "Hombro", sets: 4, repes: "12-15", peso: 5.5, calen: "1 serie ligera (3 kg×12)", descanso: "60-90 s", notas: "Controlar bajada." },
        { nombre: "Pájaros en máquina o con mancuernas", grupo: "Hombro", sets: 3, repes: "12-15", peso: 25, calen: "1 serie ligera (12,5 kg×12)", descanso: "60 s", notas: "Deltoide posterior." },
        { nombre: "Extensiones de tríceps en polea alta con cuerda", grupo: "Tríceps", sets: 3, repes: "10-12", peso: 17.5, calen: "1 serie ligera (10 kg×12)", descanso: "60-90 s", notas: "Abrir cuerda al final." },
        { nombre: "Extensiones por encima de la cabeza", grupo: "Tríceps", sets: 3, repes: "10-12", peso: 12.5, calen: "1 serie ligera (7,5 kg×12)", descanso: "60-90 s", notas: "Cabeza larga del tríceps." },
        { nombre: "Elevación de piernas colgado / Crunch en polea", grupo: "Abdominales", sets: 3, repes: "15", peso: 0, calen: "Sin calentamiento", descanso: "45-60 s", notas: "Control abdominal total." }
    ],
    "Martes": [
        { nombre: "Jalón al pecho agarre ancho", grupo: "Espalda", sets: 4, repes: "8-10", peso: 52.5, calen: "1-2 series (30 kg×12, 40 kg×8)", descanso: "2-3 min", notas: "Forma en V." },
        { nombre: "Remo en polea baja sentado (agarre neutro)", grupo: "Espalda", sets: 3, repes: "8-10", peso: 27.5, calen: "1 serie ligera (20 kg×12)", descanso: "2 min", notas: "Espalda recta, tracción al ombligo." },
        { nombre: "Máquina de remo alto unilateral", grupo: "Espalda", sets: 3, repes: "10 por lado", peso: 27.5, calen: "1 serie ligera (15 kg×10)", descanso: "90 s", notas: "Empieza por el lado izquierdo; el derecho iguala repeticiones." },
        { nombre: "Pullover en polea alta", grupo: "Espalda", sets: 3, repes: "12-15", peso: 15.9, calen: "1 serie ligera (10 kg×12)", descanso: "60-90 s", notas: "Aislamiento directo del dorsal." },
        { nombre: "Curl de bíceps alterno con mancuernas", grupo: "Bíceps", sets: 3, repes: "10-12 por lado", peso: 8, calen: "1 serie ligera (4-5 kg×12)", descanso: "60-90 s", notas: "Izquierdo primero; el derecho iguala reps." },
        { nombre: "Curl de bíceps en polea baja con barra recta", grupo: "Bíceps", sets: 3, repes: "10-12", peso: 10, calen: "1 serie ligera (10 kg×12)", descanso: "60-90 s", notas: "Tensión constante." },
        { nombre: "Curl martillo con mancuernas", grupo: "Bíceps", sets: 3, repes: "10-12", peso: 12.5, calen: "1 serie ligera (6 kg×12)", descanso: "60-90 s", notas: "Braquial y antebrazo." },
        { nombre: "Curl de muñeca con supinación", grupo: "Antebrazo", sets: 3, repes: "15", peso: 5, calen: "Sin calentamiento", descanso: "45-60 s", notas: "Movimiento controlado." },
        { nombre: "Curl inverso de muñeca", grupo: "Antebrazo", sets: 3, repes: "15", peso: 5, calen: "Sin calentamiento", descanso: "45-60 s", notas: "No balancear los brazos." },
        { nombre: "Curl inverso de muñeca", grupo: "Antebrazo", sets: 3, repes: "15", peso: 5, calen: "Sin calentamiento", descanso: "45-60 s", notas: "No balancear los brazos." },
        { nombre: "Curl martillo con mancuernas", grupo: "Bíceps", sets: 3, repes: "10-12 por lado", peso: 12.5, calen: "1 serie ligera (6 kg×12)", descanso: "60 s", notas: "Braquial y antebrazo." },
        { nombre: "Curl de antebrazo con barra en supinación", grupo: "Antebrazo", sets: 3, repes: "15", peso: 5, calen: "Una serie solo con barra", descanso: "45 s", notas: "Palmas arriba; peso ligero." },
        { nombre: "Curl de antebrazo inverso", grupo: "Antebrazo", sets: 3, repes: "15", peso: 5, calen: "Una serie ligera", descanso: "45-60 s", notas: "Palmas abajo; trabaja extensores de muñeca." }
    ],
    "Miércoles": [
        { nombre: "Prensa de piernas inclinada", grupo: "Cuádriceps", sets: 4, repes: "8-10", peso: 175.7, calen: "75,7 kg×15 y 145,7 kg×6", descanso: "2-3 min", notas: "Ejercicio principal pesado; rango cómodo y controlado." },
        { nombre: "Sentadilla en máquina hack / jaca", grupo: "Cuádriceps", sets: 3, repes: "10", peso: 67.6, calen: "47,6 kg×15", descanso: "2-3 min", notas: "Sustituye a la búlgara." },
        { nombre: "Extensiones de cuádriceps en máquina", grupo: "Cuádriceps", sets: 3, repes: "12-15", peso: 52, calen: "32 kg×12", descanso: "60-90 s", notas: "Aislamiento de cuádriceps." },
        { nombre: "Hip thrust con máquina", grupo: "Glúteo", sets: 3, repes: "10-12", peso: 27.7, calen: "22,7 kg×12", descanso: "2 min", notas: "Trabajo de cadena posterior." },
        { nombre: "Curl femoral sentado en máquina", grupo: "Femoral", sets: 3, repes: "12", peso: 52, calen: "45 kg×12", descanso: "60-90 s", notas: "Controlar la fase excéntrica; la tabla original también menciona referencias distintas, confirma el peso real." },
        { nombre: "Elevación de talones de pie en máquina", grupo: "Gemelo", sets: 4, repes: "12-15", peso: 80.4, calen: "40,3 kg×15", descanso: "60-90 s", notas: "Rango completo y pausa arriba." },
        { nombre: "Plancha abdominal estática", grupo: "Abdominales", sets: 3, repes: "45-60 s", peso: 0, calen: "Sin carga", descanso: "45 s", notas: "Core estable, sin curvar la zona lumbar." }
    ],
    "Jueves": [
        { nombre: "Pec Deck en máquina", grupo: "Pecho", sets: 3, repes: "10-12", peso: 40, calen: "20 kg×15", descanso: "90 s", notas: "Controlar el estiramiento sin forzar hombros." },
        { nombre: "Press inclinado con mancuernas", grupo: "Pecho", sets: 3, repes: "8-10", peso: 12, calen: "No especificado", descanso: "2 min", notas: "Registrar peso de trabajo." },
        { nombre: "Jalón al pecho con agarre estrecho / neutro", grupo: "Espalda", sets: 3, repes: "8-10", peso: 42.5, calen: "25 kg×12", descanso: "90 s", notas: "Tracción vertical con foco en dorsal." },
        { nombre: "Remo en T con pecho apoyado", grupo: "Espalda", sets: 3, repes: "10", peso: 27.5, calen: "15 kg×12", descanso: "2 min", notas: "Pecho apoyado para aislar espalda." },
        { nombre: "Elevaciones laterales en polea", grupo: "Hombro", sets: 4, repes: "12-15", peso: 3.5, calen: "2,3 kg×12", descanso: "60-90 s", notas: "Tensión constante; empieza por el lado izquierdo." },
        { nombre: "Press militar con mancuernas o máquina", grupo: "Hombro", sets: 3, repes: "10", peso: 5, calen: "4 kg×12", descanso: "90 s", notas: "Empuje vertical controlado." },
        { nombre: "Curl con mancuernas en banco inclinado", grupo: "Bíceps", sets: 3, repes: "10-12", peso: 8, calen: "4 kg×12", descanso: "60-90 s", notas: "Empieza por el brazo izquierdo." },
        { nombre: "Curl concentrado con mancuerna unilateral", grupo: "Bíceps", sets: 3, repes: "10-12 por lado", peso: 8, calen: "4 kg×12", descanso: "60 s", notas: "Empieza por el brazo izquierdo." },
        { nombre: "Extensión de tríceps en polea alta con barra V / cuerda", grupo: "Tríceps", sets: 3, repes: "10-12", peso: 15, calen: "10 kg×12", descanso: "60-90 s", notas: "Codos fijos a los lados." },
        { nombre: "Patada de tríceps con mancuerna o polea", grupo: "Tríceps", sets: 3, repes: "12 por lado", peso: 5, calen: "3-4 kg×12", descanso: "60 s", notas: "Aislamiento en máxima contracción." }
    ],
    "Viernes": [
        { nombre: "Extensión de cuádriceps en máquina unilateral", grupo: "Cuádriceps", sets: 3, repes: "12-15 por lado", peso: 15, calen: "15 kg×12", descanso: "60 s", notas: "Sin zancadas; empieza por la izquierda." },
        { nombre: "Curl femoral sentado", grupo: "Isquios / Femoral", sets: 3, repes: "12-15", peso: 87.5, calen: "40 kg×12", descanso: "60-90 s", notas: "Sesión moderada y controlada. Comprueba la carga de tu máquina." },
        { nombre: "Máquina de abductores sentado", grupo: "Glúteo", sets: 3, repes: "15", peso: 47.5, calen: "25 kg×15", descanso: "45-60 s", notas: "Glúteo medio." },
        { nombre: "Elevación de talones sentado", grupo: "Gemelo", sets: 4, repes: "15-20", peso: 90, calen: "30 kg×15", descanso: "45-60 s", notas: "Énfasis en sóleo." },
        { nombre: "Crunch en máquina o elevaciones de rodillas", grupo: "Abdominales", sets: 3, repes: "15", peso: 0, calen: "Una serie ligera", descanso: "45 s", notas: "Trabajo abdominal enfocado." }
    ],
    "Sábado": [
        { nombre: "Elevaciones laterales con mancuernas o máquina", grupo: "Hombro", sets: 4, repes: "15", peso: 5.5, calen: "3 kg×12", descanso: "45-60 s", notas: "Ritmo controlado." },
        { nombre: "Pájaros con mancuernas o en máquina", grupo: "Hombro", sets: 3, repes: "15", peso: 25, calen: "12,5 kg×12", descanso: "45-60 s", notas: "Deltoide posterior." },
        { nombre: "Curl concentrado a una mano con mancuerna", grupo: "Bíceps", sets: 3, repes: "12 por lado", peso: 10, calen: "4 kg×12", descanso: "45-60 s", notas: "Empieza por el brazo izquierdo." },
        { nombre: "Extensiones de tríceps a una mano en polea", grupo: "Tríceps", sets: 3, repes: "12 por lado", peso: 5, calen: "5 kg×12", descanso: "45-60 s", notas: "Empieza por el brazo izquierdo." },
        { nombre: "Aperturas en máquina (Peck Deck) o polea", grupo: "Pecho", sets: 3, repes: "12-15", peso: 30, calen: "15 kg×12", descanso: "60-90 s", notas: "Bombeo y congestión." },
        { nombre: "Jalón al pecho ligero o dominadas asistidas", grupo: "Espalda", sets: 3, repes: "12", peso: 25, calen: "25 kg×12", descanso: "60-90 s", notas: "Estímulo ligero y controlado." }
    ],
    "Domingo": []
};

const CARDIO_DETALLES = {
    "Natación 10×100m": {
        tipo: "Natación", calentamiento: "200 m suave estilo libre Z1",
        bloqueSeries: "10 series de 100 m a ritmo constante (Z3)",
        descanso: "25-30 segundos entre cada 100 m",
        vueltaCalma: "200 m suave de recuperación",
        volumenTotal: "1.400 metros", grafico: { warm: 15, work: 70, cool: 15 }
    },
    "Carrera Corta 6×(1'/4')": {
        tipo: "Carrera", calentamiento: "5 min caminata viva Z1",
        bloqueSeries: "6 bloques de 1 min corriendo + 4 min andando",
        descanso: "Recuperación caminando durante 4 min",
        vueltaCalma: "5 min caminata suave",
        volumenTotal: "35-40 minutos", grafico: { warm: 12, work: 75, cool: 13 }
    },
    "Bici Corta 35km / Rodillo": {
        tipo: "Ciclismo", calentamiento: "10 min progresivos",
        bloqueSeries: "35 km exterior o 50 min de rodillo en Z2",
        descanso: "Pedaleo estable, sin paradas planificadas",
        vueltaCalma: "5 min suave", volumenTotal: "35 km / 50 min",
        grafico: { warm: 15, work: 75, cool: 10 }
    },
    "Natación 3×400m": {
        tipo: "Natación", calentamiento: "200 m suave",
        bloqueSeries: "3×400 m a ritmo cómodo y constante",
        descanso: "30-45 s entre bloques", vueltaCalma: "100-200 m suave",
        volumenTotal: "1.500 m aprox.", grafico: { warm: 15, work: 70, cool: 15 }
    },
    "Carrera Larga Z2": {
        tipo: "Carrera", calentamiento: "5-10 min caminata",
        bloqueSeries: "Alterna carrera y caminata en Z2 según tu nivel actual",
        descanso: "Recuperación caminando cuando lo necesites",
        vueltaCalma: "5 min suave", volumenTotal: "Según tolerancia",
        grafico: { warm: 15, work: 75, cool: 10 }
    },
    "Bici Larga 85km": {
        tipo: "Ciclismo", calentamiento: "10 min progresivos",
        bloqueSeries: "Rodaje aeróbico largo; adapta la distancia a tu condición actual",
        descanso: "Pausas según necesidad", vueltaCalma: "5 min suave",
        volumenTotal: "Plan orientativo: ajustar a la preparación real",
        grafico: { warm: 10, work: 80, cool: 10 }
    }
};

let semanaSeleccionadaOffset = 0;
let disciplinaActiva = "Natación";
let workoutGymActual = [];
let timerStartTime = null;
let timerInterval = null;
let chartsSalud = {};
let diaRutinaActiva = "Lunes";
let sesionGymIdActiva = null;
let ejercicioGymSeleccionado = null;

window.addEventListener("DOMContentLoaded", () => {
    comprobarOnboardingInicial();
    restaurarEstadoGym();
    actualizarVistaRutina();
    renderFeedHistorico();
    renderCalendarioSemanal();
    inicializarGraficasSalud();
    setDiscipline("Natación");
    if (window.lucide) window.lucide.createIcons();
});

/* -------------------- NAVEGACIÓN -------------------- */
function switchTab(tabId, btnElement) {
    document.querySelectorAll(".tab-pane").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    const panel = document.getElementById(tabId);
    if (panel) panel.classList.add("active");
    if (btnElement) btnElement.classList.add("active");
    if (window.lucide) window.lucide.createIcons();
}

function actualizarVistaRutina() {
    const perfil = leerJSON(STORAGE_KEYS.profile, null);
    const nombre = document.getElementById("header-user-name");
    const subtitulo = document.getElementById("header-user-sub");
    const avatar = document.getElementById("header-avatar");

    if (perfil) {
        if (nombre) nombre.textContent = perfil.nombre || "Mi perfil";
        if (subtitulo) subtitulo.textContent =
            `${perfil.edad || "—"} años · ${perfil.peso || "—"} kg · ${perfil.altura || "—"} cm`;
        if (avatar) avatar.textContent = (perfil.nombre || "U").trim().charAt(0).toUpperCase();
    }

    const selector = document.getElementById("select-rutina-guardada");
    const diaSeleccionado = selector?.value || diaRutinaActiva || "Lunes";
    const rutina = RUTINAS_PREDETERMINADAS[diaSeleccionado];
    const titulo = document.getElementById("plan-fuerza-hoy-titulo");
    const subtituloPlan = document.getElementById("plan-fuerza-hoy-sub");
    if (rutina && titulo && subtituloPlan) {
        const grupos = [...new Set(rutina.map(e => e.grupo).filter(Boolean))];
        titulo.textContent = `${diaSeleccionado}: ${grupos.join(" + ") || (diaSeleccionado === "Domingo" ? "Descanso" : "Fuerza")}`;
        subtituloPlan.textContent = rutina.length
            ? `${rutina.length} ejercicios · ${rutina.reduce((n, e) => n + e.sets, 0)} series programadas`
            : "Descanso de fuerza";
    }

    const hoy = new Date();
    const fechaTexto = hoy.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
    const fechaGym = document.getElementById("fecha-hoy-gym");
    const fechaCardio = document.getElementById("fecha-hoy-cardio");
    if (fechaGym) fechaGym.textContent = fechaTexto;
    if (fechaCardio) fechaCardio.textContent = fechaTexto;
}

/* -------------------- PERFIL / ONBOARDING -------------------- */
function abrirModalOnboarding() {
    const perfil = leerJSON(STORAGE_KEYS.profile, null);
    if (perfil) {
        const campos = {
            "ob-nombre": "nombre", "ob-edad": "edad",
            "ob-piscina-tipo": "piscinaTipo", "ob-piscina-mes-inicio": "piscinaMesInicio",
            "ob-piscina-mes-fin": "piscinaMesFin", "ob-fc-min": "fcReposo",
            "ob-fc-max": "fcMax", "ob-altura": "altura", "ob-peso": "peso"
        };
        Object.entries(campos).forEach(([id, propiedad]) => {
            const campo = document.getElementById(id);
            if (campo && perfil[propiedad] != null) campo.value = perfil[propiedad];
        });
    }
    const modal = document.getElementById("modal-onboarding");
    if (modal) modal.style.display = "flex";
    toggleOpcionesPiscina();
}

function comprobarOnboardingInicial() {
    const perfil = leerJSON(STORAGE_KEYS.profile, null);
    if (!perfil) abrirModalOnboarding();
    else actualizarVistaRutina();
}

function toggleOpcionesPiscina() {
    const tipo = document.getElementById("ob-piscina-tipo")?.value;
    const caja = document.getElementById("box-piscina-estacional");
    if (caja) caja.style.display = tipo === "Abierta" ? "block" : "none";
}

function guardarTestInicial(event) {
    event?.preventDefault();
    const obtener = id => document.getElementById(id)?.value ?? "";
    const perfil = {
        nombre: obtener("ob-nombre").trim(),
        edad: Number(obtener("ob-edad")),
        piscinaTipo: obtener("ob-piscina-tipo") || "Cubierta",
        piscinaMesInicio: Number(obtener("ob-piscina-mes-inicio") || 5),
        piscinaMesFin: Number(obtener("ob-piscina-mes-fin") || 10),
        fcReposo: Number(obtener("ob-fc-min")),
        fcMax: Number(obtener("ob-fc-max")),
        altura: Number(obtener("ob-altura")),
        peso: Number(obtener("ob-peso"))
    };

    if (!perfil.nombre || perfil.edad <= 0 || perfil.altura <= 0 || perfil.peso <= 0) {
        alert("Completa el nombre, la edad, la altura y el peso correctamente.");
        return;
    }

    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(perfil));
    const modal = document.getElementById("modal-onboarding");
    if (modal) modal.style.display = "none";
    actualizarVistaRutina();
}

function cerrarModalOnboarding() {
    const modal = document.getElementById("modal-onboarding");
    if (modal) modal.style.display = "none";
}

/* -------------------- RUTINA DE GIMNASIO -------------------- */
function obtenerRutinaDelDia(dia) {
    return RUTINAS_PREDETERMINADAS[dia] || [];
}

function seleccionarDiaRutina(dia) {
    diaRutinaActiva = dia;
    const selector = document.getElementById("select-rutina-guardada");
    if (selector) selector.value = dia;
    actualizarVistaRutina();
    renderListaEjerciciosRutina();
}

function renderListaEjerciciosRutina() {
    const selector = document.getElementById("select-rutina-guardada");
    const dia = selector?.value || diaRutinaActiva || "Lunes";
    const rutina = obtenerRutinaDelDia(dia);
    const contenedor = document.getElementById("lista-ejercicios-rutina");
    if (!contenedor) return;

    if (!rutina.length) {
        contenedor.innerHTML = `<p class="empty-state">Día de descanso. Recupera fuerzas para la próxima sesión.</p>`;
        return;
    }

    contenedor.innerHTML = rutina.map((ejercicio, indice) => `
        <article class="exercise-card">
            <div class="exercise-card-header">
                <div>
                    <h4>${escaparHTML(ejercicio.nombre)}</h4>
                    <small>${escaparHTML(ejercicio.grupo)}</small>
                </div>
                <span>${ejercicio.sets} × ${escaparHTML(ejercicio.repes)}</span>
            </div>
            <p><strong>Peso de referencia:</strong> ${ejercicio.peso || "Peso corporal"} kg</p>
            <p><strong>Descanso:</strong> ${escaparHTML(ejercicio.descanso)}</p>
            <p>${escaparHTML(ejercicio.notas)}</p>
            <button type="button" onclick="verDetalleFuerzaModal('${dia}', ${indice})">
                Ver detalles
            </button>
        </article>
    `).join("");
}

function verDetalleFuerzaModal(dia, indice) {
    const ejercicio = obtenerRutinaDelDia(dia)[indice];
    if (!ejercicio) return;

    const modal = document.getElementById("modal-detalle-fuerza");
    const contenido = document.getElementById("contenido-detalle-fuerza");
    if (contenido) {
        contenido.innerHTML = `
            <h3>${escaparHTML(ejercicio.nombre)}</h3>
            <p><strong>Grupo muscular:</strong> ${escaparHTML(ejercicio.grupo)}</p>
            <p><strong>Series:</strong> ${ejercicio.sets}</p>
            <p><strong>Repeticiones:</strong> ${escaparHTML(ejercicio.repes)}</p>
            <p><strong>Peso de referencia:</strong> ${ejercicio.peso || "Peso corporal"} kg</p>
            <p><strong>Calentamiento:</strong> ${escaparHTML(ejercicio.calen)}</p>
            <p><strong>Descanso:</strong> ${escaparHTML(ejercicio.descanso)}</p>
            <p>${escaparHTML(ejercicio.notas)}</p>
        `;
    }
    if (modal) modal.style.display = "flex";
}

function cerrarModalDetalleFuerza() {
    const modal = document.getElementById("modal-detalle-fuerza");
    if (modal) modal.style.display = "none";
}


function iniciarEntrenoDesdeCero() {
    if (workoutGymActual.length > 0 || sesionGymIdActiva) {
        const confirmar = confirm(
            "Ya tienes un entrenamiento activo. ¿Quieres descartarlo e iniciar uno libre?"
        );

        if (!confirmar) return;

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    diaRutinaActiva = "Entreno libre";
    sesionGymIdActiva = Date.now();
    timerStartTime = Date.now();
    workoutGymActual = [];
    ejercicioGymSeleccionado = null;

    guardarEstadoGym();

    const selector = document.getElementById("card-select-rutina");
    if (selector) selector.style.display = "none";

    const acciones = document.getElementById("gym-bottom-actions");
    if (acciones) acciones.style.display = "block";

    const barra = document.getElementById("gym-timer-bar");
    if (barra) barra.style.display = "flex";

    renderEntrenoGymActual();
    iniciarTemporizadorGym();
}


function agregarEjercicioLibre() {
    if (!sesionGymIdActiva) {
        alert("Primero inicia un entrenamiento.");
        return;
    }

    const nombre = prompt("¿Qué ejercicio vas a hacer?");
    if (!nombre || !nombre.trim()) return;

    const grupo = prompt("Grupo muscular:", "General");
    if (grupo === null) return;

    const numeroSeries = Number(
        prompt("¿Cuántas series quieres hacer?", "3")
    );

    if (
        !Number.isInteger(numeroSeries) ||
        numeroSeries < 1 ||
        numeroSeries > 30
    ) {
        alert("Introduce entre 1 y 30 series.");
        return;
    }

    const repeticiones = prompt(
        "¿Cuántas repeticiones quieres hacer por serie?",
        "8-12"
    );

    if (repeticiones === null) return;

    const pesoTexto = prompt("¿Qué peso inicial en kg?", "0");
    if (pesoTexto === null || pesoTexto.trim() === "") return;

    const peso = Number(pesoTexto);

    if (!Number.isFinite(peso) || peso < 0) {
        alert("Introduce un peso válido.");
        return;
    }

    const ejercicio = {
        idEjercicio: `${Date.now()}-${workoutGymActual.length}`,
        nombre: nombre.trim(),
        grupo: grupo.trim() || "General",
        sets: numeroSeries,
        repes: repeticiones.trim() || "A elección",
        peso: peso,
        descanso: "Según necesidad",
        calen: "No especificado",
        notas: "",
        completado: false,

        series: Array.from({ length: numeroSeries }, () => ({
            peso: peso,
            repeticiones: "",
            tipo: "efectiva",
            completada: false
        }))
    };

    workoutGymActual.push(ejercicio);

    ejercicioGymSeleccionado = workoutGymActual.length - 1;

    guardarEstadoGym();
    renderEntrenoGymActual();
}



function iniciarEntrenoGym() {
    const selector = document.getElementById("select-rutina-guardada");
    diaRutinaActiva = selector?.value || diaRutinaActiva || "Lunes";

    const rutina = obtenerRutinaDelDia(diaRutinaActiva);

    if (!rutina.length) {
        alert("Hoy es día de descanso. Selecciona otro día para entrenar.");
        return;
    }

    if (workoutGymActual.length) {
        const continuar = confirm(
            "Ya hay un entrenamiento activo. ¿Quieres descartarlo e iniciar otro?"
        );

        if (!continuar) return;
    }

    sesionGymIdActiva = Date.now();

    workoutGymActual = rutina.map((ejercicio, indice) => ({
        ...ejercicio,
        idEjercicio: `${sesionGymIdActiva}-${indice}`,
        completado: false,
        series: Array.from({ length: ejercicio.sets }, () => ({
        peso: Number(ejercicio.peso) || 0,
        repeticiones: "",
        tipo: "efectiva",
        completada: false
        }))
    }));

    ejercicioGymSeleccionado = null;
    timerStartTime = Date.now();

    guardarEstadoGym();
    renderEntrenoGymActual();
    iniciarTemporizadorGym();

    const selectorRutina = document.getElementById("card-select-rutina");
    if (selectorRutina) selectorRutina.style.display = "none";

    const acciones = document.getElementById("gym-bottom-actions");
    if (acciones) acciones.style.display = "block";

    const barra = document.getElementById("gym-timer-bar");
    if (barra) barra.style.display = "flex";
}

function renderEntrenoGymActual() {
    const contenedor =
        document.getElementById("workout-active-area") ||
        document.getElementById("lista-ejercicios-gym-actual");

    if (!contenedor) return;

    if (!workoutGymActual.length) {
        contenedor.innerHTML = `
            <div class="card glass-card">
                <p class="empty-state">No hay ningún entrenamiento activo.</p>
            </div>
        `;
        return;
    }

    // Si hemos abierto un ejercicio, mostramos su ficha individual.
    if (ejercicioGymSeleccionado !== null) {
        renderFichaEjercicioGym(contenedor, ejercicioGymSeleccionado);
        return;
    }

    const totalSeries = workoutGymActual.reduce(
        (total, ejercicio) => total + ejercicio.series.length,
        0
    );

    const seriesCompletadas = workoutGymActual.reduce(
        (total, ejercicio) =>
            total + ejercicio.series.filter(serie => serie.completada).length,
        0
    );

    contenedor.innerHTML = `
        <div class="card glass-card">
            <h3>Entrenamiento: ${escaparHTML(diaRutinaActiva)}</h3>
            <p>${workoutGymActual.length} ejercicios ·
            ${seriesCompletadas}/${totalSeries} series completadas</p>
            <div class="gym-progress-track">
                <div class="gym-progress-fill"
                     style="width:${totalSeries ? seriesCompletadas / totalSeries * 100 : 0}%">
                </div>
            </div>
        </div>

        ${workoutGymActual.map((ejercicio, indice) => {
            const completadas = ejercicio.series.filter(
                serie => serie.completada
            ).length;

            return `
                <article class="exercise-card ${ejercicio.completado ? "completed" : ""}">
                    <div class="exercise-card-header">
                        <div>
                            <h4>${escaparHTML(ejercicio.nombre)}</h4>
                            <small>${escaparHTML(ejercicio.grupo)}</small>
                        </div>
                        <span>${completadas}/${ejercicio.series.length} series</span>
                    </div>

                    <p>
                        Objetivo: ${ejercicio.sets} ×
                        ${escaparHTML(ejercicio.repes)}
                    </p>
                    <p>
                        <strong>Peso de referencia:</strong>
                        ${Number(ejercicio.peso) || 0} kg
                    </p>

                    <button type="button"
                            class="btn-secondary"
                            onclick="abrirFichaEjercicioGym(${indice})">
                        ${ejercicio.completado ? "Ver ejercicio" : "Registrar series"}
                    </button>
                </article>
            `;
        }).join("")}
    `;

    if (window.lucide) window.lucide.createIcons();
}

function abrirFichaEjercicioGym(indice) {
    if (!workoutGymActual[indice]) return;

    ejercicioGymSeleccionado = indice;
    renderEntrenoGymActual();
}

function volverListaEjerciciosGym() {
    ejercicioGymSeleccionado = null;
    renderEntrenoGymActual();
}

function renderFichaEjercicioGym(contenedor, indice) {
    const ejercicio = workoutGymActual[indice];
    if (!ejercicio) {
        ejercicioGymSeleccionado = null;
        renderEntrenoGymActual();
        return;
    }

    contenedor.innerHTML = `
        <div class="card glass-card">
            <button type="button" class="btn-secondary"
                    onclick="volverListaEjerciciosGym()">
                ← Volver a los ejercicios
            </button>

            <h2>${escaparHTML(ejercicio.nombre)}</h2>
            <p>${escaparHTML(ejercicio.grupo)}</p>

            <div class="exercise-info">
                <p><strong>Objetivo:</strong> ${ejercicio.sets} ×
                    ${escaparHTML(ejercicio.repes)}</p>
                <p><strong>Descanso:</strong>
                    ${escaparHTML(ejercicio.descanso || "Según necesidad")}</p>
                <p><strong>Calentamiento:</strong>
                    ${escaparHTML(ejercicio.calen || "No especificado")}</p>
                <p>${escaparHTML(ejercicio.notas || "")}</p>
            </div>
        </div>

        <div class="card glass-card">
            <h3>Series de trabajo</h3>

                ${ejercicio.series.map((serie, numero) => `
        <div class="set-row ${serie.completada ? "completed" : ""}">
            <h4>Serie ${numero + 1}</h4>

            <label>
                Peso (kg)
                <input
                    type="number"
                    min="0"
                    step="0.5"
                    value="${Number(serie.peso) || 0}"
                    onchange="actualizarSerieGym(${indice}, ${numero}, 'peso', this.value)"
                >
            </label>

            <label>
                Repeticiones realizadas
                <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ej. 10"
                    value="${escaparHTML(serie.repeticiones ?? "")}"
                    onchange="actualizarSerieGym(${indice}, ${numero}, 'repeticiones', this.value)"
                >
            </label>

            <label>
                Tipo de serie
                <select
                    onchange="actualizarSerieGym(${indice}, ${numero}, 'tipo', this.value)"
                >
                    <option value="calentamiento" ${serie.tipo === "calentamiento" ? "selected" : ""}>
                        Calentamiento
                    </option>
                    <option value="efectiva" ${!serie.tipo || serie.tipo === "efectiva" ? "selected" : ""}>
                        Efectiva normal
                    </option>
                    <option value="fallo" ${serie.tipo === "fallo" ? "selected" : ""}>
                        Efectiva al fallo
                    </option>
                </select>
            </label>

            <label class="set-check">
                <input
                    type="checkbox"
                    ${serie.completada ? "checked" : ""}
                    onchange="marcarSerieGym(${indice}, ${numero}, this.checked)"
                >
                Serie completada
            </label>

            <button
                type="button"
                class="btn-danger-small"
                onclick="eliminarSerieGym(${indice}, ${numero})"
                ${ejercicio.series.length <= 1 ? "disabled" : ""}
            >
                Eliminar serie
            </button>
        </div>
    `).join("")}

            <button type="button" class="btn-secondary"
                    onclick="agregarSerieGym(${indice})">
                + Añadir serie
            </button>

            <button type="button" class="btn-green"
                    onclick="marcarEjercicioCompletado(${indice})">
                ${ejercicio.completado ? "Marcar ejercicio pendiente" : "Completar ejercicio"}
            </button>

            <button type="button" class="btn-secondary"
                    onclick="irSiguienteEjercicioGym(${indice})">
                Siguiente ejercicio →
            </button>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

function actualizarSerieGym(indice, numeroSerie, campo, valor) {
    const ejercicio = workoutGymActual[indice];
    const serie = ejercicio?.series?.[numeroSerie];

    if (!serie) return;

    if (campo === "peso") {
        if (valor === "" || !Number.isFinite(Number(valor))) return;
        serie.peso = Math.max(0, Number(valor));
    } else if (campo === "repeticiones") {
        serie.repeticiones = valor === ""
            ? ""
            : String(Math.max(0, Math.floor(Number(valor) || 0)));
    } else if (campo === "tipo") {
        if (!["calentamiento", "efectiva", "fallo"].includes(valor)) return;
        serie.tipo = valor;
    } else {
        return;
    }

    guardarEstadoGym();
}

function marcarSerieGym(indice, numeroSerie, completada) {
    const serie = workoutGymActual[indice]?.series?.[numeroSerie];
    if (!serie) return;

    if (completada && serie.repeticiones === "") {
        alert("Introduce las repeticiones realizadas antes de completar la serie.");
        renderEntrenoGymActual();
        return;
    }

    serie.completada = completada;

    const ejercicio = workoutGymActual[indice];
    ejercicio.completado = ejercicio.series.every(s => s.completada);

    guardarEstadoGym();
    renderEntrenoGymActual();
}

function agregarSerieGym(indice) {
    const ejercicio = workoutGymActual[indice];
    if (!ejercicio) return;

    const ultimaSerie = ejercicio.series[ejercicio.series.length - 1];

    ejercicio.series.push({
    peso: Number(ultimaSerie?.peso ?? ejercicio.peso) || 0,
    repeticiones: "",
    tipo: "efectiva",
    completada: false
    });

    ejercicio.completado = false;
    guardarEstadoGym();
    renderEntrenoGymActual();
}

function eliminarSerieGym(indice, numeroSerie) {
    const ejercicio = workoutGymActual[indice];

    if (!ejercicio || ejercicio.series.length <= 1) {
        alert("Debe quedar al menos una serie.");
        return;
    }

    const confirmar = confirm(
        `¿Quieres eliminar la serie ${numeroSerie + 1}?`
    );

    if (!confirmar) return;

    ejercicio.series.splice(numeroSerie, 1);

    ejercicio.completado =
        ejercicio.series.every(serie => serie.completada);

    guardarEstadoGym();
    renderEntrenoGymActual();
}

function marcarEjercicioCompletado(indice) {
    const ejercicio = workoutGymActual[indice];
    if (!ejercicio) return;

    const todasCompletadas = ejercicio.series.every(serie => serie.completada);

    if (!todasCompletadas) {
        alert("Completa las series que hayas realizado antes de marcar el ejercicio como terminado.");
        return;
    }

    ejercicio.completado = !ejercicio.completado;
    guardarEstadoGym();
    renderEntrenoGymActual();
}

function irSiguienteEjercicioGym(indice) {
    const siguiente = workoutGymActual.findIndex(
        (ejercicio, i) => i > indice && !ejercicio.completado
    );

    if (siguiente === -1) {
        volverListaEjerciciosGym();
        return;
    }

    ejercicioGymSeleccionado = siguiente;
    renderEntrenoGymActual();
}

function guardarEstadoGym() {
    const estado = {
        dia: diaRutinaActiva,
        id: sesionGymIdActiva,
        ejercicios: workoutGymActual,
        inicio: timerStartTime
    };

    localStorage.setItem(
        STORAGE_KEYS.gymSession,
        JSON.stringify(estado)
    );
}

function restaurarEstadoGym() {
    const estado = leerJSON(STORAGE_KEYS.gymSession, null);

    if (!estado || !Array.isArray(estado.ejercicios) ||
        !estado.ejercicios.length) return;

    diaRutinaActiva = estado.dia || "Lunes";
    sesionGymIdActiva = estado.id || Date.now();
    timerStartTime = estado.inicio || Date.now();

    // Compatibilidad con sesiones creadas con la versión anterior.
    workoutGymActual = estado.ejercicios.map(ejercicio => ({
        ...ejercicio,
        series: Array.isArray(ejercicio.series)
            ? ejercicio.series
            : Array.from(
                { length: Number(ejercicio.sets) || 3 },
                (_, i) => ({
                    peso: Number(ejercicio.pesoReal ?? ejercicio.peso) || 0,
                    repeticiones: i < (Number(ejercicio.seriesRealizadas) || 0)
                        ? String(ejercicio.repeticionesRealizadas || "")
                        : "",
                    completada: i < (Number(ejercicio.seriesRealizadas) || 0)
                })
            )
    }));

    ejercicioGymSeleccionado = null;

    const selector = document.getElementById("select-rutina-guardada");
    if (selector) selector.value = diaRutinaActiva;

    const selectorRutina = document.getElementById("card-select-rutina");
    if (selectorRutina) selectorRutina.style.display = "none";

    const acciones = document.getElementById("gym-bottom-actions");
    if (acciones) acciones.style.display = "block";

    const barra = document.getElementById("gym-timer-bar");
    if (barra) barra.style.display = "flex";

    renderEntrenoGymActual();
    iniciarTemporizadorGym();
}

function cancelarEntrenoGym() {
    if (!workoutGymActual.length) return;

    const confirmar = confirm(
        "¿Quieres cancelar el entrenamiento? Se perderá la sesión que no hayas guardado."
    );

    if (!confirmar) return;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = null;
    timerStartTime = null;
    sesionGymIdActiva = null;
    workoutGymActual = [];
    ejercicioGymSeleccionado = null;

    localStorage.removeItem(STORAGE_KEYS.gymSession);

    const selectorRutina = document.getElementById("card-select-rutina");
    if (selectorRutina) selectorRutina.style.display = "block";

    const acciones = document.getElementById("gym-bottom-actions");
    if (acciones) acciones.style.display = "none";

    const barra = document.getElementById("gym-timer-bar");
    if (barra) barra.style.display = "none";

    renderEntrenoGymActual();
}

function finalizarYGuardarGym() {
    finalizarEntrenoGym();
}

function finalizarEntrenoGym() {
    if (!workoutGymActual.length) {
        alert("No hay ningún entrenamiento que guardar.");
        return;
    }

    const confirmar = confirm("¿Quieres finalizar y guardar este entrenamiento?");
    if (!confirmar) return;

    const fecha = new Date();

    const ejerciciosGuardados = workoutGymActual.map(ejercicio => ({
        ...ejercicio,
        series: ejercicio.series.map(serie => ({ ...serie })),
        seriesRealizadas: ejercicio.series.filter(s => s.completada).length,
        pesoReal: ejercicio.series.length
            ? ejercicio.series[ejercicio.series.length - 1].peso
            : ejercicio.peso
    }));

    const completados = ejerciciosGuardados.filter(e => e.completado).length;

    const registro = DB_API.guardarRegistro({
        tipo: "Fuerza",
        disciplina: "Gimnasio",
        titulo: `Entrenamiento de fuerza — ${diaRutinaActiva}`,
        fechaISO: fecha.toISOString(),
        duracion: timerStartTime
            ? Math.round((Date.now() - timerStartTime) / 60000)
            : 0,
        ejercicios: ejerciciosGuardados,
        ejerciciosCompletados: completados,
        totalEjercicios: ejerciciosGuardados.length,
        resumen: `${completados} de ${ejerciciosGuardados.length} ejercicios completados`
    });

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = null;
    timerStartTime = null;
    sesionGymIdActiva = null;
    workoutGymActual = [];
    ejercicioGymSeleccionado = null;

    localStorage.removeItem(STORAGE_KEYS.gymSession);

    const selectorRutina = document.getElementById("card-select-rutina");
    if (selectorRutina) selectorRutina.style.display = "block";

    const acciones = document.getElementById("gym-bottom-actions");
    if (acciones) acciones.style.display = "none";

    const barra = document.getElementById("gym-timer-bar");
    if (barra) barra.style.display = "none";

    const contenedor = document.getElementById("workout-active-area");
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="card glass-card">
                <h3>Entrenamiento guardado</h3>
                <p>${escaparHTML(registro.resumen)}</p>
            </div>
        `;
    }

    renderFeedHistorico();
    renderCalendarioSemanal();

    alert(
        `Entrenamiento guardado. Ejercicios completados: ${completados}/${ejerciciosGuardados.length}.`
    );
}


/* -------------------- CARDIO -------------------- */
function setDiscipline(disciplina) {
    disciplinaActiva = disciplina;

    document.querySelectorAll("[data-disciplina]").forEach(el => {
        el.classList.toggle("active", el.dataset.disciplina === disciplina);
    });

    const titulo = document.getElementById("titulo-disciplina-cardio");
    if (titulo) titulo.textContent = disciplina;

    const selector = document.getElementById("select-entreno-cardio");
    if (selector) {
        const opciones = {
            "Natación": ["Natación 10×100m", "Natación 3×400m"],
            "Carrera": ["Carrera Corta 6×(1'/4')", "Carrera Larga Z2"],
            "Ciclismo": ["Bici Corta 35km / Rodillo", "Bici Larga 85km"]
        };
        const lista = opciones[disciplina] || [];
        selector.innerHTML = lista.map(nombre =>
            `<option value="${escaparHTML(nombre)}">${escaparHTML(nombre)}</option>`
        ).join("");
    }

    actualizarDetalleCardio();
}

function actualizarDetalleCardio() {
    const selector = document.getElementById("select-entreno-cardio");
    const nombre = selector?.value;
    const detalle = CARDIO_DETALLES[nombre];
    if (!detalle) return;

    const asignaciones = {
        "cardio-calentamiento": detalle.calentamiento,
        "cardio-bloque-series": detalle.bloqueSeries,
        "cardio-descanso": detalle.descanso,
        "cardio-vuelta-calma": detalle.vueltaCalma,
        "cardio-volumen-total": detalle.volumenTotal
    };

    Object.entries(asignaciones).forEach(([id, texto]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = texto;
    });
}

function calcularRitmoCardio(distanciaKm, duracionMin) {
    const distancia = Number(distanciaKm);
    const duracion = Number(duracionMin);
    if (!(distancia > 0) || !(duracion > 0)) return "—";

    const minutosPorKm = duracion / distancia;
    const minutos = Math.floor(minutosPorKm);
    const segundos = Math.round((minutosPorKm - minutos) * 60);
    return `${minutos}:${String(segundos).padStart(2, "0")} min/km`;
}

function guardarEntrenoCardio(event) {
    event?.preventDefault();

    const obtener = id => document.getElementById(id);
    const selector = obtener("select-entreno-cardio");
    const nombre = selector?.value || disciplinaActiva;
    const distancia = Number(obtener("cardio-distancia")?.value || 0);
    const duracion = Number(obtener("cardio-duracion")?.value || 0);
    const esfuerzo = obtener("cardio-esfuerzo")?.value || "Moderado";
    const notas = obtener("cardio-notas")?.value || "";

    if (duracion <= 0) {
        alert("Introduce una duración válida en minutos.");
        return;
    }

    const tipo = CARDIO_DETALLES[nombre]?.tipo || disciplinaActiva;
    const registro = DB_API.guardarRegistro({
        tipo: "Cardio",
        disciplina: tipo,
        titulo: nombre,
        fechaISO: new Date().toISOString(),
        distancia,
        duracion,
        ritmo: tipo === "Carrera" ? calcularRitmoCardio(distancia, duracion) : "",
        esfuerzo,
        notas
    });

    const mensaje = document.getElementById("mensaje-cardio-guardado");
    if (mensaje) mensaje.textContent = "Entrenamiento de cardio guardado.";
    ["cardio-distancia", "cardio-duracion", "cardio-notas"].forEach(id => {
        const campo = obtener(id);
        if (campo) campo.value = "";
    });

    renderFeedHistorico();
    renderCalendarioSemanal();
    alert(`Sesión guardada: ${registro.titulo}`);
}
/* -------------------- SALUD Y MEDICIONES -------------------- */
function guardarDatosSalud(event) {
    event?.preventDefault();

    const obtenerNumero = id => {
        const valor = document.getElementById(id)?.value;
        return valor === "" || valor == null ? null : Number(valor);
    };

    const registro = {
        fechaISO: new Date().toISOString(),
        peso: obtenerNumero("salud-peso"),
        cintura: obtenerNumero("salud-cintura"),
        grasa: obtenerNumero("salud-grasa"),
        fcReposo: obtenerNumero("salud-fc-reposo"),
        horasSueno: obtenerNumero("salud-sueno"),
        notas: document.getElementById("salud-notas")?.value || ""
    };

    const hayDatos = Object.entries(registro).some(([clave, valor]) =>
        clave !== "fechaISO" && clave !== "notas" && valor !== null
    );

    if (!hayDatos) {
        alert("Introduce al menos una medición antes de guardar.");
        return;
    }

    const registros = leerJSON(STORAGE_KEYS.health, []);
    registros.push(registro);
    localStorage.setItem(STORAGE_KEYS.health, JSON.stringify(registros));

    const mensaje = document.getElementById("mensaje-salud-guardado");
    if (mensaje) mensaje.textContent = "Mediciones guardadas correctamente.";

    ["salud-peso", "salud-cintura", "salud-grasa",
        "salud-fc-reposo", "salud-sueno", "salud-notas"].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    inicializarGraficasSalud();
    actualizarResumenSalud();
    alert("Mediciones de salud guardadas.");
}

function actualizarResumenSalud() {
    const registros = leerJSON(STORAGE_KEYS.health, []);
    const ultimo = registros[registros.length - 1];
    if (!ultimo) return;

    const asignaciones = [
        ["resumen-peso", ultimo.peso, " kg"],
        ["resumen-cintura", ultimo.cintura, " cm"],
        ["resumen-grasa", ultimo.grasa, "%"],
        ["resumen-fc-reposo", ultimo.fcReposo, " lpm"]
    ];

    asignaciones.forEach(([id, valor, unidad]) => {
        const elemento = document.getElementById(id);
        if (elemento && valor != null) elemento.textContent = `${valor}${unidad}`;
    });
}

function inicializarGraficasSalud() {
    actualizarResumenSalud();

    if (typeof Chart === "undefined") {
        console.warn("Chart.js no está cargado. Se omiten las gráficas.");
        return;
    }

    const registros = leerJSON(STORAGE_KEYS.health, []);
    const ordenados = registros
        .filter(r => r.fechaISO)
        .sort((a, b) => new Date(a.fechaISO) - new Date(b.fechaISO));

    const etiquetas = ordenados.map(r =>
        new Date(r.fechaISO).toLocaleDateString("es-ES", {
            day: "2-digit", month: "short"
        })
    );

    const definiciones = [
        { id: "grafica-peso", campo: "peso", etiqueta: "Peso (kg)" },
        { id: "grafica-cintura", campo: "cintura", etiqueta: "Cintura (cm)" },
        { id: "grafica-grasa", campo: "grasa", etiqueta: "Grasa corporal (%)" },
        { id: "grafica-fc-reposo", campo: "fcReposo", etiqueta: "FC reposo (lpm)" }
    ];

    definiciones.forEach(def => {
        const canvas = document.getElementById(def.id);
        if (!canvas) return;

        if (chartsSalud[def.id]) {
            chartsSalud[def.id].destroy();
        }

        const puntos = ordenados.map(r => r[def.campo]);
        if (!puntos.some(v => typeof v === "number" && Number.isFinite(v))) {
            const contexto = canvas.getContext("2d");
            if (contexto) contexto.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        chartsSalud[def.id] = new Chart(canvas, {
            type: "line",
            data: {
                labels: etiquetas,
                datasets: [{
                    label: def.etiqueta,
                    data: puntos,
                    spanGaps: true,
                    tension: 0.25,
                    pointRadius: 3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    });
}

/* -------------------- HISTORIAL DE ENTRENAMIENTOS -------------------- */
function renderFeedHistorico() {
    const contenedor =
        document.getElementById("feed-historico") ||
        document.getElementById("lista-historico-entrenos");

    if (!contenedor) return;

    const entrenos = DB_API.obtenerTodosLosEntrenos()
        .sort((a, b) => {
            const fa = obtenerFechaEntreno(a)?.getTime() || 0;
            const fb = obtenerFechaEntreno(b)?.getTime() || 0;
            return fb - fa;
        });

    if (!entrenos.length) {
        contenedor.innerHTML = `<p class="empty-state">Todavía no tienes entrenamientos guardados.</p>`;
        return;
    }

    contenedor.innerHTML = entrenos.map(entreno => {
        const fecha = obtenerFechaEntreno(entreno);
        const fechaTexto = fecha
            ? fecha.toLocaleDateString("es-ES", {
                day: "2-digit", month: "short", year: "numeric"
            })
            : "Fecha no disponible";

        return `
            <article class="history-card">
                <div>
                    <h4>${escaparHTML(entreno.titulo || entreno.disciplina || entreno.tipo || "Entrenamiento")}</h4>
                    <p>${escaparHTML(fechaTexto)} · ${escaparHTML(entreno.tipo || "")}</p>
                    <p>${Number(entreno.duracion) || 0} minutos</p>
                    ${entreno.resumen ? `<p>${escaparHTML(entreno.resumen)}</p>` : ""}
                </div>
                <button type="button" onclick="verDetalleEntreno(${Number(entreno.id)})">
                    Ver detalle
                </button>
            </article>
        `;
    }).join("");
}


function verDetalleEntreno(id) {
    const entreno = DB_API.obtenerTodosLosEntrenos()
        .find(e => Number(e.id) === Number(id));

    if (!entreno) {
        alert("No se ha encontrado ese entrenamiento.");
        return;
    }

    const modal = document.getElementById("modal-detalle-entreno");
    const contenido = document.getElementById("contenido-detalle-entreno");

    if (contenido) {
        const fecha = obtenerFechaEntreno(entreno);
        const fechaTexto = fecha
            ? fecha.toLocaleString("es-ES")
            : "Fecha no disponible";

        let listaEjercicios = "";

        if (Array.isArray(entreno.ejercicios)) {
            listaEjercicios = entreno.ejercicios.map(e => {
                let detalleSeries = "";

                if (Array.isArray(e.series) && e.series.length) {
                    detalleSeries = `
                        <div class="history-sets">
                            ${e.series.map((serie, i) => `
                                <p>
                                    <strong>Serie ${i + 1}:</strong>
                                    ${Number(serie.peso) || 0} kg ×
                                    ${serie.repeticiones !== ""
                                        && serie.repeticiones != null
                                        ? escaparHTML(serie.repeticiones) + " repeticiones"
                                        : "Repeticiones no registradas"}
                                    ${serie.completada ? " ✓" : ""}
                                </p>
                            `).join("")}
                        </div>
                    `;
                } else {
                    detalleSeries = `
                        <p>
                            ${Number(e.seriesRealizadas ?? e.sets) || 0}
                            series registradas ·
                            ${Number(e.pesoReal ?? e.peso) || 0} kg
                        </p>
                    `;
                }

                return `
                    <article class="history-exercise">
                        <h4>${escaparHTML(e.nombre || "Ejercicio")}</h4>
                        ${detalleSeries}
                    </article>
                `;
            }).join("");
        }

        contenido.innerHTML = `
            <h3>${escaparHTML(entreno.titulo || "Entrenamiento")}</h3>
            <p><strong>Fecha:</strong> ${escaparHTML(fechaTexto)}</p>
            <p><strong>Tipo:</strong> ${escaparHTML(entreno.tipo || "—")}</p>
            <p><strong>Disciplina:</strong> ${escaparHTML(entreno.disciplina || "—")}</p>
            <p><strong>Duración:</strong> ${Number(entreno.duracion) || 0} min</p>

            ${entreno.distancia
                ? `<p><strong>Distancia:</strong> ${Number(entreno.distancia)} km</p>`
                : ""}

            ${entreno.ritmo
                ? `<p><strong>Ritmo:</strong> ${escaparHTML(entreno.ritmo)}</p>`
                : ""}

            ${entreno.notas
                ? `<p><strong>Notas:</strong> ${escaparHTML(entreno.notas)}</p>`
                : ""}

            ${listaEjercicios
                ? `<h3>Ejercicios realizados</h3>${listaEjercicios}`
                : ""}
        `;
    }

    if (modal) modal.style.display = "flex";
}


function cerrarModalDetalleEntreno() {
    const modal = document.getElementById("modal-detalle-entreno");
    if (modal) modal.style.display = "none";
}

/* -------------------- CALENDARIO SEMANAL -------------------- */
function cambiarSemanaCalendario(cambio) {
    semanaSeleccionadaOffset += Number(cambio) || 0;
    renderCalendarioSemanal();
}

function irSemanaActual() {
    semanaSeleccionadaOffset = 0;
    renderCalendarioSemanal();
}

function renderCalendarioSemanal() {
    const fechas = obtenerFechasSemana(semanaSeleccionadaOffset);
    const inicio = fechas[0];
    const fin = fechas[6];

    const titulo = document.getElementById("titulo-semana-calendario");
    if (titulo) titulo.textContent = formatearRangoSemana(inicio);

    const contenedor =
        document.getElementById("calendario-semanal") ||
        document.getElementById("grid-calendario-semanal");

    const entrenos = DB_API.obtenerTodosLosEntrenos().filter(e => {
        const fecha = obtenerFechaEntreno(e);
        return fecha && fecha >= inicio &&
            fecha < new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() + 1);
    });

    if (contenedor) {
        contenedor.innerHTML = fechas.map(fecha => {
            const entrenosDia = entrenos.filter(e => {
                const f = obtenerFechaEntreno(e);
                return f && f.toDateString() === fecha.toDateString();
            });

            const diaNombre = fecha.toLocaleDateString("es-ES", { weekday: "short" });
            const esHoy = fecha.toDateString() === new Date().toDateString();

            return `
                <div class="calendar-day ${esHoy ? "today" : ""}">
                    <div class="calendar-day-heading">
                        <span>${escaparHTML(diaNombre)}</span>
                        <strong>${fecha.getDate()}</strong>
                    </div>
                    ${entrenosDia.length
                        ? entrenosDia.map(e => `
                            <div class="calendar-event">
                                ${escaparHTML(e.titulo || e.disciplina || e.tipo || "Entreno")}
                            </div>
                        `).join("")
                        : `<span class="calendar-empty">Sin entrenos</span>`
                    }
                </div>
            `;
        }).join("");
    }

    actualizarProgresoSemana(entrenos);
}

function actualizarProgresoSemana(entrenos) {
    const objetivos = {
        fuerza: 6,
        cardio: 2
    };

    const fuerza = entrenos.filter(e => e.tipo === "Fuerza").length;
    const cardio = entrenos.filter(e => e.tipo === "Cardio").length;

    const asignaciones = [
        ["progreso-fuerza-semana", fuerza, objetivos.fuerza],
        ["progreso-cardio-semana", cardio, objetivos.cardio]
    ];

    asignaciones.forEach(([id, valor, objetivo]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            const porcentaje = Math.min(100, Math.round(valor / objetivo * 100));
            elemento.textContent = `${valor}/${objetivo}`;
            elemento.setAttribute("aria-valuenow", String(porcentaje));
        }
    });
} 
/* -------------------- DISPONIBILIDAD DE PISCINA -------------------- */
function piscinaDisponibleEnFecha(fecha, perfil = null) {
    const datos = perfil || leerJSON(STORAGE_KEYS.profile, {});
    if (datos.piscinaTipo !== "Abierta") return true;

    const inicio = Number(datos.piscinaMesInicio || 5);
    const fin = Number(datos.piscinaMesFin || 10);
    const mes = fecha.getMonth() + 1;

    return inicio <= fin
        ? mes >= inicio && mes <= fin
        : mes >= inicio || mes <= fin;
}

function porcentaje(valor, objetivo) {
    if (!(objetivo > 0)) return 0;
    return Math.min(100, Math.round((valor / objetivo) * 100));
}

/* -------------------- AJUSTES DEL CALENDARIO -------------------- */
function abrirAjusteModal(dia, tipo, fechaISO) {
    const fecha = fechaISO ||
        obtenerFechasSemana(semanaSeleccionadaOffset)[
            ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(dia)
        ]?.toISOString().slice(0, 10);

    const campoDia = document.getElementById("ajuste-dia-key");
    const campoTipo = document.getElementById("ajuste-tipo-key");
    const titulo = document.getElementById("modal-ajuste-titulo");
    const etiqueta = document.getElementById("lbl-ajuste-val1");
    const inputValor = document.getElementById("ajuste-input-val1");
    const inputTiempo = document.getElementById("ajuste-input-tiempo");

    if (campoDia) campoDia.value = fecha || dia;
    if (campoTipo) campoTipo.value = tipo;

    if (titulo) titulo.textContent = `${dia} · Registrar ${tipo}`;

    if (etiqueta) {
        const etiquetas = {
            Fuerza: "Series efectivas completadas",
            Natación: "Distancia completada en metros",
            Ciclismo: "Distancia completada en kilómetros",
            Carrera: "Tiempo completado en minutos"
        };
        etiqueta.textContent = etiquetas[tipo] || "Valor realizado";
    }

    if (inputValor) inputValor.value = "";
    if (inputTiempo) inputTiempo.value = "";

    mostrarModal("modal-ajuste-cal");
}

function cerrarModalAjusteDirecto() {
    const modal = document.getElementById("modal-ajuste-cal");
    if (modal) modal.style.display = "none";
}

function guardarAjusteEntrenoModal(event) {
    event?.preventDefault();

    const fecha = document.getElementById("ajuste-dia-key")?.value;
    const tipo = document.getElementById("ajuste-tipo-key")?.value;
    const valorTexto = document.getElementById("ajuste-input-val1")?.value;
    const tiempoTexto = document.getElementById("ajuste-input-tiempo")?.value;

    const valor = Number(valorTexto);
    const tiempo = tiempoTexto === "" ? null : Number(tiempoTexto);

    if (!fecha || valorTexto === "" || !Number.isFinite(valor) || valor < 0) {
        alert("Introduce un valor válido.");
        return;
    }

    const ajustes = leerJSON(STORAGE_KEYS.adjustments, {});
    ajustes[`${fecha}|${tipo}`] = {
        valor,
        tiempo,
        actualizadoEn: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.adjustments, JSON.stringify(ajustes));

    const fechaRegistro = new Date(`${fecha}T12:00:00`);

    if (tipo === "Fuerza") {
        DB_API.guardarRegistro({
            tipo: "Fuerza",
            titulo: `Registro manual de fuerza · ${fecha}`,
            fechaISO: fechaRegistro.toISOString(),
            seriesEfectivasAcumuladas: valor,
            ejercicios: [],
            manual: true
        });
    } else if (["Natación", "Ciclismo", "Carrera"].includes(tipo)) {
        const esCarrera = tipo === "Carrera";
        const esRodillo = tipo === "Ciclismo" && valor === 0;

        DB_API.guardarRegistro({
            tipo: "Cardio",
            disciplina: tipo,
            titulo: `Registro manual · ${tipo}`,
            fechaISO: fechaRegistro.toISOString(),
            duracion: esCarrera ? valor : (tiempo || 0),
            tiempoVal: esCarrera ? valor : (tiempo || 0),
            distancia: esCarrera ? 0 : valor,
            distanciaVal: esCarrera || esRodillo ? null : valor,
            distanciaUnidad: tipo === "Natación" ? "m" : "km",
            modalidad: esRodillo ? "Rodillo" : "Exterior"
        });
    }

    cerrarModalAjusteDirecto();
    renderCalendarioSemanal();
    renderFeedHistorico();
}

/* -------------------- MODALES GENERALES -------------------- */
function mostrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "flex";
    if (window.lucide) window.lucide.createIcons();
}

function cerrarModalDetalle(event) {
    if (event && event.target !== event.currentTarget) return;
    cerrarModalDetalleDirecto();
}

function cerrarModalDetalleDirecto() {
    const modal = document.getElementById("modal-detalle");
    if (modal) modal.style.display = "none";
}

/* -------------------- ANÁLISIS LOCAL DE PROGRESO -------------------- */
function generarAnalisisIA() {
    const entrenamientos = DB_API.obtenerTodosLosEntrenos();
    const salida = document.getElementById("ia-diagnostico-texto");
    const area = document.getElementById("ia-resultado-area");

    if (!salida || !area) return;

    const fuerza = entrenamientos.filter(e =>
        e.tipo === "Fuerza" || e.tipoCategoria === "Gym"
    );

    const cardio = entrenamientos.filter(e =>
        e.tipo === "Cardio" || e.tipoCategoria === "Cardio"
    );

    if (!entrenamientos.length) {
        salida.innerHTML = `
            <p>Aún no tienes entrenamientos guardados.</p>
            <p>Registra tus sesiones para empezar a revisar tu progreso.</p>
        `;
        area.style.display = "block";
        return;
    }

    const minutosCardio = cardio.reduce(
        (total, e) => total + (Number(e.duracion ?? e.tiempoVal) || 0),
        0
    );

    const sesionesFuerza = fuerza.length;
    const sesionesCardio = cardio.length;

    salida.innerHTML = `
        <h3>Resumen de tu actividad</h3>
        <ul>
            <li>Entrenamientos registrados: ${entrenamientos.length}</li>
            <li>Sesiones de fuerza: ${sesionesFuerza}</li>
            <li>Sesiones de cardio: ${sesionesCardio}</li>
            <li>Minutos de cardio registrados: ${minutosCardio}</li>
        </ul>
        <p>
            Mantén una progresión gradual, registra los pesos y las repeticiones
            y procura recuperarte bien entre sesiones.
        </p>
        <p class="muted-text">
            Este resumen se calcula localmente a partir de tus datos guardados;
            no es una IA conectada a internet ni sustituye una valoración profesional.
        </p>
    `;

    area.style.display = "block";
}

/* -------------------- INICIALIZACIÓN FINAL -------------------- */
document.addEventListener("change", event => {
    if (event.target?.id === "select-rutina-guardada") {
        diaRutinaActiva = event.target.value || "Lunes";
        actualizarVistaRutina();
        renderListaEjerciciosRutina();
    }

    if (event.target?.id === "select-entreno-cardio") {
        actualizarDetalleCardio();
    }
});


/* -------------------- CRONÓMETRO DEL GIMNASIO -------------------- */

function iniciarTemporizadorGym() {
    // Evita crear varios cronómetros a la vez.
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    const barra = document.getElementById("gym-timer-bar");
    const reloj = document.getElementById("gym-timer-clock");

    if (barra) {
        barra.style.display = "flex";
    }

    if (!timerStartTime) {
        timerStartTime = Date.now();
    }

    function actualizarReloj() {
        const elemento = document.getElementById("gym-timer-clock");
        if (!elemento) return;

        const segundosTotales = Math.max(
            0,
            Math.floor((Date.now() - timerStartTime) / 1000)
        );

        const horas = Math.floor(segundosTotales / 3600);
        const minutos = Math.floor((segundosTotales % 3600) / 60);
        const segundos = segundosTotales % 60;

        elemento.textContent = [
            horas,
            minutos,
            segundos
        ].map(n => String(n).padStart(2, "0")).join(":");
    }

    actualizarReloj();
    timerInterval = setInterval(actualizarReloj, 1000);
    actualizarBotonesGym();
}

function detenerTemporizadorGym() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    timerStartTime = null;

    const barra = document.getElementById("gym-timer-bar");
    const reloj = document.getElementById("gym-timer-clock");

    if (barra) {
        barra.style.display = "none";
    }

    if (reloj) {
        reloj.textContent = "00:00:00";
    }

    actualizarBotonesGym();
}


function iniciarEntrenoHoy() {
    // Si ya hay un entrenamiento activo, abrir Gym sin iniciar otro.
    if (timerStartTime !== null) {
        const botonGym = document.querySelectorAll(".nav-item")[2];

        if (typeof switchTab === "function") {
            switchTab("gym", botonGym);
        }

        return;
    }

    const diasSemana = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];

    const hoy = diasSemana[new Date().getDay()];

    // El domingo no tiene rutina de fuerza.
    if (hoy === "Domingo") {
        alert("Hoy toca descansar de fuerza. ¡A recuperar!");
        return;
    }

    // Seleccionar automáticamente la rutina de hoy.
    const selector = document.getElementById("select-rutina-guardada");

    if (selector) {
        selector.value = hoy;
    }

    if (typeof actualizarVistaRutina === "function") {
        actualizarVistaRutina();
    }

    const botonGym = document.querySelectorAll(".nav-item")[2];

    if (typeof switchTab === "function") {
        switchTab("gym", botonGym);
    }

    iniciarEntrenoGym();
}



function actualizarBotonesGym() {
    const entrenando = timerInterval !== null && timerStartTime !== null;

    const botones = [
        {
            id: "btn-iniciar-fuerza",
            textoNormal: "Empezar Fuerza"
        },
        {
            id: "btn-iniciar-entreno-gym",
            textoNormal: "Iniciar entreno"
        }
    ];

    botones.forEach(({ id, textoNormal }) => {
        const boton = document.getElementById(id);
        if (!boton) return;

        boton.classList.toggle("btn-gym-active", entrenando);

        boton.innerHTML = entrenando
            ? '<i data-lucide="square"></i><span>Entrenamiento en curso</span>'
            : `<i data-lucide="play"></i><span>${textoNormal}</span>`;
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}


console.log("App Triatlón: script.js cargado.");