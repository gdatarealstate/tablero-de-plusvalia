import React, { useState, useEffect } from "react";
import './App.scss';
import axios from "axios";
import InputForm from "../InputForm/InputForm";
import ResultChart from "../ResultChart/ResultChart";

function App() {
  const [result, setResult] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState("");

useEffect(() => {
  const cargarProyectos = async () => {
    try {
      // Usar la URL completa para evitar problemas de ruta
      const resProyectos = await axios.get("/proyectos");
      setProyectos(resProyectos.data.proyectos);
      
      if (resProyectos.data.proyectos.length > 0) {
        const primerProyecto = resProyectos.data.proyectos[0].nombre;
        setProyectoSeleccionado(primerProyecto);
        cargarUnidades(primerProyecto);
      }
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
    }
  };
  
  cargarProyectos();
}, []);

  const cargarUnidades = async (proyecto) => {
    try {
      const resUnidades = await axios.get(`/unidades?proyecto=${proyecto}`);
      setUnidades(resUnidades.data.unidades);
    } catch (error) {
      console.error(`Error al cargar unidades para ${proyecto}:`, error);
      setUnidades([]);
    }
  };

  const handleProyectoChange = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    cargarUnidades(proyecto);
  };

const calcular = async (inputs) => {
  setIsLoading(true);
  try {
    console.log("Enviando datos a la API:", inputs);
    const res = await axios.post("/calcular", inputs);
    console.log("Respuesta de la API:", res.data);
    setResult({
      valores: res.data.valores,
      inputs: inputs,
      proyecto_seleccionado: res.data.proyecto_seleccionado,
      plusvalias_anuales: res.data.plusvalias_anuales,
      unidad: res.data.unidad_info
    });
  } catch (error) {
    console.error("Error en la API:", error);
    if (error.response) {
      console.error("Detalles del error:", error.response.data);
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div>
      <h1>Simulador de Inversión Inmobiliaria</h1>
      <InputForm 
        onCalcular={calcular} 
        proyectos={proyectos} 
        unidades={unidades}
        onProyectoChange={handleProyectoChange}
      />
      {isLoading && <p>Cargando resultados...</p>}
      {result && <ResultChart data={result} />}
    </div>
  );
}

export default App;