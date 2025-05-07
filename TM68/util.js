
function ordenarDataset(dataset, columna, orden='asc',tipo='string') {

  // Validación básica del input.  Evita errores si dataset es null o undefined.
  if (!Array.isArray(dataset)) {
    console.error("Error: El dataset debe ser un array.");
    return []; // Retorna un array vacío en caso de error.  Alternativamente, puedes lanzar una excepción.
  }

  if (typeof columna !== 'string' || columna.trim() === '') {
    console.error("Error: La columna debe ser un string no vacío.");
    return [...dataset]; // Retorna una copia sin ordenar si la columna no es válida.
  }

  orden = orden.toLowerCase(); // Normaliza el orden a minúsculas para comparación.
  if (orden !== 'asc' && orden !== 'desc') {
    console.warn("Advertencia: Orden inválido.  Usando orden ascendente por defecto.");
    orden = 'asc'; // Orden por defecto si el input es incorrecto.
  }


  // Crea una copia del dataset para no modificar el original.  IMPORTANTE.
let datasetCopia = [...dataset];

  // Función de comparación genérica.  Maneja diferentes tipos de datos.
  datasetCopia.sort((a, b) => {
    let valorA = a[columna];
    let valorB = b[columna];
    if (tipo === 'number') {
      if (typeof valorA === 'string') {
        valorA = Number(valorA);
      }
      if (typeof valorB === 'string') {
        valorB = Number(valorB);
      }
    }


    if (valorA === undefined || valorA === null) return -1; // Mueve nulos/undefined al principio
    if (valorB === undefined || valorB === null) return 1;  // Mueve nulos/undefined al principio

    if (typeof valorA === 'string' && typeof valorB === 'string') {
      // Comparación de strings (case-insensitive)

      const comparacion = valorA.localeCompare(valorB, undefined, { sensitivity: 'base' }); // Case-insensitive
      return orden === 'asc' ? comparacion : -comparacion;
    } else if (typeof valorA === 'number' && typeof valorB === 'number') {

      // Comparación de números
      return orden === 'asc' ? valorA - valorB : valorB - valorA;
    } else if (valorA instanceof Date && valorB instanceof Date) {
      // Comparación de fechas
      return orden === 'asc' ? valorA.getTime() - valorB.getTime() : valorB.getTime() - valorA.getTime();
    } else {
      // Comparación genérica (puede no ser ideal para todos los casos)
      if (valorA < valorB) return orden === 'asc' ? -1 : 1;
      if (valorA > valorB) return orden === 'asc' ? 1 : -1;
      return 0;
    }
  });

  return datasetCopia;
}


