import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import '../style/ClientInventory.css'; // Use the new CSS file
import ClientNavbar from './dashboard/ClientNavbar';

export default function ClientInventory() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulRows, setSimulRows] = useState([]);
  const [days, setDays] = useState(7);
  const [newLine, setNewLine] = useState({
    productId: '',
    currentStock: 0,
    dailyUsage: 0,
    reorderPoint: 0,
    reorderQty: 0,
    autoOrder: true,
  });
  const token = useMemo(() => localStorage.getItem('token'), []);

  const axiosAuth = useMemo(() => {
    return axios.create({
      baseURL: 'http://localhost:5000',
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [token]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const invPromise = axiosAuth.get('/api/client-inventory');
        const myProdsPromise = axiosAuth.get('/api/orders/my-products');
        const [invRes, myProdsRes] = await Promise.all([invPromise, myProdsPromise]);
        setItems(Array.isArray(invRes.data) ? invRes.data : []);
        let prods = Array.isArray(myProdsRes.data) ? myProdsRes.data : [];
        if (!prods.length) {
          const pub = await axiosAuth.get('/api/products/public');
          prods = Array.isArray(pub.data) ? pub.data : [];
        }
        setProducts(prods);
      } catch (e) {
        console.error(e);
        alert('Erreur chargement inventaire/produits.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [axiosAuth]);

  const upsertLine = async () => {
    if (!newLine.productId) {
      alert('Choisissez un produit.');
      return;
    }
    try {
      setLoading(true);
      const body = {
        productId: newLine.productId,
        currentStock: Number(newLine.currentStock || 0),
        dailyUsage: Number(newLine.dailyUsage || 0),
        reorderPoint: Number(newLine.reorderPoint || 0),
        reorderQty: Number(newLine.reorderQty || 0),
        autoOrder: { enabled: !!newLine.autoOrder }
      };
      const { data } = await axiosAuth.post('/api/client-inventory/upsert', body);
      setItems(prev => {
        const idx = prev.findIndex(x => x.product?._id === data.product || x._id === data._id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = {
            ...data,
            product: clone[idx].product || (products.find(p => p._id === newLine.productId) ?? null),
          };
          return clone;
        }
        return [...prev, { ...data, product: products.find(p => p._id === newLine.productId) || null }];
      });
      setNewLine({
        productId: '',
        currentStock: 0,
        dailyUsage: 0,
        reorderPoint: 0,
        reorderQty: 0,
        autoOrder: true,
      });
    } catch (e) {
      console.error(e);
      alert('Erreur enregistrement de la ligne.');
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (inventoryId, delta) => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.patch(`/api/client-inventory/${inventoryId}/adjust`, { delta });
      setItems(prev => prev.map(x => (x._id === data._id ? data : x)));
    } catch (e) {
      console.error(e);
      alert('Erreur ajustement stock.');
    } finally {
      setLoading(false);
    }
  };

  const updateFieldLocal = (inventoryId, field, value) => {
    setItems(prev => prev.map(x => (x._id === inventoryId ? { ...x, [field]: value } : x)));
  };

  const saveRow = async (row) => {
    try {
      setLoading(true);
      const body = {
        productId: row.product?._id || row.product,
        currentStock: Number(row.currentStock || 0),
        dailyUsage: Number(row.dailyUsage || 0),
        reorderPoint: Number(row.reorderPoint || 0),
        reorderQty: Number(row.reorderQty || 0),
        autoOrder: { enabled: !!(row.autoOrder?.enabled ?? row.autoOrder) }
      };
      const { data } = await axiosAuth.post('/api/client-inventory/upsert', body);
      setItems(prev => prev.map(x => (x._id === row._id ? { ...data, product: row.product } : x)));
    } catch (e) {
      console.error(e);
      alert('Erreur sauvegarde ligne.');
    } finally {
      setLoading(false);
    }
  };

  const simulate = async () => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.get('/api/client-inventory/simulate-consumption', { params: { days } });
      setSimulRows(data || []);
    } catch (e) {
      console.error(e);
      alert('Erreur simulation.');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoOrder = async () => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.post('/api/payments/automatic-order');
      alert(data.message);
      // Refresh inventory data after order
      const invRes = await axiosAuth.get('/api/client-inventory');
      setItems(Array.isArray(invRes.data) ? invRes.data : []);
    } catch (e) {
      console.error(e);
      const errorMessage = e.response?.data?.message || 'Erreur lors du déclenchement de la commande automatique.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inventory-container">
      <ClientNavbar />
      <header className="inventory-header">
        <h1 className="title">Gestion de l'Inventaire</h1>
      </header>

      <div className="card">
        <h2 className="card-header">Ajouter ou Mettre à Jour un Produit</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Produit</label>
            <select
              value={newLine.productId}
              onChange={e => setNewLine(s => ({ ...s, productId: e.target.value }))}
              className="field-select"
            >
              <option value="">— Sélectionner —</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.reference ? `(${p.reference})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Stock Courant</label>
            <input
              type="number"
              min="0"
              value={newLine.currentStock}
              onChange={e => setNewLine(s => ({ ...s, currentStock: e.target.value }))}
              className="field-input"
            />
          </div>
          <div className="form-group">
            <label>Consommation/Jour</label>
            <input
              type="number"
              min="0"
              value={newLine.dailyUsage}
              onChange={e => setNewLine(s => ({ ...s, dailyUsage: e.target.value }))}
              className="field-input"
            />
          </div>
          <div className="form-group">
            <label>Seuil de Réapprovisionnement</label>
            <input
              type="number"
              min="0"
              value={newLine.reorderPoint}
              onChange={e => setNewLine(s => ({ ...s, reorderPoint: e.target.value }))}
              className="field-input"
            />
          </div>
          <div className="form-group">
            <label>Quantité de Commande Auto</label>
            <input
              type="number"
              min="0"
              value={newLine.reorderQty}
              onChange={e => setNewLine(s => ({ ...s, reorderQty: e.target.value }))}
              className="field-input"
            />
          </div>
          <div className="checkbox-group">
            <input
              id="autoOrder"
              type="checkbox"
              checked={!!newLine.autoOrder}
              onChange={e => setNewLine(s => ({ ...s, autoOrder: e.target.checked }))}
            />
            <label htmlFor="autoOrder">Commande Auto Activée</label>
          </div>
        </div>
        <button onClick={upsertLine} className="submit-button" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer/Mettre à jour'}
        </button>
      </div>

      <div className="card">
        <div className="simulation-controls">
          <h2 className="card-header" style={{ border: 'none', padding: 0, margin: 0 }}>Mon Inventaire</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number"
              min="1"
              value={days}
              onChange={e => setDays(e.target.value)}
              className="field-input"
            />
            <button className="action-button info" onClick={simulate} disabled={loading}>
              {loading ? 'Simulation...' : `Simuler ${days} jours`}
            </button>
            <button className="action-button success" onClick={triggerAutoOrder} disabled={loading}>
              {loading ? 'Vérification...' : 'Lancer la Commande Auto'}
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock</th>
                <th>Conso/Jour</th>
                <th>Seuil Mini</th>
                <th>Qté Auto</th>
                <th>Auto</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!items.length ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Aucun produit dans l'inventaire</td></tr>
              ) : items.map(row => (
                <tr key={row._id}>
                  <td>
                    <strong>{row.product?.name || '—'}</strong>
                    <br />
                    <small>{row.product?.reference || ''}</small>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={row.currentStock ?? 0}
                      onChange={e => updateFieldLocal(row._id, 'currentStock', Number(e.target.value))}
                      className="field-input"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={row.dailyUsage ?? 0}
                      onChange={e => updateFieldLocal(row._id, 'dailyUsage', Number(e.target.value))}
                      className="field-input"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={row.reorderPoint ?? 0}
                      onChange={e => updateFieldLocal(row._id, 'reorderPoint', Number(e.target.value))}
                      className="field-input"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={row.reorderQty ?? 0}
                      onChange={e => updateFieldLocal(row._id, 'reorderQty', Number(e.target.value))}
                      className="field-input"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!(row.autoOrder?.enabled ?? row.autoOrder)}
                      onChange={e => updateFieldLocal(row._id, 'autoOrder', { enabled: e.target.checked })}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="action-button edit" onClick={() => saveRow(row)} disabled={loading}>Sauver</button>
                      <button className="action-button stock" onClick={() => adjustStock(row._id, +1)} disabled={loading}>+1</button>
                      <button className="action-button delete" onClick={() => adjustStock(row._id, -1)} disabled={loading}>-1</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!!simulRows.length && (
          <div className="simulation-results" style={{ marginTop: '20px' }}>
            <h3 className="card-header">Résultats de la Simulation ({days} jours)</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Stock Actuel</th>
                    <th>Conso/Jour</th>
                    <th>Stock Prévu</th>
                    <th>Seuil Mini</th>
                    <th>Alerte</th>
                  </tr>
                </thead>
                <tbody>
                  {simulRows.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.product?.name || '—'}</td>
                      <td>{r.currentStock}</td>
                      <td>{r.dailyUsage}</td>
                      <td>{r.projectedStock}</td>
                      <td>{r.product?.reorderPoint ?? '—'}</td>
                      <td style={{ color: r.hitsReorder ? '#dc3545' : '#28a745', fontWeight: '600' }}>
                        {r.hitsReorder ? 'Sous le seuil → Commande auto' : 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {loading && <div className="loading-indicator">Chargement...</div>}
    </div>
  );
}
