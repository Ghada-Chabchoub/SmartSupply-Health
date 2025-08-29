import React from 'react';


export default function PriceSimulationModal({ open, onClose, data }) {
if (!open || !data) return null;


return (
<div className="modal-overlay">
<div className="modal-content">
<h2>Simulation de prix</h2>
<button onClick={onClose} className="close-button">Fermer</button>
<div className="modal-body">
<p>💡 Prix recommandé : <strong>{data.recommendedPrice} €</strong></p>
<p>📊 Médiane concurrents : {data.median} €</p>
<p>💸 Prix minimum : {data.min} €</p>
</div>
</div>
</div>
);
}