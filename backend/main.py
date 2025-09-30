from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import numpy as np

app = FastAPI() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=[""], # 👈 allow
    #allow_origins=[
    #"https://tablero-de-plusvalia.vercel.app/",      # your deployed frontend
    #"http://localhost:3000"           # local React dev server
#],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Inputs(BaseModel):
    unidad_id: int
    tiempo: int
    proyecto: str

def get_excel_path(filename: str):
    # Always look inside backend/data/
    base_path = os.path.join(os.path.dirname(__file__), "data")
    return os.path.join(base_path, filename)


@app.post("/api/calcular")
def calcular(inputs: Inputs):
    # Cargar datos de unidades disponibles
    excel_path = get_excel_path("unidades_disponibles.xlsx")
    df_unidades = pd.read_excel(excel_path)
    
    # Verificar que la unidad exista y pertenezca al proyecto seleccionado
    if inputs.unidad_id < 0 or inputs.unidad_id >= len(df_unidades):
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    
    unidad_seleccionada = df_unidades.iloc[inputs.unidad_id]
    
    if unidad_seleccionada["Proyectos"] != inputs.proyecto:
        raise HTTPException(status_code=400, detail="La unidad no pertenece al proyecto seleccionado")
    
    # Verificar que el tiempo no exceda 10 años
    if inputs.tiempo > 10:
        raise HTTPException(status_code=400, detail="El tiempo máximo permitido es de 10 años")
    
    # Obtener precio de la unidad seleccionada
    precio = unidad_seleccionada["Precio"]
    enganche = precio * unidad_seleccionada["Enganche"]  # 25% por defecto
    superficie = unidad_seleccionada["Superficie"]
    
    # Cargar datos del proyecto seleccionado
    excel_path = get_excel_path("plusvalia_de_proyectos.xlsx")
    df_proyectos = pd.read_excel(excel_path)
    datos_proyecto = df_proyectos[df_proyectos["Proyectos"] == inputs.proyecto]
    
    if datos_proyecto.empty:
        raise HTTPException(status_code=404, detail=f"Proyecto '{inputs.proyecto}' no encontrado")
    
    # Extraer años de manera segura
    años = []
    for trimestre in datos_proyecto["Trimestre"]:
        try:
            año = int(trimestre[0:2])
            años.append(año)
        except (ValueError, TypeError, IndexError):
            continue
    
    if not años:
        raise HTTPException(status_code=400, detail="No se pudieron extraer años válidos de los datos del proyecto")
    
    año_min = min(años)
    año_max = max(años)
    
    # Convertir datos trimestrales a anuales (promedio de 4 trimestres)
    incrementos_anuales = []
    for year in range(año_min, año_max + 1):
        # Buscar trimestres que comienzan con el año actual
        año_str = str(year)
        trimestres_año = datos_proyecto[[t.startswith(año_str) for t in datos_proyecto["Trimestre"].astype(str)]]
        
        if not trimestres_año.empty:
            incremento_anual = trimestres_año["Incremento Trimestral"].mean() * 4  # aproximación anual
            incrementos_anuales.append(incremento_anual)
    
    # Si no hay datos, usar un valor predeterminado
    if not incrementos_anuales:
        incrementos_anuales = [0.03]  # valor predeterminado del 3% anual
    
    # Ajustar si la cantidad de años es menor al tiempo solicitado
    while len(incrementos_anuales) < inputs.tiempo:
        incrementos_anuales.append(incrementos_anuales[-1])  # usar el último valor conocido
    
    # Calcular valor inmobiliario con plusvalía del proyecto
    valores = []
    precio_actual = precio
    
    for year in range(1, inputs.tiempo + 1):
        if year <= len(incrementos_anuales):
            plusvalia_anual = incrementos_anuales[year-1]
        else:
            plusvalia_anual = incrementos_anuales[-1]  # usar último valor si superamos los datos
            
        precio_actual *= (1 + plusvalia_anual)
        valores.append({"año": year, "valor": round(precio_actual, 2)})
    
    # Información de la unidad seleccionada para el frontend
    unidad_info = {
        "id": inputs.unidad_id,
        "superficie": superficie,
        "precio": precio,
        "enganche": enganche,
        "enganche_porcentaje": unidad_seleccionada["Enganche"] * 100  # Convertir a porcentaje
    }
    
    return {
        "valores": valores,
        "proyecto_seleccionado": inputs.proyecto,
        "plusvalias_anuales": incrementos_anuales[:inputs.tiempo],
        "unidad_info": unidad_info
    }

@app.get("/api/proyectos")
def obtener_proyectos():
    # Cargar el archivo Excel de proyectos
    excel_path = get_excel_path("plusvalia_de_proyectos.xlsx")
    df_proyectos = pd.read_excel(excel_path)
    
    # Obtener lista única de proyectos
    proyectos_unicos = df_proyectos["Proyectos"].unique().tolist()
    
    # Organizar datos por proyecto
    proyectos_data = []
    for proyecto in proyectos_unicos:
        datos_proyecto = df_proyectos[df_proyectos["Proyectos"] == proyecto]
        # Convertir a formato más conveniente para el frontend
        datos_formateados = datos_proyecto.to_dict(orient="records")
        proyectos_data.append({
            "nombre": proyecto,
            "datos": datos_formateados
        })
    
    return {"proyectos": proyectos_data}

@app.get("/api/instrumentos")
def obtener_instrumentos():
    # Mantenemos este endpoint para compatibilidad con el frontend existente
    # pero ya no usaremos los instrumentos financieros
    excel_path = get_excel_path("instrumentos_financieros.xlsx")
    df_instrumentos = pd.read_excel(excel_path)
    instrumentos_data = df_instrumentos.to_dict(orient="records")
    return {"instrumentos": instrumentos_data}

@app.get("/api/unidades")
def obtener_unidades(proyecto: str = None):
    # Cargar el archivo Excel de unidades
    excel_path = get_excel_path("unidades_disponibles.xlsx")
    df_unidades = pd.read_excel(excel_path)
    
    # Filtrar por proyecto si se especifica
    if proyecto:
        df_unidades = df_unidades[df_unidades["Proyectos"] == proyecto]
    
    # Convertir a formato más conveniente para el frontend
    unidades_list = []
    
    for i, row in df_unidades.iterrows():
        unidades_list.append({
            "id": i,
            "proyecto": row["Proyectos"],
            "superficie": row["Superficie"],
            "precio": row["Precio"],
            "enganche": row["Enganche"],
            "enganche_valor": row["Precio"] * row["Enganche"],
            # Formato para mostrar en la lista desplegable
            "descripcion": f"Superficie: {row['Superficie']} m², Precio: ${row['Precio']:,.2f}"
        })
    
    return {"unidades": unidades_list}

@app.get("/api/health")
def health_check():
    return {"status": "OK", "message": "API is running"}