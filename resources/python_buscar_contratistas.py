import pandas as pd
from sodapy import Socrata



def busc_empresa(Empresa_buscada):
    """
    Busca información de una empresa en dos datasets de datos.gov.co:
    1. Proveedores registrados (ceth-n4bn)
    2. SECOP II - Contratos Electrónicos (jbjy-vk9h)

    Args:
        Empresa_buscada (str): El nombre de la empresa a buscar.

    Returns:
        None: Guarda los resultados en un archivo Excel.
    """

    # Configuración del cliente Socrata
    webrepo = 'www.datos.gov.co'
    datasetname_proveedores = 'ceth-n4bn'  # Proveedores registrados
    datasetname_secop = 'jbjy-vk9h'  # SECOP II - Contratos Electrónicos


     # Cliente no autenticado (solo para datasets públicos)
     client = Socrata(webrepo, None)



    # --- Búsqueda en el dataset de proveedores registrados ---
    print(f"Buscando '{Empresa_buscada}' en el dataset de proveedores...")
    sqlSelect_proveedores = r'SELECT nombre_grupo  WHERE (nombre_participante LIKE "%' + Empresa_buscada + r'%") LIMIT 5000'
    Res_proveedores = client.get(datasetname_proveedores, query=sqlSelect_proveedores, content_type="csv")

    # Creación del DataFrame de Pandas con los resultados
    proveReg = pd.DataFrame.from_records(Res_proveedores)
    proveReg.columns = proveReg.iloc[0, :]  # Asigna la primera fila como nombres de columna
    proveReg.drop([0], inplace=True)  # Elimina la primera fila (que ahora son los nombres de columna)

    # --- Búsqueda en el dataset de contratos electrónicos (SECOP II) ---
    print("Buscando contratos relacionados...")
    flag = None  # Variable para controlar la concatenación de DataFrames
    ccios = pd.DataFrame() # Inicializar DataFrame para concatenar resultados
    for ccio in proveReg['nombre_grupo']:
        sqlSelect_contratos = r'SELECT proveedor_adjudicado, nombre_entidad, valor_del_contrato, tipo_de_contrato, fecha_de_firma, urlproceso WHERE (proveedor_adjudicado = "' + ccio + r'")'
        Resccio = client.get(datasetname_secop, query=sqlSelect_contratos, content_type="csv")

        # Creación del DataFrame temporal y concatenación con el DataFrame principal
        tmpccio = pd.DataFrame.from_records(Resccio)
        if flag is None:
            ccios = tmpccio
            flag = 1
            print('ccios inicial \n')
            print(ccios)
        else:
            ccios = pd.concat([ccios, tmpccio], ignore_index=True)
            print('ccios iteracióm xx \n')
            print(ccios)
    # Búsqueda adicional en SECOP II usando LIKE
    print("Búsqueda adicional en SECOP II usando LIKE...")
    sqlSelect_contratos_like = r'SELECT proveedor_adjudicado, nombre_entidad, valor_del_contrato, tipo_de_contrato, fecha_de_firma, urlproceso WHERE ( proveedor_adjudicado LIKE "%' + Empresa_buscada + r'%")'
    Resccio = client.get(datasetname_secop, query=sqlSelect_contratos_like, content_type="csv")
    tmpccio = pd.DataFrame.from_records(Resccio)
    ccios = pd.concat([ccios, tmpccio], ignore_index=True)


    # Cierre de la conexión al cliente Socrata
    Socrata.close(client)

    # --- Guardado de los resultados en un archivo Excel ---
    print("Guardando resultados en archivo Excel...")
    Path = '/'  # Ruta donde se guardará el archivo (actualmente en la raíz)
    File = Empresa_buscada + '.xlsx'  # Nombre del archivo
    ccios.to_excel(Path + File)  # Guarda el DataFrame en el archivo Excel

    print(f"Resultados guardados en: {Path + File}")


# Ejemplo de uso
busc_empresa("La empresa que consulta")
