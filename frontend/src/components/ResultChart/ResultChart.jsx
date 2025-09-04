import React from "react";
import './ResultChart.scss';
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

function ResultChart({ data }) {
  // Preparar datos para la gráfica
  const labels = data.valores.map((item) => `Año ${item.año}`);
  
  // Dataset para inversión inmobiliaria (proyecto seleccionado)
  const inmobiliariaDataset = {
    label: `${data.proyecto_seleccionado} (Inversión Inmobiliaria)`,
    data: data.valores.map(item => item.valor),
    borderColor: "blue",
    backgroundColor: "rgba(0, 0, 255, 0.2)",
    tension: 0.3,
  };
  
  const chartData = {
    labels: labels,
    datasets: [inmobiliariaDataset],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Evolución de la inversión en ${data.proyecto_seleccionado}`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.raw.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Valor ($)'
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString('en-US', {maximumFractionDigits: 2});
          }
        }
      }
    }
  };

  // Calcular el enganche (25% del precio)
  const enganchemonto = data.inputs.precio * data.inputs.enganche;

  return (
    <div className="results-container">
      <div className="project-info">
        <h3>Datos del Proyecto Seleccionado: {data.proyecto_seleccionado}</h3>
        <div className="project-details">
          <p><strong>Superficie del departamento:</strong> {data.inputs.superficie} m²</p>
          <p><strong>Precio total:</strong> ${data.inputs.precio.toLocaleString('en-US', {maximumFractionDigits: 2})}</p>
          <p><strong>Tiempo:</strong> {data.inputs.tiempo} años</p>
          <p><strong>Valor final estimado:</strong> ${data.valores[data.valores.length - 1].valor.toLocaleString('en-US', {maximumFractionDigits: 2})}</p>
        </div>
      </div>

      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>

      <div className="investment-summary">
        <h3>Resumen de la Inversión</h3>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Enganche inicial (25%)</th>
              <th>Precio total</th>
              <th>Valor final</th>
              <th>Plusvalía</th>
              <th>Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.proyecto_seleccionado}</td>
              <td>${enganchemonto.toLocaleString('en-US', {maximumFractionDigits: 2})}</td>
              <td>${data.inputs.precio.toLocaleString('en-US', {maximumFractionDigits: 2})}</td>
              <td>${data.valores[data.valores.length - 1].valor.toLocaleString('en-US', {maximumFractionDigits: 2})}</td>
              <td>${(data.valores[data.valores.length - 1].valor - data.inputs.precio).toLocaleString('en-US', {maximumFractionDigits: 2})}</td>
              <td>{((data.valores[data.valores.length - 1].valor / data.inputs.precio - 1) * 100).toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultChart;