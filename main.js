// Función para eliminar tildes y convertir a minúsculas
    const normalizarTexto = (str) => {
      return str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
        .toLowerCase();
    };

    const toggle = document.getElementById("theme-toggle");
    const body = document.body;

    if (localStorage.getItem("modo") === "dark") {
      body.classList.add("active");
    }

    toggle.addEventListener("click", () => {
      body.classList.toggle("active");
      const modo = body.classList.contains("active") ? "dark" : "light";
      localStorage.setItem("modo", modo);
    });

    // Créditos por ramo (simulado)
    const creditosRamos = {
      "Fundamentos de Matemáticas para Ingeniería": 6,
      "Introducción a la Ingeniería Informática": 4,
      "Fundamentos de Algoritmos": 4,
      "Bienestar y Aprendizaje Universitario": 2,
      "Cálculo Diferencial e Integral": 6,
      "Álgebra Lineal": 4,
      "Fundamentos de Programación": 4,
      "Desarrollo Integral y Comunicación para Ingeniería": 3,
      "Formación Fundamental": 2, //FOFU
      "Física para Ingeniería": 5,
      "Cálculo en Varias Variables": 4,
      "Análisis Inteligente de Datos": 4,
      "Estructura de Datos": 4,
      "Antropología Cristiana": 2, //FOFU
      "Formación Fundamental 2": 2, //FOFU
      "Física Electromagnetismo": 3,
      "Métodos Numéricos": 3,
      "Análisis y Diseño de Algoritmos": 4,
      "Programación Avanzada": 4,
      "Ética Cristiana": 2, //FOFU
      "Inglés 1": 2,
      "Física Moderna": 3,
      "Autómatas y Compiladores": 3,
      "Base de Datos": 4,
      "Inteligencia Artificial": 4,
      "Hardware y Sistemas Operativos": 4,
      "Inglés 2": 2,
      "Ciencia y Tecnología": 3,
      "Estadística Computacional": 4,
      "Administración de Empresas": 3,
      "Modelamiento de Software": 4,
      "Redes de Computadores": 4,
      "Inglés 3": 2,
      "Robótica y Sistemas Autónomos": 3,
      "Optimización": 4,
      "Ingeniería de Software": 4,
      "Ingeniería Web y Móvil": 4,
      "Computación Paralela y Distribuida": 4,
      "Inglés 4": 2,
      "Economía y Finanzas": 3,
      "Ingeniería de Requerimientos": 4,
      "Taller de Base de Datos": 4,
      "Ciberseguridad": 4,
      "Formación Fundamental 3": 2, //FOFU
      "Optativo I": 4,
      "Administración de proyectos informáticos": 3,
      "Taller Ingeniería de Software": 4,
      "Tecnologías Emergentes": 4,
      "Experiencia del Usuario": 3,
      "Negocios, innovación y emprendimiento": 3,
      "Optativo II": 4,
      "Taller de Formulación de Proyectos Informáticos": 4,
      "Seminario de Título": 5,
      "Legislación, Ética y Tecnológica": 3,
      "Taller de Liderazgo y Trabajo en Equipo": 3,
      "Optativo III": 4,
      "Proyecto de Título": 12,
      "Optativo IV": 4
    };

    // Categorías por área (ACTUALIZADO con siglas)
    const ramos = {
      "Fundamentos de Matemáticas para Ingeniería": { 
        semestre: 1, 
        abre: ["Cálculo Diferencial e Integral", "Álgebra Lineal", "Física para Ingeniería"],
        area: "matematicas",
        sigla: "MAT1001"
      },
      "Introducción a la Ingeniería Informática": { 
        semestre: 1, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI1243"
      },
      "Fundamentos de Algoritmos": { 
        semestre: 1, 
        abre: ["Fundamentos de Programación"],
        area: "programacion",
        sigla: "ICI1241"
      },
      "Bienestar y Aprendizaje Universitario": { 
        semestre: 1, 
        abre: [],
        area: "humanidades",
        sigla: "ICI1458"
      },
      "Cálculo Diferencial e Integral": { 
        semestre: 2, 
        abre: ["Cálculo en Varias Variables", "Análisis Inteligente de Datos"],
        area: "matematicas",
        sigla: "MAT1002"
      },
      "Álgebra Lineal": { 
        semestre: 2, 
        abre: [],
        area: "matematicas",
        sigla: "MAT1004"
      },
      "Fundamentos de Programación": { 
        semestre: 2, 
        abre: ["Estructura de Datos", "Métodos Numéricos", "Base de Datos", "Hardware y Sistemas Operativos"],
        area: "programacion",
        sigla: "ICI1242"
      },
      "Desarrollo Integral y Comunicación para Ingeniería": { 
        semestre: 2, 
        abre: [],
        area: "humanidades",
        sigla: "FIN100-14"
      },
      "Formación Fundamental": { 
        semestre: 2, 
        abre: [],
        area: "fofu",
        sigla: "FFUND1"
      },
      "Física para Ingeniería": { 
        semestre: 3, 
        abre: ["Física Electromagnetismo"],
        area: "fisica",
        sigla: "FIS1002"
      },
      "Cálculo en Varias Variables": { 
        semestre: 3, 
        abre: ["Estadística Computacional"],
        area: "matematicas",
        sigla: "MAT1003"
      },
      "Análisis Inteligente de Datos": { 
        semestre: 3, 
        abre: [],
        area: "programacion",
        sigla: "ICI2145"
      },
      "Estructura de Datos": { 
        semestre: 3, 
        abre: ["Programación Avanzada"],
        area: "programacion",
        sigla: "ICI2240"
      },
      "Antropología Cristiana": { 
        semestre: 3, 
        abre: [],
        area: "fofu",
        sigla: "ICR010"
      },
      "Formación Fundamental 2": { 
        semestre: 3, 
        abre: [],
        area: "fofu",
        sigla: "FFUND2"
      },
      "Física Electromagnetismo": { 
        semestre: 4, 
        abre: ["Física Moderna"],
        area: "fisica",
        sigla: "FIS2120"
      },
      "Métodos Numéricos": { 
        semestre: 4, 
        abre: [],
        area: "matematicas",
        sigla: "ICI2141"
      },
      "Análisis y Diseño de Algoritmos": { 
        semestre: 4, 
        abre: ["Inteligencia Artificial"],
        area: "programacion",
        sigla: "ICI2242"
      },
      "Programación Avanzada": { 
        semestre: 4, 
        abre: ["Autómatas y Compiladores"],
        area: "programacion",
        sigla: "ICI2241"
      },
      "Ética Cristiana": { 
        semestre: 4, 
        abre: [],
        area: "fofu",
        sigla: "ICR020"
      },
      "Inglés 1": { 
        semestre: 4, 
        abre: ["Inglés 2"],
        area: "humanidades",
        sigla: "ING9001"
      },
      "Física Moderna": { 
        semestre: 5, 
        abre: [],
        area: "fisica",
        sigla: "FIS3149"
      },
      "Autómatas y Compiladores": { 
        semestre: 5, 
        abre: ["Redes de Computadores"],
        area: "programacion",
        sigla: "ICI3245"
      },
      "Base de Datos": { 
        semestre: 5, 
        abre: ["Modelamiento de Software", "Taller de Base de Datos"],
        area: "programacion",
        sigla: "ICI3240"
      },
      "Inteligencia Artificial": { 
        semestre: 5, 
        abre: [],
        area: "programacion",
        sigla: "ICI3244"
      },
      "Hardware y Sistemas Operativos": { 
        semestre: 5, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI3344"
      },
      "Inglés 2": { 
        semestre: 5, 
        abre: ["Inglés 3"],
        area: "humanidades",
        sigla: "ING9002"
      },
      "Ciencia y Tecnología": { 
        semestre: 6, 
        abre: [],
        area: "humanidades",
        sigla: "ICI3150"
      },
      "Estadística Computacional": { 
        semestre: 6, 
        abre: [],
        area: "matematicas",
        sigla: "ICI3170"
      },
      "Administración de Empresas": { 
        semestre: 6, 
        abre: ["Economía y Finanzas"],
        area: "ingenieria",
        sigla: "ICA4121"
      },
      "Modelamiento de Software": { 
        semestre: 6, 
        abre: ["Ingeniería de Software", "Ingeniería Web y Móvil"],
        area: "ingenieria",
        sigla: "ICI3246"
      },
      "Redes de Computadores": { 
        semestre: 6, 
        abre: ["Robótica y Sistemas Autónomos", "Computación Paralela y Distribuida", "Ciberseguridad"],
        area: "ingenieria",
        sigla: "ICI3343"
      },
      "Inglés 3": { 
        semestre: 6, 
        abre: ["Inglés 4"],
        area: "humanidades",
        sigla: "ING9003"
      },
      "Robótica y Sistemas Autónomos": { 
        semestre: 7, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI4150"
      },
      "Optimización": { 
        semestre: 7, 
        abre: [],
        area: "matematicas",
        sigla: "ICI4151"
      },
      "Ingeniería de Software": { 
        semestre: 7, 
        abre: ["Taller Ingeniería de Software"],
        area: "ingenieria",
        sigla: "ICI4244"
      },
      "Ingeniería Web y Móvil": { 
        semestre: 7, 
        abre: ["Ingeniería de Requerimientos"],
        area: "ingenieria",
        sigla: "ICI4247"
      },
      "Computación Paralela y Distribuida": { 
        semestre: 7, 
        abre: [],
        area: "programacion",
        sigla: "ICI4344"
      },
      "Inglés 4": { 
        semestre: 7, 
        abre: [],
        area: "humanidades",
        sigla: "ING9004"
      },
      "Economía y Finanzas": { 
        semestre: 8, 
        abre: [],
        area: "ingenieria",
        sigla: "ICA4161"
      },
      "Ingeniería de Requerimientos": { 
        semestre: 8, 
        abre: ["Experiencia del Usuario"],
        area: "ingenieria",
        sigla: "ICI4248"
      },
      "Taller de Base de Datos": { 
        semestre: 8, 
        abre: [],
        area: "programacion",
        sigla: "ICI4541"
      },
      "Ciberseguridad": { 
        semestre: 8, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI4370"
      },
      "Formación Fundamental 3": { 
        semestre: 8, 
        abre: [],
        area: "fofu",
        sigla: "FFUND3"
      },
      "Optativo I": { 
        semestre: 8, 
        abre: [],
        area: "optativos",
        sigla: "OPT1000"
      },
      "Administración de proyectos informáticos": { 
        semestre: 9, 
        abre: ["Taller de Formulación de Proyectos Informáticos"],
        area: "ingenieria",
        sigla: "ICI5441"
      },
      "Taller Ingeniería de Software": { 
        semestre: 9, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI5545"
      },
      "Tecnologías Emergentes": { 
        semestre: 9, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI5442"
      },
      "Experiencia del Usuario": { 
        semestre: 9, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI5247"
      },
      "Negocios, innovación y emprendimiento": { 
        semestre: 9, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI5475"
      },
      "Optativo II": { 
        semestre: 9, 
        abre: [],
        area: "optativos",
        sigla: "OPT2000"
      },
      "Taller de Formulación de Proyectos Informáticos": { 
        semestre: 10, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI5444"
      },
      "Seminario de Título": { 
        semestre: 10, 
        abre: ["Proyecto de Título"],
        area: "ingenieria",
        sigla: "ICI5541"
      },
      "Legislación, Ética y Tecnológica": { 
        semestre: 10, 
        abre: [],
        area: "humanidades",
        sigla: "ICI5345"
      },
      "Taller de Liderazgo y Trabajo en Equipo": { 
        semestre: 10, 
        abre: [],
        area: "humanidades",
        sigla: "ICI5476"
      },
      "Optativo III": { 
        semestre: 10, 
        abre: [],
        area: "optativos",
        sigla: "OPT3000"
      },
      "Proyecto de Título": { 
        semestre: 11, 
        abre: [],
        area: "ingenieria",
        sigla: "ICI6541"
      },
      "Optativo IV": { 
        semestre: 11, 
        abre: [],
        area: "optativos",
        sigla: "OPT4000"
      }
    };

    let aprobados = JSON.parse(localStorage.getItem('ramos_aprobados') || '[]');
    const malla = document.getElementById('malla');
    const estadoAnterior = new Map();
    let areaSeleccionada = "all";
    let busqueda = "";
    let mostrarSoloDisponibles = false;

    const porSemestre = {};
    for (const [nombre, info] of Object.entries(ramos)) {
      if (!porSemestre[info.semestre]) porSemestre[info.semestre] = [];
      porSemestre[info.semestre].push(nombre);
    }

    const calcularCreditos = () => {
      let total = 0;
      let completados = 0;
      
      for (const [nombre] of Object.entries(ramos)) {
        total += creditosRamos[nombre] || 5;
        if (aprobados.includes(nombre)) {
          completados += creditosRamos[nombre] || 5;
        }
      }
      
      const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
      
      return { 
        total, 
        completados,
        porcentaje
      };
    };

    const render = () => {
      malla.innerHTML = "";
      const totalRamos = Object.keys(ramos).length;
      
      const { 
        total: creditosTotal, 
        completados: creditosAprobados,
        porcentaje: porcentajeCreditos
      } = calcularCreditos();
      
      document.getElementById('total-ramos').textContent = `Total ramos: ${totalRamos}`;
      document.getElementById('aprobados-ramos').textContent = `Aprobados: ${aprobados.length}`;
      document.getElementById('creditos-total').textContent = `Créditos: ${creditosAprobados}/${creditosTotal}`;
      document.getElementById('porcentaje').textContent = `Progreso: ${porcentajeCreditos}%`;

      let semestresRenderizados = 0;
      const nuevoEstado = new Map();
      
     for (let sem = 1; sem <= 11; sem++) {
        const ramosSemestre = (porSemestre[sem] || []).filter(ramo => {
          if (areaSeleccionada !== "all" && areaSeleccionada !== "none") {
            // Filtro especial para FOFUs
            if (areaSeleccionada === "fofu") {
              if (!ramo.includes("Formación Fundamental") && 
                  !ramo.includes("Antropología Cristiana") && 
                  !ramo.includes("Ética Cristiana")) {
                return false;
              }
            } 
            // Filtro normal para otras áreas
            else if (ramos[ramo].area !== areaSeleccionada) {
              return false;
            }
          }
          
          if (busqueda) {
            const busquedaNormalizada = normalizarTexto(busqueda);
            const nombreNormalizado = normalizarTexto(ramo);
            const siglaNormalizada = normalizarTexto(ramos[ramo].sigla || '');
            
            // Buscar tanto en nombre como en sigla
            if (!nombreNormalizado.includes(busquedaNormalizada) && 
                !siglaNormalizada.includes(busquedaNormalizada)) {
              return false;
            }
          }
          
          if (mostrarSoloDisponibles) {
            const prer = Object.entries(ramos)
              .filter(([_, info]) => info.abre.includes(ramo))
              .map(([nombre]) => nombre);

            const desbloqueado = prer.every(nombre => aprobados.includes(nombre));
            
            if (!aprobados.includes(ramo) && !(sem === 1 || desbloqueado)) {
              return false;
            }
          }
          
          return true;
        });
        
        if (ramosSemestre.length === 0) continue;
        
        const cont = document.createElement('div');
        cont.className = 'semestre';
        const title = document.createElement('h3');
        title.textContent = `${sem}° Semestre`;
        cont.appendChild(title);

        ramosSemestre.forEach(ramo => {
          const div = document.createElement('div');
          div.className = 'ramo';
          div.setAttribute('data-area', ramos[ramo].area);
          div.setAttribute('data-creditos', creditosRamos[ramo] || 5);
          
          const contenido = document.createElement('div');
          
          const nombre = document.createElement('div');
          nombre.className = 'ramo-nombre';
          nombre.textContent = ramo;
          contenido.appendChild(nombre);
          
          const detalles = document.createElement('div');
          detalles.className = 'ramo-detalles';
          
          const sigla = document.createElement('span');
          sigla.className = 'ramo-sigla';
          sigla.textContent = ramos[ramo].sigla || 'SIGLA';
          
          const creditos = document.createElement('span');
          creditos.className = 'ramo-creditos';
          creditos.textContent = `${creditosRamos[ramo] || 5} créditos`;
          
          detalles.appendChild(sigla);
          detalles.appendChild(creditos);
          contenido.appendChild(detalles);
          
          div.appendChild(contenido);

          const prer = Object.entries(ramos)
            .filter(([_, info]) => info.abre.includes(ramo))
            .map(([nombre]) => nombre);

          const desbloqueado = prer.every(nombre => aprobados.includes(nombre));
          const estadoKey = `${sem}:${ramo}`;
          nuevoEstado.set(estadoKey, desbloqueado);

          if (aprobados.includes(ramo)) {
            div.classList.add('aprobado');
            div.setAttribute('data-tooltip', `🟢 Aprobado (${creditosRamos[ramo] || 5} créditos)\nClic para desmarcar ❌`);
            div.onclick = () => aprobar(ramo);
          } else if (estaDisponible(ramo)) {
            div.classList.add('disponible');
            if (!estadoAnterior.get(estadoKey)) {
              div.classList.add('desbloqueado');
              void div.offsetWidth;
            }
            div.setAttribute('data-tooltip', `🟡 Disponible (${creditosRamos[ramo] || 5} créditos)\nClic para aprobar ✅`);
            div.onclick = () => aprobar(ramo);
          } else {
            div.classList.add('bloqueado');
            const faltantes = prer.filter(nombre => !aprobados.includes(nombre));
            div.setAttribute('data-tooltip', `🔒 Bloqueado (${creditosRamos[ramo] || 5} créditos)\nRequiere: ${faltantes.join(', ') || 'Ninguno'}`);
          }

          cont.appendChild(div);
        });

        malla.appendChild(cont);
        semestresRenderizados++;
      }
      
      if (semestresRenderizados === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No se encontraron ramos que coincidan con la búsqueda';
        malla.appendChild(noResults);
      }

      const barra = document.getElementById('barraProgreso');
      const textoBarra = document.getElementById('textoProgreso');
      barra.style.width = porcentajeCreditos + "%";
      textoBarra.textContent = porcentajeCreditos + "%";

      estadoAnterior.clear();
      nuevoEstado.forEach((v, k) => estadoAnterior.set(k, v));
    };

   // Función para obtener todos los ramos que dependen directa o indirectamente de un ramo
const obtenerTodosDependientes = (ramoBase) => {
  let dependientes = new Set();

  // Recursivamente buscar ramos donde ramoBase es prerrequisito
  const buscar = (rama) => {
    for (const [nombre, info] of Object.entries(ramos)) {
      const prerrequisitos = Object.entries(ramos)
        .filter(([_, data]) => (data.abre || []).includes(nombre))
        .map(([key]) => key);

      if (prerrequisitos.includes(rama) && !dependientes.has(nombre)) {
        dependientes.add(nombre);
        buscar(nombre);
      }
    }
  };

  buscar(ramoBase);
  return Array.from(dependientes);
};

// Función para verificar si un ramo está disponible (todos sus prerrequisitos aprobados)
const estaDisponible = (ramo) => {
  if (ramos[ramo].semestre === 1) return true;

  if (ramo === "Seminario de Título") {
    const requisitos = [
      "Economía y Finanzas",             // ICA4161
      "Ingeniería de Requerimientos",    // ICI4248
      "Taller de Base de Datos",         // ICI4541
      "Ciberseguridad",                  // ICI4370
      "Administración de proyectos informáticos", // ICI5441
      "Taller Ingeniería de Software",   // ICI5545
      "Tecnologías Emergentes",          // ICI5442
      "Experiencia del Usuario",         // ICI5247
      "Negocios, innovación y emprendimiento", // ICI5475
      "Optimización",                    // ICI4151
      "Estadística Computacional",       // ICI3170
      "Hardware y Sistemas Operativos",  // ICI3344
      "Inteligencia Artificial"          // ICI3244
    ];
    return requisitos.every(req => aprobados.includes(req));
  }

  const prerrequisitos = Object.entries(ramos)
    .filter(([_, info]) => info.abre.includes(ramo))
    .map(([nombre]) => nombre);

  return prerrequisitos.every(prerreq => aprobados.includes(prerreq));
};

const aprobar = (ramo) => {
  const estabaAprobado = aprobados.includes(ramo);

  if (estabaAprobado) {
    const dependientes = obtenerTodosDependientes(ramo);
    const aEliminar = [ramo, ...dependientes];

    const ramosDOM = document.querySelectorAll('.ramo');
    ramosDOM.forEach(el => {
      const nombre = el.querySelector('.ramo-nombre')?.textContent;
      if (nombre && aEliminar.includes(nombre)) {
        el.classList.add('retirado');
      }
    });

    aprobados = aprobados.filter(r => !aEliminar.includes(r));
    localStorage.setItem('ramos_aprobados', JSON.stringify(aprobados));
    render();
  } else {
    if (estaDisponible(ramo)) {
      aprobados = [...aprobados, ramo];
      localStorage.setItem('ramos_aprobados', JSON.stringify(aprobados));
      render();
    } else {
      alert('No puedes aprobar este ramo hasta completar sus prerrequisitos');
    }
  }
};



    const resetear = () => {
      if (confirm("¿Estás seguro de reiniciar todo el progreso?")) {
        localStorage.removeItem('ramos_aprobados');
        aprobados = [];
        render();
      }
    };

    // Modificar el event listener para permitir deseleccionar
    document.querySelectorAll('.area-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active') && btn.dataset.area === areaSeleccionada) {
          // Si ya está activo y es el mismo, deseleccionar
          btn.classList.remove('active');
          areaSeleccionada = "none";
        } else {
          // Seleccionar nuevo filtro
          document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          areaSeleccionada = btn.dataset.area;
        }
        render();
      });
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
      busqueda = e.target.value;
      render();
    });

    document.getElementById('toggle-disponibles').addEventListener('click', () => {
      mostrarSoloDisponibles = !mostrarSoloDisponibles;
      const boton = document.getElementById('toggle-disponibles');
      
      if (mostrarSoloDisponibles) {
        boton.classList.add('active');
        boton.innerHTML = '<ion-icon name="eye-off-outline"></ion-icon> Mostrar Todos';
      } else {
        boton.classList.remove('active');
        boton.innerHTML = '<ion-icon name="eye-outline"></ion-icon> Solo Disponibles';
      }
      
      render();
    });

    render();