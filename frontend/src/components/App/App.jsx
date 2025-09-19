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
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:8000';

  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        setIsLoading(true);
        const resProyectos = await axios.get(`${API_BASE_URL}/api/proyectos`);
        setProyectos(resProyectos.data.proyectos);
        
        if (resProyectos.data.proyectos.length > 0) {
          const primerProyecto = resProyectos.data.proyectos[0].nombre;
          setProyectoSeleccionado(primerProyecto);
          await cargarUnidades(primerProyecto);
        }
      } catch (error) {
        console.error("Error al cargar proyectos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarProyectos();
  }, []);

  const cargarUnidades = async (proyecto) => {
    try {
      setIsLoading(true);
      const resUnidades = await axios.get(`${API_BASE_URL}/api/unidades?proyecto=${proyecto}`);
      setUnidades(resUnidades.data.unidades.filter(u => u.proyecto === proyecto));
    } catch (error) {
      console.error(`Error al cargar unidades para ${proyecto}:`, error);
      setUnidades([]);
    } finally {
      setIsLoading(false);
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
    const res = await axios.post(`${API_BASE_URL}/api/calcular`, {
      unidad_id: parseInt(inputs.unidad_id),
      tiempo: inputs.tiempo,
      proyecto: inputs.proyecto
    });
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
      alert(`Error: ${error.response.data.detail || 'Hubo un problema al procesar tu solicitud'}`);
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