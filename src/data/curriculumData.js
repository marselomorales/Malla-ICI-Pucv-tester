// Módulo de datos de la malla
const CurriculumData = {
  cursosRaw: [
    // Semestre 1
    {sem:1, sigla:"MAT1001", nombre:"Fundamentos de Matemáticas para Ingeniería", creditos:6, area:"matematicas", prereqs:[]},
    {sem:1, sigla:"ICI1243", nombre:"Introducción a la Ingeniería Informática", creditos:4, area:"ingenieria", prereqs:[]},
    {sem:1, sigla:"ICI1241", nombre:"Fundamentos de Algoritmos", creditos:4, area:"programacion", prereqs:[]},
    {sem:1, sigla:"ICI1458", nombre:"Bienestar y Aprendizaje Universitario", creditos:2, area:"humanidades", prereqs:[]},
    
    // Semestre 2
    {sem:2, sigla:"MAT1002", nombre:"Cálculo Diferencial e Integral", creditos:6, area:"matematicas", prereqs:["MAT1001"]},
    {sem:2, sigla:"MAT1004", nombre:"Álgebra Lineal", creditos:4, area:"matematicas", prereqs:["MAT1001"]},
    {sem:2, sigla:"ICI1242", nombre:"Fundamentos de Programación", creditos:4, area:"programacion", prereqs:["ICI1241"]},
    {sem:2, sigla:"FIN100-14", nombre:"Desarrollo Integral y Comunicación para Ingeniería", creditos:3, area:"humanidades", prereqs:[]},
    {sem:2, sigla:"FF1", nombre:"Formación Fundamental", creditos:2, area:"fofus", prereqs:[]},
    
    // Semestre 3
    {sem:3, sigla:"FIS1002", nombre:"Física para Ingeniería", creditos:5, area:"fisica", prereqs:["MAT1001"]},
    {sem:3, sigla:"MAT1003", nombre:"Cálculo en Varias Variables", creditos:4, area:"matematicas", prereqs:["MAT1002"]},
    {sem:3, sigla:"ICI2145", nombre:"Análisis Inteligente de Datos", creditos:4, area:"programacion", prereqs:["MAT1002"]},
    {sem:3, sigla:"ICI2240", nombre:"Estructura de Datos", creditos:4, area:"programacion", prereqs:["ICI1242"]},
    {sem:3, sigla:"ICR010", nombre:"Antropología Cristiana", creditos:2, area:"fofus", prereqs:[]},
    {sem:3, sigla:"FF2", nombre:"Formación Fundamental 2", creditos:2, area:"fofus", prereqs:[]},
    
    // Semestre 4
    {sem:4, sigla:"FIS2120", nombre:"Física Electromagnetismo", creditos:3, area:"fisica", prereqs:["FIS1002"]},
    {sem:4, sigla:"ICI2141", nombre:"Métodos Numéricos", creditos:3, area:"matematicas", prereqs:["ICI1242"]},
    {sem:4, sigla:"ICI2242", nombre:"Análisis y Diseño de Algoritmos", creditos:4, area:"programacion", prereqs:[]},
    {sem:4, sigla:"ICI2241", nombre:"Programación Avanzada", creditos:4, area:"programacion", prereqs:["ICI2240"]},
    {sem:4, sigla:"ICR020", nombre:"Ética Cristiana", creditos:2, area:"fofus", prereqs:[]},
    {sem:4, sigla:"ING9001", nombre:"Inglés 1", creditos:2, area:"humanidades", prereqs:[]},
    
    // Semestre 5
    {sem:5, sigla:"FIS3149", nombre:"Física Moderna", creditos:3, area:"fisica", prereqs:["FIS2120"]},
    {sem:5, sigla:"ICI3245", nombre:"Autómatas y Compiladores", creditos:3, area:"programacion", prereqs:["ICI2241"]},
    {sem:5, sigla:"ICI3240", nombre:"Base de Datos", creditos:4, area:"programacion", prereqs:["ICI1242"]},
    {sem:5, sigla:"ICI3244", nombre:"Inteligencia Artificial", creditos:4, area:"programacion", prereqs:["ICI2242"]},
    {sem:5, sigla:"ICI3344", nombre:"Hardware y Sistemas Operativos", creditos:4, area:"ingenieria", prereqs:["ICI1242"]},
    {sem:5, sigla:"ING9002", nombre:"Inglés 2", creditos:2, area:"humanidades", prereqs:["ING9001"]},
    
    // Semestre 6
    {sem:6, sigla:"ICI3150", nombre:"Ciencia y Tecnología", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:6, sigla:"ICI3170", nombre:"Estadística Computacional", creditos:4, area:"matematicas", prereqs:["MAT1003"]},
    {sem:6, sigla:"ICA4121", nombre:"Administración de Empresas", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:6, sigla:"ICI3246", nombre:"Modelamiento de Software", creditos:4, area:"programacion", prereqs:["ICI3240"]},
    {sem:6, sigla:"ICI3343", nombre:"Redes de Computadores", creditos:4, area:"ingenieria", prereqs:["ICI3245"]},
    {sem:6, sigla:"ING9003", nombre:"Inglés 3", creditos:2, area:"humanidades", prereqs:["ING9002"]},
    
    // Semestre 7
    {sem:7, sigla:"ICI4150", nombre:"Robótica y Sistemas Autónomos", creditos:3, area:"ingenieria", prereqs:["ICI3343"]},
    {sem:7, sigla:"ICI4151", nombre:"Optimización", creditos:4, area:"matematicas", prereqs:[]},
    {sem:7, sigla:"ICI4244", nombre:"Ingeniería de Software", creditos:4, area:"ingenieria", prereqs:["ICI3246"]},
    {sem:7, sigla:"ICI4247", nombre:"Ingeniería Web y Móvil", creditos:4, area:"programacion", prereqs:["ICI3246"]},
    {sem:7, sigla:"ICI4344", nombre:"Computación Paralela y Distribuida", creditos:4, area:"ingenieria", prereqs:["ICI3343"]},
    {sem:7, sigla:"ING9004", nombre:"Inglés 4", creditos:2, area:"humanidades", prereqs:["ING9003"]},
    
    // Semestre 8
    {sem:8, sigla:"ICA4161", nombre:"Economía y Finanzas", creditos:3, area:"ingenieria", prereqs:["ICA4121"]},
    {sem:8, sigla:"ICI4248", nombre:"Ingeniería de Requerimientos", creditos:4, area:"programacion", prereqs:["ICI4247"]},
    {sem:8, sigla:"ICI4541", nombre:"Taller de Base de Datos", creditos:4, area:"programacion", prereqs:["ICI3240"]},
    {sem:8, sigla:"ICI4370", nombre:"Ciberseguridad", creditos:4, area:"ingenieria", prereqs:["ICI3343"]},
    {sem:8, sigla:"FF3", nombre:"Formación Fundamental 3", creditos:2, area:"fofus", prereqs:[]},
    {sem:8, sigla:"OPT1", nombre:"Optativo I", creditos:4, area:"optativos", prereqs:[]},
    
    // Semestre 9
    {sem:9, sigla:"ICI5441", nombre:"Administración de proyectos informáticos", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:9, sigla:"ICI5545", nombre:"Taller Ingeniería de Software", creditos:4, area:"ingenieria", prereqs:["ICI4244"]},
    {sem:9, sigla:"ICI5442", nombre:"Tecnologías Emergentes", creditos:4, area:"ingenieria", prereqs:[]},
    {sem:9, sigla:"ICI5247", nombre:"Experiencia del Usuario", creditos:3, area:"ingenieria", prereqs:["ICI4248"]},
    {sem:9, sigla:"ICI5475", nombre:"Negocios, innovación y emprendimiento", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:9, sigla:"OPT2", nombre:"Optativo II", creditos:4, area:"optativos", prereqs:[]},
    
    // Semestre 10
    {sem:10, sigla:"ICI5444", nombre:"Taller de Formulación de Proyectos Informáticos", creditos:4, area:"ingenieria", prereqs:["ICI5441"]},
    {sem:10, sigla:"ICI5541", nombre:"Seminario de Título", creditos:5, area:"ingenieria", prereqs:["ICA4161", "ICI4248", "ICI4541", "ICI4370", "ICI5441", "ICI5545", "ICI5442", "ICI5247", "ICI5475", "ICI4151", "ICI3170", "ICI3344", "ICI3244"]},
    {sem:10, sigla:"ICI5345", nombre:"Legislación, Ética y Tecnológica", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:10, sigla:"ICI5476", nombre:"Taller de Liderazgo y Trabajo en Equipo", creditos:3, area:"ingenieria", prereqs:[]},
    {sem:10, sigla:"OPT3", nombre:"Optativo III", creditos:4, area:"optativos", prereqs:[]},
    
    // Semestre 11
    {sem:11, sigla:"ICI6541", nombre:"Proyecto de Título", creditos:12, area:"ingenieria", prereqs:["ICI5541"]},
    {sem:11, sigla:"OPT4", nombre:"Optativo IV", creditos:4, area:"optativos", prereqs:[]}
  ],
  
  // Estructuras de datos procesadas
  siglaToNombre: new Map(),
  ramos: {},
  creditosRamos: {},
  prereqsPorNombre: {},
  porSemestre: {},
  maxSemestre: 0,
  
  init() {
    this.processData();
  },
  
  processData() {
    // Mapeo de siglas a nombres
    this.siglaToNombre = new Map(this.cursosRaw.map(c => [c.sigla, c.nombre]));
    
    // Inicializar estructuras
    this.ramos = {};
    this.creditosRamos = {};
    this.prereqsPorNombre = {};
    this.porSemestre = {};
    
    // Procesar cada curso
    for (const c of this.cursosRaw) {
      this.ramos[c.nombre] = { 
        semestre: c.sem, 
        area: c.area, 
        sigla: c.sigla, 
        abre: [] 
      };
      this.creditosRamos[c.nombre] = c.creditos ?? 0;
      this.prereqsPorNombre[c.nombre] = (c.prereqs || [])
        .map(sig => this.siglaToNombre.get(sig))
        .filter(Boolean);
    }
    
    // Procesar dependencias inversas (qué cursos abre cada curso)
    for (const [nombre, lista] of Object.entries(this.prereqsPorNombre)) {
      for (const p of lista) {
        if (this.ramos[p]) {
          this.ramos[p].abre.push(nombre);
        }
      }
    }
    
    // Organizar por semestre
    for (const [nombre, info] of Object.entries(this.ramos)) {
      if (!this.porSemestre[info.semestre]) {
        this.porSemestre[info.semestre] = [];
      }
      this.porSemestre[info.semestre].push(nombre);
    }
    
    // Encontrar el semestre máximo
    this.maxSemestre = Math.max(...Object.values(this.ramos).map(r => r.semestre));
  }
};

export { CurriculumData };
