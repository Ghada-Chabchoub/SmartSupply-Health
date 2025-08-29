import React from 'react';


export default function CompetitorModal({ open, onClose, offers }) {
if (!open) return null;


return (
<div className="modal-overlay">
<div className="modal-content">
<h2>Résultats d’analyse concurrentielle</h2>
<button onClick={onClose} className="close-button">Fermer</button>
<div className="modal-body">
{offers.length === 0 ? (
<p>Aucune offre trouvée.</p>
) : (
offers.map((offer, index) => (
<div key={index} className="offer-item">
<p><strong>📌 {offer.title}</strong></p>
<p>🔗 <a href={offer.url} target="_blank" rel="noopener noreferrer">Lien</a></p>
<p>💶 Prix : {offer.price ? `${offer.price} €` : 'Non détecté'}</p>
<hr />
</div>
))
)}
</div>
</div>
</div>
);
}