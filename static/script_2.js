// Configuración inicial
const WEBREPO = 'www.datos.gov.co';
const DATASETNAME1 = 'ceth-n4bn'; //Proveedores registrados
const DATASETNAME2 = 'jbjy-vk9h'; //ECOP II - Contratos Electrónicos

const LIMIT = 1000;

let datosGlobales = [];
let presupuestosEntidadChart, presupuestosTiempoChart, procesosUnspscChart;

async function cargarDatos() {
    //alert("ok");
    let datosParticipantes=[];
    const personaInput = document.getElementById('Persona').value.toUpperCase();


    const sqlSelect = `SELECT nombre_grupo,codigo_grupo WHERE (UPPER(nombre_participante) LIKE "%${personaInput}%") LIMIT ${LIMIT}`;

    const API_ENDPOINT = `https://${WEBREPO}/resource/${DATASETNAME1}.json?$query=${encodeURIComponent(sqlSelect)}`;

    //limpia la tabla en el html
    const tabla = document.getElementById('tablaResultados').getElementsByTagName('tbody')[0];
    tabla.innerHTML = "";
 console.log (sqlSelect);

    try {
        const response = await fetch(API_ENDPOINT);
        const data = await response.json();

        datosParticipantes = data;


    } catch (error) {
        console.error('Error al cargar los datos paso 1:', error);
        tabla.innerHTML = "<tr><td colspan='13'>Error al cargar los datos.</td></tr>";
    }


    let parts = `UPPER(proveedor_adjudicado) LIKE "%${personaInput}%"`;

    for (const participante of datosParticipantes) {


        parts += ` OR codigo_proveedor = "${participante.codigo_grupo}"`;
    }



        const sqlSelect2 = `
            SELECT proveedor_adjudicado, nombre_entidad, valor_del_contrato, tipo_de_contrato, fecha_de_firma, urlproceso WHERE (${parts})
            LIMIT ${LIMIT}
        `;
  console.log (sqlSelect2);
        const API_ENDPOINT2 = `https://${WEBREPO}/resource/${DATASETNAME2}.json?$query=${encodeURIComponent(sqlSelect2)}`;



        try {
            const response = await fetch(API_ENDPOINT2);
            const data2 = await response.json();

            datosGlobales = data2;


        } catch (error) {
            console.error('Error al cargar los datos paso 1:', error);
            tabla.innerHTML = "<tr><td colspan='13'>Error al cargar los datos.</td></tr>";
        }


//   for (const participante of datosGlobales) {
//
//
//
//     }

filtrarTabla();

}





function filtrarTabla() {
    const tabla = document.getElementById("tablaResultados").getElementsByTagName('tbody')[0];
    tabla.innerHTML = "";

//Variables con los filtros
// let filteredData = datosGlobales.filter(item ...
   let filteredData = datosGlobales;
    // Actualizar gráficos con los datos filtrados
    //actualizarGraficos(filteredData);

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
        let Adjudicatario = row.insertCell(0);
        let Entidad = row.insertCell(1);
        let Valor = row.insertCell(2);
        let Tipo = row.insertCell(3);
        let Fecha = row.insertCell(4);
        let link = row.insertCell(5);


        Adjudicatario.innerHTML = item.proveedor_adjudicado || '';
        Entidad.innerHTML = item.nombre_entidad || '';
        Valor.innerHTML = formatPrice(item.valor_del_contrato) || '';
        Tipo.innerHTML = item.tipo_de_contrato || '';
        Fecha.innerHTML = formatDate(item.fecha_de_firma) || '';
       // link.innerHTML = formatPrice(item.precio_base) || '';

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




