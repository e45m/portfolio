// Configuración inicial
const WEBREPO = 'www.datos.gov.co';
const DATASETNAME = 'p6dx-8zbt';
const MODALIDAD = 'Licitación pública Obra Publica';
const PRECIO_BASE = 500000000;
const FASE_LIKE = "%Presentación%";
const ESTADO_LIKE = "Publicado";
const LIMIT = 50;

let datosGlobales = [];
let presupuestosEntidadChart, presupuestosTiempoChart, procesosUnspscChart;

async function cargarDatos() {
    const unspscCodesInput = document.getElementById('unspscCodes').value;
    const UNSPSC = unspscCodesInput.split(',').map(code => code.trim());

    const listaUNSPSC = ' AND (' + UNSPSC.map(code => `codigo_principal_de_categoria LIKE "V1.${code}%"`).join(' OR ') + ')';

    const sqlSelect = `
        SELECT * WHERE (modalidad_de_contratacion = "${MODALIDAD}")
        ${listaUNSPSC}
        AND (fase LIKE "${FASE_LIKE}")
        AND (estado_del_procedimiento LIKE "${ESTADO_LIKE}")
        ORDER BY precio_base DESC
        LIMIT ${LIMIT}
    `;

    const API_ENDPOINT = `https://${WEBREPO}/resource/${DATASETNAME}.json?$query=${encodeURIComponent(sqlSelect)}`;

    const tabla = document.getElementById('tablaResultados').getElementsByTagName('tbody')[0];
    tabla.innerHTML = "";

    try {
        const response = await fetch(API_ENDPOINT);
        const data = await response.json();

        datosGlobales = data;

        filtrarTabla();
        document.getElementById('graficosContainer').style.display = 'flex'; // Mostrar gráficos
        document.getElementById('tarjetaPromedio').style.display = 'block'; // Mostrar la tarjeta
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        tabla.innerHTML = "<tr><td colspan='13'>Error al cargar los datos.</td></tr>";
    }
}

function filtrarTabla() {
    const tabla = document.getElementById("tablaResultados").getElementsByTagName('tbody')[0];
    tabla.innerHTML = "";

    let filtroEntidad = document.getElementById("filtroEntidad").value.toUpperCase();
    let filtroObjeto = document.getElementById("filtroObjeto").value.toUpperCase();
    let precioMin = parseFloat(document.getElementById('precioMin').value) || 0;
    let precioMax = parseFloat(document.getElementById('precioMax').value) || Infinity;

    let filteredData = datosGlobales.filter(item => {
        let cumpleEntidad = item.entidad ? item.entidad.toUpperCase().includes(filtroEntidad) : true;
        let cumpleObjeto = item.descripci_n_del_procedimiento ? item.descripci_n_del_procedimiento.toUpperCase().includes(filtroObjeto) : true;
        let precio = parseFloat(item.precio_base) || 0;
        let cumplePrecio = precio >= precioMin && precio <= precioMax;

        return cumpleEntidad && cumpleObjeto && cumplePrecio;
    });

    // Actualizar gráficos con los datos filtrados
    actualizarGraficos(filteredData);

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function formatPrice(price) {
        if (!price) return '';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    }

    filteredData.forEach(item => {
        let row = tabla.insertRow();
        let idProceso = row.insertCell(0);
        let entidad = row.insertCell(1);
        let numero = row.insertCell(2);
        let objeto = row.insertCell(3);
        let fase = row.insertCell(4);
        let publicado = row.insertCell(5);
        let presupuesto = row.insertCell(6);
        let modalidad = row.insertCell(7);
        let plazo = row.insertCell(8);
        let mesesDias = row.insertCell(9);
        let lotes = row.insertCell(10);
        let estado = row.insertCell(11);
        let link = row.insertCell(12);

        idProceso.innerHTML = item.id_del_proceso || '';
        entidad.innerHTML = item.entidad || '';
        numero.innerHTML = item.referencia_del_procedimiento || '';
        objeto.innerHTML = item.descripci_n_del_procedimiento || '';
        fase.innerHTML = item.fase || '';
        publicado.innerHTML = formatDate(item.fecha_de_publicacion_del) || '';
        presupuesto.innerHTML = formatPrice(item.precio_base) || '';
        modalidad.innerHTML = item.modalidad_de_contratacion || '';
        plazo.innerHTML = item.duracion || '';
        mesesDias.innerHTML = item.unidad_de_duracion || '';
        lotes.innerHTML = item.numero_de_lotes || '';
        estado.innerHTML = item.estado_del_procedimiento || '';

        if (item.urlproceso && item.urlproceso.url) {
            try {
                const urlString = item.urlproceso.url;
                link.innerHTML = `<a href="${urlString}" target="_blank">Ver Proceso</a>`;
            } catch (e) {
                console.error("Error al crear el enlace:", e);
                link.innerHTML = "Enlace no disponible";
            }
        } else {
            link.innerHTML = '';
        }
    });
}

document.getElementById('precioMin').onkeyup = filtrarTabla;
document.getElementById('precioMax').onkeyup = filtrarTabla;

function actualizarGraficos(data) {
    // Función para destruir los gráficos existentes
    function destroyChart(chart) {
        if (chart) {
            chart.destroy();
        }
    }

    // 1. Suma de Presupuestos por Entidad (Gráfico de Barras)
    const presupuestosPorEntidad = {};
    data.forEach(item => {
        const entidad = item.entidad || 'Desconocido';
        const presupuesto = parseFloat(item.precio_base) || 0;
        presupuestosPorEntidad[entidad] = (presupuestosPorEntidad[entidad] || 0) + presupuesto;
    });

    // Obtener el top 10 de entidades
    const topEntidades = Object.entries(presupuestosPorEntidad)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});

    const entidades = Object.keys(topEntidades);
    const presupuestos = Object.values(topEntidades);

    // Destruir la instancia anterior del gráfico
    destroyChart(presupuestosEntidadChart);

    presupuestosEntidadChart = new Chart(document.getElementById('presupuestosEntidadChart'), {
        type: 'bar',
        data: {
            labels: entidades,
            datasets: [{
                label: 'Suma de Presupuestos',
                data: presupuestos,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    ticks: {
                        autoSkip: true,
                        maxRotation: 50,
                        minRotation: 50,
                        maxTicksLimit: 10
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            }
        }
    });

    // 2. Presupuestos a lo Largo del Tiempo (Gráfico de Líneas)
    const presupuestosPorTiempo = {};
    const datosConFecha = data.filter(item => item.fecha_de_publicacion_del); // Filtrar los datos sin fecha

    // Obtener la fecha de hace 12 meses
    const fechaHace12Meses = new Date();
    fechaHace12Meses.setMonth(fechaHace12Meses.getMonth() - 12);

    // Filtrar los datos para los últimos 12 meses
    const datosUltimos12Meses = datosConFecha.filter(item => {
        const fechaPublicacion = new Date(item.fecha_de_publicacion_del);
        return fechaPublicacion >= fechaHace12Meses;
    });

    datosUltimos12Meses.forEach(item => {
        const fecha = item.fecha_de_publicacion_del.substring(0, 7); // Año-Mes
        const presupuesto = parseFloat(item.precio_base) || 0;
        presupuestosPorTiempo[fecha] = (presupuestosPorTiempo[fecha] || 0) + presupuesto;
    });

    const tiempos = Object.keys(presupuestosPorTiempo).sort();
    const presupuestosTiempo = Object.values(presupuestosPorTiempo);

    // Destruir la instancia anterior del gráfico
    destroyChart(presupuestosTiempoChart);

    presupuestosTiempoChart = new Chart(document.getElementById('presupuestosTiempoChart'), {
        type: 'line',
        data: {
            labels: tiempos,
            datasets: [{
                label: 'Suma de Presupuestos',
                data: presupuestosTiempo,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            }
        }
    });

    // 3. Promedio de Presupuesto vs. Plazo (Tarjeta)
    let totalPresupuesto = 0;
    let totalPlazo = 0;
    data.forEach(item => {
        totalPresupuesto += parseFloat(item.precio_base) || 0;
        totalPlazo += parseFloat(item.duracion) || 0;
    });

    const promedioPresupuesto = data.length > 0 ? totalPresupuesto / data.length : 0;
    const promedioPlazo = data.length > 0 ? totalPlazo / data.length : 0;

    document.getElementById('promedioPresupuestoPlazo').textContent = `Promedio Presupuesto: ${promedioPresupuesto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} - Promedio Plazo: ${promedioPlazo.toFixed(2)} días`;

    // 4. Número de Procesos por Tipo de Trabajo (UNSPSC) (Gráfico de Pastel)
    const procesosPorUnspsc = {};
    data.forEach(item => {
        const unspsc = item.codigo_principal_de_categoria || 'Desconocido';
        procesosPorUnspsc[unspsc] = (procesosPorUnspsc[unspsc] || 0) + 1;
    });

    // Obtener el top 10 de UNSPSC
    const topUnspscs = Object.entries(procesosPorUnspsc)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});

    const unspscs = Object.keys(topUnspscs);
    const conteosUnspsc = Object.values(topUnspscs);

    // Destruir la instancia anterior del gráfico
    destroyChart(procesosUnspscChart);

    procesosUnspscChart = new Chart(document.getElementById('procesosUnspscChart'), {
        type: 'pie',
        data: {
            labels: unspscs,
            datasets: [{
                label: 'Número de Procesos',
                data: conteosUnspsc,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            }
        }
    });
}

function init() {
  cargarDatos();
}

document.getElementById('precioMin').onkeyup = filtrarTabla;
document.getElementById('precioMax').onkeyup = filtrarTabla;


window.onload = init;




