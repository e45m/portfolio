// Configuración inicial



let lineasFacturacionChart, lineasAvanceProcentChart, barrasEmpleosChart , lineasKmViaChart;

let zipa=[];


async function cargarDatos() {

let grupo =  document.getElementById('selectGrupo').value;



  // let grupo = '4';




    try {
        //loadZIPA();

        // const op = await fetch('../data/TM68/op.json');
       // zipa =  loadZIPA_G4();

        const resp = await fetch(`../data/TM68/zipa_g${grupo}.json`);
        zipa = await resp.json();

     } catch (error) {
        console.error('Error al cargar los datos:', error);
       // tabla.innerHTML = "<tr><td colspan='13'>Error al cargar los datos.</td></tr>";
    }





    actualizarCards();
    actualizarTablainfo1();
    actualizarGraficos();
    pmpTable();
    Metas();
}




// Función para limpiar y convertir un valor monetario a número
function parseCurrencyValue(currencyString) {
  // Elimina el símbolo de moneda, los puntos como separadores de miles y reemplaza la coma decimal por un punto
  const cleanedString = currencyString.replace(/[$.]/g, '').replace(/\.(?=[^.]*\.)/g, '').replace(',', '.');

  // Convierte a número usando parseFloat
  return parseFloat(cleanedString);
}

function parsePercentage(percentageString) {
  if (typeof percentageString !== 'string') {
    return NaN; // Not a string, can't parse
  }

  const cleanedString = percentageString.trim(); // Remove leading/trailing whitespace

  const sign = cleanedString.startsWith('-') ? -1 : 1; // Determine sign
  const stringWithoutSign = cleanedString.startsWith('-') || cleanedString.startsWith('+') ? cleanedString.slice(1) : cleanedString; // Remove sign

  const stringWithoutPercent = stringWithoutSign.endsWith('%') ? stringWithoutSign.slice(0, -1) : stringWithoutSign; // Remove % sign

  const number = parseFloat(stringWithoutPercent); // Convert to a number

  if (isNaN(number)) {
    return NaN; // Parsing failed
  }

  return sign * number; // Apply the sign
}




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



function actualizarCards(){


      const dataLength = zipa.length;

    if (dataLength > 0) {
        const lastRecord = zipa[dataLength - 1];


     const valCto = lastRecord["totalContrato"];
     document.getElementById('card-facturado').textContent = lastRecord["valorPagado"];
     document.getElementById('label-facturado').textContent = 'de un  valor total de ' + valCto;

     document.getElementById('avance-general').textContent = lastRecord["porcentajeEjecutado"];

     document.getElementById('variacion-plazo').textContent = lastRecord["mallaVialKmCarrilEjecutado"];
     document.getElementById('label-variacion-plazo').textContent = 'de ' + lastRecord["mallaVialKmCarrilPlaneado"] + 'km';

     document.getElementById('variacion-presupuesto').textContent = lastRecord["espacioPublicoM2Ejecutado"];
     document.getElementById('label-variacion-presupuesto').textContent = 'de '+lastRecord["espacioPublicoM2Planeado"] +'m2 totales';

     document.getElementById('cardkmCruta').textContent = lastRecord["ciclorutaKmEjecutado"];
     document.getElementById('labelkmCruta').textContent = 'de ' + lastRecord["ciclorutaKmEjecutado"] +'km totales';

    }
}


function actualizarTablainfo1(){

    const tabla = document.getElementById("problems-table").getElementsByTagName('tbody')[0];
    tabla.innerHTML = "";


    zipa.forEach(item => {
     // console.log(String(item.informeFecha) ) ;
      if (String(item.informeFecha).substring(0,4) =='2025' && item.observacionesProble)
      {
        let row = tabla.insertRow();

        row.insertCell(0).innerHTML  = item.informeFecha;
        row.insertCell(1).innerHTML  = item.observacionesProble;
      }
    }

    );



}

function actualizarGraficos() {
    // Función para destruir los gráficos existentes
    function destroyChart(chart) {
        if (chart) {
            chart.destroy();
        }
    }

// Destruir la instancia anterior del gráfico

// Función para generar un color aleatorio (opcional)
function generarColorAleatorio() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r}, ${g}, ${b})`;
}



    sum = 0;
    function cumule(a){
        sum = sum+a;
        //console.log(sum);
        return sum;
    }




    const datosOP = [
        {
            label: 'Valor Facturado',
            data: zipa.map(campo => ({
                x: new Date( campo.informeFecha.split('/').reverse().join('-')),
                y: parseCurrencyValue(campo["valorPagado"])
            })),
            borderColor: generarColorAleatorio(),
            backgroundColor: generarColorAleatorio(),
            pointRadius: 5,
            showLine: true
        },

    ];


    destroyChart(lineasFacturacionChart);
    lineasFacturacionChart = new Chart(document.getElementById('lineasFacturacion'), {
        type: 'scatter',
        data: {datasets:datosOP},
        options: {
        scales: {

     x: {
         type:'linear',

          beginAtZero: false,
          ticks: {
            callback:function(value, index, values){
                return new Date(value).toLocaleDateString();

            },
            autoSkip: true,
            maxTicksLimit: 10
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10
          }
        }


            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: { display: false }
            }
        }
    }
    );


//Grafico 1:

    // Preparar los datos para Chart.js
    const datosAv = [
        {
            label: '% Planeado',
            data: zipa.map(campo => ({
                x: new Date(campo.informeFecha.split('/').reverse().join('-')),
                y: parseCurrencyValue(campo["porcentajePlaneado"])
            })),
            borderColor: generarColorAleatorio(),
            backgroundColor: generarColorAleatorio(),
            pointRadius: 5,
            showLine: true
        },
        {
            label: '% Ejecutado',
            data: zipa.map(campo => ({
                x: new Date( campo.informeFecha.split('/').reverse().join('-')),
                y: parseCurrencyValue(campo["porcentajeEjecutado"])
            })),
            borderColor: generarColorAleatorio(),
            backgroundColor: generarColorAleatorio(),
            pointRadius: 3,
            showLine: true
        }
    ];


    destroyChart(lineasAvanceProcentChart);
    lineasAvanceProcentChart = new Chart(document.getElementById('lineasAvanceProcent'), {
        type: 'scatter',
        data: {datasets:datosAv},
        options: {
        scales: {

     x: {
         type:'linear',

          beginAtZero: false,
          ticks: {
            callback:function(value, index, values){
                return new Date(value).toLocaleDateString();

            },
            autoSkip: true,
            maxTicksLimit: 10
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10
          }
        }


            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: { display: false }
            }
        }
    }
    );






}


function pmpTable()
{

  const dataLength = zipa.length;

    if (dataLength > 0) {
        const lastRecord = zipa[dataLength - 1];
        const BAC = parseCurrencyValue(lastRecord["totalContrato"]);

        // Calculate EVM metrics for the last record
        const PV = (parsePercentage(lastRecord["porcentajePlaneado"]) / 100) * BAC;
        const EV = (parsePercentage(lastRecord["porcentajeEjecutado"]) / 100) * BAC;
        const AC = parseCurrencyValue(lastRecord["valorPagado"]);




        const CV = EV - AC;
        const SV = EV - PV;
        const CPI = EV / AC;
        const SPI = EV / PV;
        const EAC = BAC / CPI;
        const VAC = BAC - EAC;

        const CV_formatted = CV.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 });
        const SV_formatted = SV.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 });
        const CPI_formatted = CPI.toFixed(2);
        const SPI_formatted = SPI.toFixed(2);
        const EAC_formatted = EAC.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 });
        const VAC_formatted = VAC.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 });

        // Populate the table
        const tableBody = document.querySelector('#evm-table tbody');

        tableBody.innerHTML = `
          <tr><td>Fecha del Informe</td><td>-</td><td>${lastRecord["informeFecha"]}</td></tr>
          <tr><td>Valor Ganado (EV)</td><td>EV = %Ejecutado * BAC</td><td>${EV.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 })}</td></tr>
          <tr><td>Valor Planificado (PV)</td><td>PV = %Planeado * BAC</td><td>${PV.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 })}</td></tr>
          <tr><td>Costo Real (AC)</td><td>-</td><td>${AC.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 })}</td></tr>
          <tr><td>Variación de Costo (CV)</td><td>CV = EV - AC</td><td>${CV_formatted}</td></tr>
          <tr><td>Variación de Cronograma (SV)</td><td>SV = EV - PV</td><td>${SV_formatted}</td></tr>
          <tr><td>Índice de Rendimiento de Costo (CPI)</td><td>CPI = EV / AC</td><td>${CPI_formatted}</td></tr>
          <tr><td>Índice de Rendimiento de Cronograma (SPI)</td><td>SPI = EV / PV</td><td>${SPI_formatted}</td></tr>
          <tr><td>Estimación al Finalizar (EAC)</td><td>EAC = BAC / CPI</td><td>${EAC_formatted}</td></tr>
          <tr><td>Variación al Finalizar (VAC)</td><td>VAC = BAC - EAC</td><td>${VAC_formatted}</td></tr>
        `;

    } else {
        console.log("The contractData array is empty.");
    }

}



function Metas()
{

      const dataLength = zipa.length;

  if (dataLength > 0) {
    const lastRecord = zipa[dataLength - 1];


    // Function to safely parse number strings with commas and currency symbols
    function parseNumberString(numberString) {
      if (typeof numberString !== 'string') {
        return NaN; // Not a string, can't parse
      }

      const cleanedString = numberString.trim().replace(/[$.]/g, ''); // Remove currency symbols and commas
      const number = parseFloat(cleanedString);

      if (isNaN(number)) {
        return NaN; // Parsing failed
      }

      return number;
    }

    const troncalKmPlaneado = parseNumberString(lastRecord["troncalKmPlaneado"]);
    const troncalKmEjecutado = parseNumberString(lastRecord["troncalKmEjecutado"]);
    const mallaVialKmCarrilPlaneado = parseNumberString(lastRecord["mallaVialKmCarrilPlaneado"]);
    const mallaVialKmCarrilEjecutado = parseNumberString(lastRecord["mallaVialKmCarrilEjecutado"]);
    const espacioPublicoM2Planeado = lastRecord["espacioPublicoM2Planeado"];
    const espacioPublicoM2Ejecutado = parseNumberString(lastRecord["espacioPublicoM2Ejecutado"]);
    const ciclorutaKmPlaneado = parseNumberString(lastRecord["ciclorutaKmPlaneado"]);
    const ciclorutaKmEjecutado = parseNumberString(lastRecord["ciclorutaKmEjecutado"]);
    const puentesPeatonalesPlaneado = lastRecord["puentesPeatonalesPlaneado"];
    const puentesPeatonalesEjecutado = parseNumberString(lastRecord["puentesPeatonalesEjecutado"]);
    const cicloparqueaderosPlaneado = lastRecord["cicloparqueaderosPlaneado"];
    const cicloparqueaderosEjecutado = lastRecord["cicloparqueaderosEjecutado"];



    // Set max and value for progress bars, and update text
    document.getElementById('troncal-progress').max = troncalKmPlaneado;
    document.getElementById('troncal-progress').value = troncalKmEjecutado;
    document.getElementById('troncal-percentage').textContent = troncalKmEjecutado + " / " + troncalKmPlaneado + " Km";

    document.getElementById('malla-vial-progress').max = mallaVialKmCarrilPlaneado;
    document.getElementById('malla-vial-progress').value = mallaVialKmCarrilEjecutado;
    document.getElementById('malla-vial-percentage').textContent = mallaVialKmCarrilEjecutado + " / " + mallaVialKmCarrilPlaneado + " Km-Carril";

    document.getElementById('espacio-publico-progress').max = espacioPublicoM2Planeado;
    document.getElementById('espacio-publico-progress').value = espacioPublicoM2Ejecutado;
    document.getElementById('espacio-publico-percentage').textContent = espacioPublicoM2Ejecutado + " / " + espacioPublicoM2Planeado + " m2";

    document.getElementById('ciclorruta-progress').max = ciclorutaKmPlaneado;
    document.getElementById('ciclorruta-progress').value = ciclorutaKmEjecutado;
    document.getElementById('ciclorruta-percentage').textContent = ciclorutaKmEjecutado + " / " + ciclorutaKmPlaneado + " Km";

    document.getElementById('puentes-peatonales-progress').max = puentesPeatonalesPlaneado;
    document.getElementById('puentes-peatonales-progress').value = puentesPeatonalesEjecutado;
    document.getElementById('puentes-peatonales-percentage').textContent = puentesPeatonalesEjecutado + " / " + puentesPeatonalesPlaneado + " Unidades";

    document.getElementById('cicloparqueaderos-progress').max = cicloparqueaderosPlaneado;
    document.getElementById('cicloparqueaderos-progress').value = cicloparqueaderosEjecutado;
    document.getElementById('cicloparqueaderos-percentage').textContent = cicloparqueaderosEjecutado + " / " + cicloparqueaderosPlaneado + " Unidades";
  }
}










function init() {



  cargarDatos();
}


window.onload = init;


//-----------------------------------------------------








