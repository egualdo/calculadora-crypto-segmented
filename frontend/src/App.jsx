import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { api } from './api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const currencyOptions = ['VES', 'USDT', 'USD', 'EUR'];
const rateTypeOptions = [
  { value: 'p2p_sell', label: 'USDT Venta P2P' },
  { value: 'p2p_buy', label: 'USDT Compra P2P' },
  { value: 'official', label: 'Dólar Oficial' },
  { value: 'euro', label: 'Euro' },
];

function App() {
  const [rates, setRates] = useState([]);
  const [history, setHistory] = useState(null);
  const [form, setForm] = useState({ amount: 1, from_currency: 'VES', to_currency: 'USDT', rate_type: 'p2p_sell' });
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: null });

  useEffect(() => {
    loadRates();
    loadHistory();
  }, []);

  async function loadRates() {
    try {
      const response = await api.get('/rates');
    //   console.log('Tasas obtenidas del backend:', response.data);
      setRates(response.data);
    } catch (error) {
      setStatus({ loading: false, error: 'No se pudieron cargar las tasas.' });
    }
  }

  async function loadHistory() {
    try {
      const response = await api.get('/historical-rates');
      setHistory(response.data);
    } catch (error) {
      setStatus({ loading: false, error: 'No se pudieron cargar los datos históricos.' });
    }
  }

  const averageDollarRate = useMemo(() => {
    const official = rates.find((rate) => rate.type === 'official');
    const p2pSell = rates.find((rate) => rate.type === 'p2p_sell');

    if (!official || !p2pSell) {
      return null;
    }

    return ((official.average_price + p2pSell.average_price) / 2).toFixed(2);
  }, [rates]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'amount' ? Number(value) : value }));
  };

  const handleCalculate = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });

    try {
      const response = await api.post('/calculate', form);
      setResult(response.data);
    } catch (error) {
      setStatus({ loading: false, error: 'Error al calcular la conversión.' });
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  };

  const chartData = history
    ? {
        labels: history.labels,
        datasets: history.datasets,
      }
    : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Crypto Calculator</h1>
          <p>React frontend con NestJS backend. Consume las rutas /api/rates y /api/historical-rates.</p>
        </div>
        <div className="badge">Backend API en <code>{import.meta.env.VITE_API_URL || '/api'}</code></div>
      </header>

      {status.error && <div className="alert">{status.error}</div>}

      <section className="grid-4">
        <article className="card highlight">
          <h2>Promedio del Dólar</h2>
          <strong>{averageDollarRate ? `${averageDollarRate} VES` : 'Cargando...'}</strong>
          <p>Promedio entre Dólar Oficial y USDT P2P Venta.</p>
        </article>

        {rates.map((rate) => (
          <article key={rate.type} className="card">
            <h2>{rate.currency_pair}</h2>
            <strong>{rate.average_price.toLocaleString('es-VE', { maximumFractionDigits: 2 })} VES</strong>
            <p>{rate.type}</p>
            <small>Última actualización: {new Date(rate.last_updated).toLocaleString('es-VE')}</small>
          </article>
        ))}
      </section>

      <section className="section-card">
        <div className="section-header">
          <h2>Calculadora de conversiones</h2>
          <p>Selecciona moneda, destino y tipo de tasa para obtener una conversión precisa.</p>
        </div>

        <form className="form-grid" onSubmit={handleCalculate}>
          <label>
            Monto
            <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} required />
          </label>

          <label>
            De
            <select name="from_currency" value={form.from_currency} onChange={handleChange}>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label>
            A
            <select name="to_currency" value={form.to_currency} onChange={handleChange}>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tasa
            <select name="rate_type" value={form.rate_type} onChange={handleChange}>
              {rateTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="button" disabled={status.loading}>
            {status.loading ? 'Calculando...' : 'Calcular'}
          </button>
        </form>

        {result && (
          <div className="result-card">
            <p>
              <strong>{result.amount}</strong> {result.from_currency} = <strong>{result.result.toFixed(2)}</strong> {result.to_currency}
            </p>
            <p>Tasa usada: {result.rate_type} ({result.rate} VES)</p>
          </div>
        )}
      </section>

      {chartData && (
        <section className="section-card">
          <div className="section-header">
            <h2>Histórico de cotizaciones</h2>
            <p>Los datos históricos se obtienen desde el backend NestJS.</p>
          </div>
          <div className="chart-wrapper">
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Cotizaciones históricas' } } }} />
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
