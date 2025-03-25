import pandas as pd
import json
import sys
import os

def csv_to_json(csv_file):
  """
  Convierte un archivo CSV a JSON usando pandas.

  Args:
    csv_file: La ruta al archivo CSV de entrada.
  """
  try:
    # 1. Construir el nombre del archivo JSON de salida
    base_name = os.path.splitext(csv_file)[0]  # Obtiene el nombre base del archivo sin la extensión
    json_file = base_name + ".json"

    # 2. Leer el archivo CSV usando pandas
    df = pd.read_csv(csv_file)

    # 3. Convertir el DataFrame a JSON
    data = df.to_json(orient="records", indent=4)

    # 4. Escribir el JSON a un archivo
    with open(json_file, "w") as f:
      f.write(data)

    print(f"Archivo CSV convertido a JSON exitosamente: {json_file}")

  except FileNotFoundError:
    print(f"Error: El archivo CSV no se encontró: {csv_file}")
  except Exception as e:
    print(f"Error durante la conversión: {e}")


if __name__ == "__main__":
  # Verificar si se proporcionó el nombre del archivo CSV como argumento
  if len(sys.argv) != 2:
    print("Uso: python script.py <nombre_del_archivo.csv>")
    sys.exit(1)  # Salir con un código de error

  # Obtener el nombre del archivo CSV de la línea de comandos
  csv_file = sys.argv[1]

  # Llamar a la función de conversión
  csv_to_json(csv_file)
