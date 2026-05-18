# BCV Scraper Microservice (Python)

Este es un microservicio desarrollado en Python utilizando **FastAPI** para realizar el scraping del sitio web oficial del Banco Central de Venezuela (BCV) y obtener las cotizaciones vigentes del Dólar y del Euro.

Fue migrado desde el backend original de NestJS para desacoplar las tareas de scraping de la lógica del negocio principal.

## Requisitos

- Python 3.10 o superior.
- Pip (Administrador de paquetes de Python).

## Instalación y Ejecución Local

1. Crea y activa un entorno virtual (opcional pero recomendado):
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\activate
   # En macOS/Linux:
   source venv/bin/activate
   ```

2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. Abre tu navegador e ingresa a:
   - **Endpoints y Swagger UI**: `http://localhost:8000/docs`
   - **Obtener tasas de cambio**: `http://localhost:8000/bcv`

## Ejecución con Docker

Para construir y levantar el contenedor individual de este servicio de manera local:

1. Construir la imagen Docker:
   ```bash
   docker build -t crypto-calculator-scraper:latest .
   ```

2. Levantar el contenedor:
   ```bash
   docker run -p 8000:8000 --name crypto_scraper crypto-calculator-scraper:latest
   ```

## Estructura de Respuesta del API

El endpoint `GET /bcv` devuelve la siguiente estructura JSON que es compatible al 100% con la esperada por el backend en NestJS:

```json
{
  "official": {
    "buy": 36.5432,
    "sell": 36.5432,
    "average": 36.5432,
    "name": "BCV Dólar Oficial",
    "last_updated": "2026-05-18T14:04:32Z",
    "source": "bcv.org.ve"
  },
  "euro": {
    "buy": 39.8123,
    "sell": 39.8123,
    "average": 39.8123,
    "name": "BCV Euro",
    "last_updated": "2026-05-18T14:04:32Z",
    "source": "bcv.org.ve"
  }
}
```
