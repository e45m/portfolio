// Configuración inicial
const WEBREPO = 'www.datos.gov.co';
const DATASETNAME = 'p6dx-8zbt';
const MODALIDAD = 'Licitación pública Obra Publica';
const PRECIO_BASE = 500000000; ///500.000.000
const FASE_LIKE = "Presentación";
const ESTADO_LIKE = "Publicado";
const LIMIT = 50000;
const IDPROCMIN = 6000000;

let datosGlobales = [];
let presupuestosEntidadChart, presupuestosTiempoChart, procesosUnspscChart;

async function cargarDatos() {





    const unspscCodesInput = document.getElementById('unspscCodes').value || '1,2,3,4,5,6,7,8,9' ;
    const precio_baseInput = document.getElementById('precioMin').value || PRECIO_BASE ;
    const modalidadInput = obtenerValoresSelect("modalidad") || MODALIDAD ;
    const faseInput = obtenerValoresSelect("fase") || FASE_LIKE ;

    // console.log(modalidadInput);
    // console.log(faseInput);


    const UNSPSC = unspscCodesInput.split(',').map(code => code.trim());
    const MOD = modalidadInput.split(',').map(code => code.trim());
    const FASE = faseInput.split(',').map(code => code.trim());

    // const selectOrdenarpor = document.getElementById('ordenar_por');
    // const resOrdenpor = document.getElementById('opt_ordenar_por');
    const ordenPor = document.getElementById('opt_ordenar_por').value;

    const listaMOD =  MOD.map(code => `modalidad_de_contratacion LIKE "${code}"`).join(' OR ') ;
    const listaUNSPSC = ' AND (' + UNSPSC.map(code => `codigo_principal_de_categoria LIKE "V1.${code}%"`).join(' OR ') + ')';
    const listaFASE = ' AND (' + FASE.map(code => `fase LIKE "${code}"`).join(' OR ') + ')';

    const sqlSelect = `
        SELECT * WHERE (${listaMOD})
        ${listaUNSPSC}
        ${listaFASE}
        AND (estado_del_procedimiento LIKE "${ESTADO_LIKE}")
        AND (precio_base>=${precio_baseInput})
        AND (estado_de_apertura_del_proceso = "Abierto")
        ORDER BY (LEFT_PAD(SUBSTRING(id_del_proceso, 9),7,'0'))  DESC
        LIMIT ${LIMIT}

    `;

    console.log(sqlSelect);
//https://dev.socrata.com/docs/functions/#2.1,

    // 611117
    // 6013375


    const API_ENDPOINT = `https://${WEBREPO}/resource/${DATASETNAME}.json?$query=${encodeURIComponent(sqlSelect)}`;

    const tabla = document.getElementById('tablaResultados').getElementsByTagName('tbody')[0];
    tabla.innerHTML = "";

    try {
        const response = await fetch(API_ENDPOINT);
        const data = await response.json();
        data1 = interpolaFechas(data);
        console.log(data.length);
        //Ordenar los datos
        switch(ordenPor){

            case 'odrIDProceso':
                datosGlobales= data1 ; //data se ordena asi por el servidor;

                break;
            case 'OrdPresupu':
                datosGlobales= ordenarDataset(data1, 'precio_base', 'desc','number');

                break;
            case 'OrdEntidad':
                datosGlobales= ordenarDataset(data1, 'entidad');

                break;


        }


        filtrarTabla();
        document.getElementById('graficosContainer').style.display = 'flex'; // Mostrar gráficos
        document.getElementById('tarjetaPromedio').style.display = 'block'; // Mostrar la tarjeta
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        tabla.innerHTML = "<tr><td colspan='13'>Error al cargar los datos.</td></tr>";
    }
}



function extraeNumId(idString){

    //ejemplo: CO1.REQ.7954546 -> 7954546
    const partes = idString.split('.');
    return parseInt(partes[2], 10);//retorna un numero

}


function interpolaFechas(data){

    const baseId = 6013375;
    const baseFecha = new Date('2024-10-24');
    const kb=12453;
    // let fehelp= baseFecha;


       data.forEach(item=>{

       item.ntcNumero = extraeNumId(item.id_del_proceso);
        // console.log(item.id_del_proceso);
        // console.log(item.ntcNumero);



       if (item.fecha_de_publicacion_del == undefined) {

           const mdays = ((item.ntcNumero - baseId)/kb);

           let fehelp = new Date('2024-10-24');

           fehelp.setDate(baseFecha.getDate()+mdays);

        // 3. Formatear la fecha resultante de nuevo a "dd-mm-aaaa"
            const nuevoDia = String(fehelp.getDate()).padStart(2, '0');
            const nuevoMes = String(fehelp.getMonth() + 1).padStart(2, '0'); // getMonth() es base 0
            const nuevoAno = String(fehelp.getFullYear());



           item.fecha_de_publicacion_del = `${nuevoMes}/${nuevoDia}/${nuevoAno}`;
           // console.log(item.fecha_de_publicacion_del);


        }else {



           let fehelpx = new Date(item.fecha_de_publicacion_del);



        // 3. Formatear la fecha resultante de nuevo a "dd-mm-aaaa"
            const nuevoDia = String(fehelpx.getDate()).padStart(2, '0');
            const nuevoMes = String(fehelpx.getMonth() + 1).padStart(2, '0'); // getMonth() es base 0
            const nuevoAno = String(fehelpx.getFullYear());



           item.fecha_de_publicacion_del = `${nuevoMes}/${nuevoDia}/${nuevoAno}`;
           // console.log(item.fecha_de_publicacion_del);




            // console.log(item.fecha_de_publicacion_del);


        }

    });
    // let tmpdata = ordenarDataset(data, 'ntcNumero', 'desc','number'); //ordena de más reciente a más antiguo


    return data;



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
        numero.innerHTML = item.referencia_del_proceso || '';
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
    // const datosConFecha = data.filter(item => item.fecha_de_publicacion_del); // Filtrar los datos sin fecha
    const datosConFecha = data; // Filtrar los datos sin fecha

    // Obtener la fecha de hace 12 meses
    const fechaHace12Meses = new Date();
    fechaHace12Meses.setMonth(fechaHace12Meses.getMonth() - 12);

    // Filtrar los datos para los últimos 12 meses
    const datosUltimos12Meses = datosConFecha.filter(item => {
        const fechaPublicacion = new Date(item.fecha_de_publicacion_del);
        return fechaPublicacion >= fechaHace12Meses;
    });


    datosUltimos12Meses.forEach(item => {
        const fecha = item.fecha_de_publicacion_del.substring(6, 10)+'-'+item.fecha_de_publicacion_del.substring(0, 2)
        ;//+'-'+item.fecha_de_publicacion_del.substring(3, 5); // Año-Mes-dia
        const presupuesto = parseFloat(item.precio_base) || 0;
        presupuestosPorTiempo[fecha] = (presupuestosPorTiempo[fecha] || 0) + presupuesto; //Acumula para cada categoria
    });


    const presupuestosPorTiempoOrdenado = Object.fromEntries(
    Object.entries(presupuestosPorTiempo).sort()
);

    const tiempos = Object.keys(presupuestosPorTiempoOrdenado);
    const presupuestosTiempo = Object.values(presupuestosPorTiempoOrdenado);

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
    let nplazo = 0;

    data.forEach(item => {
        totalPresupuesto += parseFloat(item.precio_base) || 0;

        const utiempo = item.unidad_de_duracion;
        let fplazo =  1/30;
        if (utiempo == 'Mes(es)'){
            fplazo = 1;

        }



        totalPlazo += fplazo*(item.duracion) || 0;

    });

    const promedioPresupuesto = data.length > 0 ? totalPresupuesto / data.length : 0;

    const promedioPlazo = data.length > 0 ? totalPlazo / data.length : 0;

    document.getElementById('promedioPresupuestoPlazo').textContent = `Promedio Presupuesto: ${promedioPresupuesto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} - Promedio Plazo: ${promedioPlazo.toFixed(1)} meses`;

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
                legend: { display: true },
                title: { display: false }
            }
        }
    });
}

function init() {
  cargarDatos();
}

// odrIDProceso
// option value
// option value

//Seleccion de opciones de ordenamiento

// const selectOrdenarpor = document.getElementById('ordenar_por');
// const resOrdenpor = document.getElementById('opt_ordenar_por');
//
// selectOrdenarpor.addEventListener('change',function(){}
//
//
//
// );




// document.getElementById('precioMin').onkeyup = filtrarTabla;
// document.getElementById('precioMax').onkeyup = filtrarTabla;


window.onload = init;




