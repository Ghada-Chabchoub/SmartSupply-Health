import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import '../style/ClientInventory.css';
import ClientNavbar from './dashboard/ClientNavbar';

export default function ClientInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulRows, setSimulRows] = useState([]);
  const [days, setDays] = useState(7);
  const token = useMemo(() => localStorage.getItem('token'), []);

  const axiosAuth = useMemo(() => {
    return axios.create({
      baseURL: 'http://localhost:5000',
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [token]);

  // --- DATA FETCHING ---
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.get('/api/client-inventory');
      setInventory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Erreur lors du chargement de l\'inventaire.');
    } finally {
      setLoading(false);
    }
  }, [axiosAuth]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // --- ACTIONS ---

  // Met à jour l'état localement quand l'utilisateur tape
  const handleInputChange = (inventoryId, field, value) => {
    setInventory(prev =>
      prev.map(item => {
        if (item._id === inventoryId) {
          if (field === 'autoOrder') {
            return { ...item, autoOrder: { enabled: value } };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Enregistre les changements d'une ligne spécifique au backend
  const saveRowChanges = async (inventoryId) => {
    const itemToSave = inventory.find(item => item._id === inventoryId);
    if (!itemToSave) return;

    setLoading(true);
    try {
      const body = {
        dailyUsage: itemToSave.dailyUsage,
        reorderPoint: itemToSave.reorderPoint,
        reorderQty: itemToSave.reorderQty,
        autoOrder: { enabled: itemToSave.autoOrder?.enabled ?? false },
      };
      const { data } = await axiosAuth.put(`/api/client-inventory/${inventoryId}`, body);
      
      setInventory(prev => prev.map(item => (item._id === data._id ? data : item)));
      alert('Enregistrement réussi !');
    } catch (e) {
      console.error('Failed to save changes for item', inventoryId, e);
      alert('La sauvegarde a échoué.');
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (inventoryId, delta) => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.patch(`/api/client-inventory/${inventoryId}/adjust`, { delta });
      setInventory(prev => prev.map(x => (x._id === data._id ? data : x)));
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'ajustement du stock.');
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
      alert('Erreur de simulation.');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoOrder = async () => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.post('/api/payments/automatic-order');
      alert(data.message || 'Opération terminée.');
      fetchInventory(); // Refresh inventory data
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
        <p>Les produits apparaissent ici automatiquement après la livraison d\'une commande.</p>
      </header>

      <div className="card">
        <div className="simulation-controls">
          <h2 className="card-header">Mon Inventaire</h2>
          <div className="controls-group">
            <input
              type="number"
              min="1"
              value={days}
              onChange={e => setDays(e.target.value)}
              className="field-input"
              aria-label="Jours pour la simulation"
            />
            <button className="action-button info" onClick={simulate} disabled={loading}>
              Simuler {days} jours
            </button>
            <button className="action-button success" onClick={triggerAutoOrder} disabled={loading}>
              Vérifier Commande Auto
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock Actuel</th>
                <th>Conso/Jour</th>
                <th>Seuil Mini</th>
                <th>Qté Auto</th>
                <th>Auto</th>
                <th>Ajustement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!inventory.length ? (
                <tr><td colSpan="8" className="empty-state">Aucun produit dans l\'inventaire pour le moment.</td></tr>
              ) : inventory.map(item => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.product?.name || 'Produit inconnu'}</strong>
                    <br />
                    <small className="text-muted">{item.product?.reference || ''}</small>
                  </td>
                  <td>{item.currentStock ?? 0}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={item.dailyUsage ?? 0}
                      onChange={e => handleInputChange(item._id, 'dailyUsage', Number(e.target.value))}
                      className="field-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={item.reorderPoint ?? 0}
                      onChange={e => handleInputChange(item._id, 'reorderPoint', Number(e.target.value))}
                      className="field-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={item.reorderQty ?? 0}
                      onChange={e => handleInputChange(item._id, 'reorderQty', Number(e.target.value))}
                      className="field-input"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.autoOrder?.enabled ?? false}
                      onChange={e => handleInputChange(item._id, 'autoOrder', e.target.checked)}
                    />
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="action-button stock" onClick={() => adjustStock(item._id, 1)} disabled={loading}>+</button>
                      <button className="action-button delete" onClick={() => adjustStock(item._id, -1)} disabled={loading}>-</button>
                    </div>
                  </td>
                  <td>
                    <button className="action-button edit" onClick={() => saveRowChanges(item._id)} disabled={loading}>
                      Enregistrer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!!simulRows.length && (
          <div className="simulation-results">
            <h3 className="card-header">Résultats de la Simulation ({days} jours)</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Stock Actuel</th>
                    <th>Stock Prévu</th>
                    <th>Seuil Mini</th>
                    <th>Alerte</th>
                  </tr>
                </thead>
                <tbody>
                  {simulRows.map(r => (
                    <tr key={r._id}>
                      <td>{r.product?.name || '—'}</td>
                      <td>{r.currentStock}</td>
                      <td>{r.projectedStock}</td>
                      <td>{r.reorderPoint}</td>
                      <td className={r.hitsReorder ? 'alert-danger' : 'alert-success'}>
                        {r.hitsReorder ? 'Commande auto nécessaire' : 'OK'}
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
