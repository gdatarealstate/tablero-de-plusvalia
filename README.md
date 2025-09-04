# Simulador de Inversión Inmobiliaria

Aplicación web para simular y comparar inversiones en proyectos inmobiliarios.

## Características
- Selección de proyectos inmobiliarios
- Visualización de unidades disponibles por proyecto
- Cálculo de rendimiento basado en plusvalías históricas
- Gráficas comparativas de rendimiento

## Tecnologías
- Frontend: React, Chart.js, Axios
- Backend: FastAPI, Pandas
- Datos: Excel

## Instalación

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start