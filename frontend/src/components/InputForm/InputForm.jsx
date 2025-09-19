import React, { useState, useEffect } from "react";
import './InputForm.scss';
import axios from "axios";

function InputForm({ onCalcular, proyectos }) {
  const [inputs, setInputs] = useState({
    proyecto: proyectos?.length > 0 ? proyectos[0]?.nombre : "",
    unidadId: ""
  });
  const [unidadesDisponibles, setUnidadesDisponibles] = useState([]);
  const [tiempo, setTiempo] = useState(5);

  // Cargar proyectos iniciales
  useEffect(() => {
    if (proyectos?.length > 0 && !inputs.proyecto) {
      setInputs(prev => ({ ...prev, proyecto: proyectos[0]?.nombre }));
    }
  }, [proyectos]);

  // Cargar unidades disponibles cuando se selecciona un proyecto
  useEffect(() => {
    const cargarUnidades = async () => {
      if (inputs.proyecto) {
        try {
          const response = await axios.get(`/api/unidades?proyecto=${inputs.proyecto}`);
          setUnidadesDisponibles(response.data.unidades);
          
          // Seleccionar la primera unidad por defecto si hay unidades disponibles
          if (response.data.unidades.length > 0) {
            setInputs(prev => ({ ...prev, unidadId: response.data.unidades[0].id }));
          } else {
            setInputs(prev => ({ ...prev, unidadId: "" }));
          }
        } catch (error) {
          console.error("Error al cargar unidades:", error);
          setUnidadesDisponibles([]);
        }
      }
    };
    
    cargarUnidades();
  }, [inputs.proyecto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const handleTiempoChange = (e) => {
    const value = parseInt(e.target.value);
    // Limitar el valor a un máximo de 10 años
    setTiempo(value > 10 ? 10 : value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const unidadSeleccionada = unidadesDisponibles.find(u => u.id === parseInt(inputs.unidadId));
    
    if (!unidadSeleccionada) {
      alert("Por favor selecciona una unidad disponible");
      return;
    }
    
    onCalcular({
      proyecto: inputs.proyecto,
      unidad_id: parseInt(inputs.unidadId),
      tiempo: tiempo,
      precio: unidadSeleccionada.precio,
      superficie: unidadSeleccionada.superficie,
      enganche: unidadSeleccionada.enganche
    });
  };

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <div className="form-group">
        <label>Proyecto Inmobiliario:</label>
        <select
          name="proyecto"
          value={inputs.proyecto}
          onChange={handleChange}
          className="form-control"
        >
          {proyectos?.map((proyecto, index) => (
            <option key={index} value={proyecto.nombre}>
              {proyecto.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Departamentos Disponibles:</label>
        <select
          name="unidadId"
          value={inputs.unidadId}
          onChange={handleChange}
          className="form-control"
          disabled={unidadesDisponibles.length === 0}
        >
          {unidadesDisponibles.length === 0 ? (
            <option value="">No hay unidades disponibles</option>
          ) : (
            unidadesDisponibles.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                Superficie: {unidad.superficie} m², Precio: ${unidad.precio.toLocaleString('en-US', {maximumFractionDigits: 2})}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="form-group">
        <label>Tiempo (años):</label>
        <input
          name="tiempo"
          type="number"
          min="1"
          max="10"
          value={tiempo}
          onChange={handleTiempoChange}
          className="form-control"
        />
      </div>

      <button 
        type="submit" 
        className="btn-submit" 
        disabled={!inputs.unidadId}
      >
        Calcular
      </button>
    </form>
  );
}

export default InputForm;