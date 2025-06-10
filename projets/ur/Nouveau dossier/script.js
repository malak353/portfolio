
// Initialisation de la carte Leaflet
document.addEventListener('DOMContentLoaded', function() {
// Initialiser la carte
var map = L.map('map').setView([36.7538, 3.0588], 11);

// Couches de base
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
attribution: 'Imagery &copy; Esri'
});

var topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
});

// Gestion des couches de base
document.getElementById('base-osm').addEventListener('change', function() {
if(this.checked) {
map.removeLayer(satelliteLayer);
map.removeLayer(topoLayer);
map.addLayer(osmLayer);
}
});

document.getElementById('base-satellite').addEventListener('change', function() {
if(this.checked) {
map.removeLayer(osmLayer);
map.removeLayer(topoLayer);
map.addLayer(satelliteLayer);
}
});

document.getElementById('base-topo').addEventListener('change', function() {
if(this.checked) {
map.removeLayer(osmLayer);
map.removeLayer(satelliteLayer);
map.addLayer(topoLayer);
}
});

document.getElementById('base-hybrid').addEventListener('change', function() {
if(this.checked) {
// Pour l'effet hybride, on pourrait superposer des couches
map.addLayer(satelliteLayer);
// Ajouter une couche de labels ou routes semi-transparente
}
});

// Affichage des coordonnées
map.on('mousemove', function(e) {
document.getElementById('coordinates').textContent = 'Lon: ' + e.latlng.lng.toFixed(4) + ', Lat: ' + e.latlng.lat.toFixed(4);
});

// Gestion de la sidebar
document.getElementById('sidebar-toggle').addEventListener('click', function() {
document.getElementById('sidebar').classList.toggle('open');
this.classList.toggle('closed');
if (this.classList.contains('closed')) {
this.innerHTML = '<i class="fas fa-chevron-right"></i>';
} else {
this.innerHTML = '<i class="fas fa-chevron-left"></i>';
}
});

// Gestion des outils de carte
document.getElementById('zoom-in').addEventListener('click', function() {
map.zoomIn();
});

document.getElementById('zoom-out').addEventListener('click', function() {
map.zoomOut();
});

document.getElementById('reset-view').addEventListener('click', function() {
map.setView([36.7538, 3.0588], 11);
});

document.getElementById('locate').addEventListener('click', function() {
map.locate({setView: true, maxZoom: 16});
});

document.getElementById('toggle-fullscreen').addEventListener('click', function() {
if (!document.fullscreenElement) {
document.documentElement.requestFullscreen();
this.innerHTML = '<i class="fas fa-compress"></i>';
} else {
if (document.exitFullscreen) {
document.exitFullscreen();
this.innerHTML = '<i class="fas fa-expand"></i>';
}
}
});

// Fonctions API pour la recherche
function searchDocuments(query) {
showLoading();
fetch(`https://www.geoportail-urbanisme.gouv.fr/api/documents?q=${query}`)
.then(response => response.json())
.then(data => {
displayResults(data);
hideLoading();
})
.catch(error => {
console.error('Erreur:', error);
hideLoading();
alert('Erreur lors de la recherche. Veuillez réessayer.');
});
}

function displayResults(data) {
// Créer un modal de résultats si non existant
let resultsModal = document.getElementById('results-modal');
if (!resultsModal) {
resultsModal = document.createElement('div');
resultsModal.id = 'results-modal';
resultsModal.className = 'modal';

resultsModal.innerHTML = `
<div class="modal-content">
<span class="close-modal" id="close-results-modal"><i class="fas fa-times"></i></span>
<div class="modal-header">
<h2 class="modal-title">Résultats de recherche</h2>
</div>
<div class="modal-body">
<ul id="results-list" class="results-list"></ul>
</div>
<div class="modal-footer">
<button class="modal-button" id="close-results-btn">Fermer</button>
</div>
</div>
`;

document.body.appendChild(resultsModal);

document.getElementById('close-results-modal').addEventListener('click', function() {
resultsModal.style.display = 'none';
});

document.getElementById('close-results-btn').addEventListener('click', function() {
resultsModal.style.display = 'none';
});
}

const resultsList = document.getElementById('results-list');
resultsList.innerHTML = '';

if (data.length === 0) {
resultsList.innerHTML = '<li>Aucun résultat trouvé.</li>';
} else {
data.forEach(document => {
const li = document.createElement('li');
li.className = 'result-item';
li.innerHTML = `
<h3>${document.title || 'Document sans titre'}</h3>
<p>${document.description || 'Pas de description disponible'}</p>
<button class="popup-button view-document" data-id="${document.id}">Voir le document</button>
`;
resultsList.appendChild(li);

// Ajouter un écouteur pour le bouton "Voir le document"
li.querySelector('.view-document').addEventListener('click', function() {
const docId = this.getAttribute('data-id');
viewDocument(docId);
});
});
}

// Afficher le modal
resultsModal.style.display = 'flex';
}

function viewDocument(docId) {
showLoading();
fetch(`https://www.geoportail-urbanisme.gouv.fr/api/documents/${docId}`)
.then(response => response.json())
.then(data => {
// Afficher les détails du document et/ou ajouter une couche à la carte
if (data.geometry) {
const geoJSON = L.geoJSON(data.geometry, {
style: {
    color: '#16a085',
    weight: 2,
    opacity: 0.7,
    fillOpacity: 0.4
}
}).addTo(map);

map.fitBounds(geoJSON.getBounds());
}

// Créer une popup avec les informations du document
const popup = L.popup()
.setLatLng(map.getCenter())
.setContent(`
<div class="custom-popup">
    <div class="popup-header">
        <div class="popup-title">${data.title || 'Document sans titre'}</div>
    </div>
    <div class="popup-content">
        <p>${data.description || 'Pas de description disponible'}</p>
        <p><strong>Type:</strong> ${data.type || 'Non spécifié'}</p>
        <p><strong>Date:</strong> ${data.date || 'Non spécifiée'}</p>
    </div>
    <div class="popup-footer">
        <button class="popup-button" onclick="window.open('${data.url}', '_blank')">Télécharger</button>
    </div>
</div>
`)
.openOn(map);

hideLoading();
})
.catch(error => {
console.error('Erreur:', error);
hideLoading();
alert('Erreur lors du chargement du document. Veuillez réessayer.');
});
}

function searchByGeometry(coords) {
showLoading();
fetch(`https://apicarto.ign.fr/api/gpu/search?geom={"type":"Point","coordinates":[${coords.lng},${coords.lat}]}`)
.then(response => response.json())
.then(data => {
if (data.features && data.features.length > 0) {
// Afficher les résultats sur la carte ou dans un modal
const resultsData = data.features.map(feature => ({
id: feature.properties.id || 'unknown',
title: feature.properties.name || 'Document sans nom',
description: feature.properties.description || 'Pas de description disponible',
type: feature.properties.type || 'Non spécifié'
}));

displayResults(resultsData);
} else {
alert('Aucun document trouvé à cet emplacement.');
}
hideLoading();
})
.catch(error => {
console.error('Erreur:', error);
hideLoading();
alert('Erreur lors de la recherche. Veuillez réessayer.');
});
}

// Ajouter la fonctionnalité de clic sur la carte pour rechercher par géométrie
map.on('click', function(e) {
if (document.getElementById('measure-tool').classList.contains('active') || 
document.getElementById('draw-tool').classList.contains('active')) {
return; // Ne pas rechercher si on est en mode mesure ou dessin
}

searchByGeometry(e.latlng);
});

// Connecter la barre de recherche
const searchInput = document.querySelector('.search-container input');
searchInput.addEventListener('keypress', function(e) {
if (e.key === 'Enter') {
const query = this.value.trim();
if (query) {
searchDocuments(query);
}
}
});

// Gestion des modaux
function showModal(modalId) {
document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
document.getElementById(modalId).style.display = 'none';
}

// Boutons d'en-tête
document.getElementById('api-btn').addEventListener('click', function(e) {
e.preventDefault();
showModal('api-modal');
});

document.getElementById('help-btn').addEventListener('click', function(e) {
e.preventDefault();
showModal('help-modal');
});

// Fermeture des modaux
document.getElementById('close-api-modal').addEventListener('click', function() {
hideModal('api-modal');
});

document.getElementById('close-help-modal').addEventListener('click', function() {
hideModal('help-modal');
});

document.getElementById('close-api-btn').addEventListener('click', function() {
hideModal('api-modal');
});

// Boutons du panneau de contrôle
document.getElementById('download-btn').addEventListener('click', function() {
alert('Fonctionnalité de téléchargement en cours de développement.');
});

document.getElementById('print-btn').addEventListener('click', function() {
window.print();
});

document.getElementById('share-btn').addEventListener('click', function() {
// Créer une URL de partage avec les coordonnées et le niveau de zoom actuels
const center = map.getCenter();
const zoom = map.getZoom();
const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${center.lat.toFixed(6)}&lng=${center.lng.toFixed(6)}&z=${zoom}`;

// Créer un élément input temporaire pour copier l'URL
const tempInput = document.createElement('input');
tempInput.value = shareUrl;
document.body.appendChild(tempInput);
tempInput.select();
document.execCommand('copy');
document.body.removeChild(tempInput);

alert('Lien de partage copié dans le presse-papiers!');
});

document.getElementById('measure-btn').addEventListener('click', function() {
document.getElementById('measure-tool').click();
});

document.getElementById('clear-btn').addEventListener('click', function() {
// Supprimer toutes les couches de dessin et de mesure
map.eachLayer(function(layer) {
if (layer !== osmLayer && layer !== satelliteLayer && layer !== topoLayer) {
map.removeLayer(layer);
}
});
});

document.getElementById('api-docs-btn').addEventListener('click', function() {
showModal('api-modal');
});

// Fonctions utilitaires
function showLoading() {
document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
document.getElementById('loading').style.display = 'none';
}

// Gestion des outils de mesure et de dessin
document.getElementById('measure-tool').addEventListener('click', function() {
this.classList.toggle('active');
if (this.classList.contains('active')) {
// Activer l'outil de mesure
alert('Outil de mesure activé. Cliquez sur la carte pour commencer à mesurer.');
// Ici, il faudrait implémenter la logique de mesure
// avec une bibliothèque comme Leaflet.Draw
} else {
// Désactiver l'outil de mesure
alert('Outil de mesure désactivé.');
}
});

document.getElementById('draw-tool').addEventListener('click', function() {
this.classList.toggle('active');
if (this.classList.contains('active')) {
// Activer l'outil de dessin
alert('Outil de dessin activé. Cliquez sur la carte pour commencer à dessiner.');
// Ici, il faudrait implémenter la logique de dessin
// avec une bibliothèque comme Leaflet.Draw
} else {
// Désactiver l'outil de dessin
alert('Outil de dessin désactivé.');
}
});

// Vérifier les paramètres d'URL au chargement
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('lat') && urlParams.has('lng') && urlParams.has('z')) {
const lat = parseFloat(urlParams.get('lat'));
const lng = parseFloat(urlParams.get('lng'));
const zoom = parseInt(urlParams.get('z'));

if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
map.setView([lat, lng], zoom);
}
}
});

// Fonction pour ajouter une recherche avancée
function setupAdvancedSearch() {
// Créer un modal de recherche avancée
const advancedSearchModal = document.createElement('div');
advancedSearchModal.id = 'advanced-search-modal';
advancedSearchModal.className = 'modal';

advancedSearchModal.innerHTML = `
<div class="modal-content">
<span class="close-modal" id="close-advanced-search-modal"><i class="fas fa-times"></i></span>
<div class="modal-header">
<h2 class="modal-title">Recherche avancée</h2>
</div>
<div class="modal-body">
<div style="margin-bottom: 15px;">
<label for="document-type" style="display: block; margin-bottom: 5px;">Type de document</label>
<select id="document-type" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
<option value="">Tous les types</option>
<option value="PLU">Plan Local d'Urbanisme (PLU)</option>
<option value="POS">Plan d'Occupation des Sols (POS)</option>
<option value="CC">Carte Communale</option>
<option value="PDAU">PDAU</option>
<option value="PPR">Plan de Prévention des Risques (PPR)</option>
</select>
</div>

<div style="margin-bottom: 15px;">
<label for="date-filter" style="display: block; margin-bottom: 5px;">Date (après)</label>
<input type="date" id="date-filter" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
</div>

<div style="margin-bottom: 15px;">
<label for="region-filter" style="display: block; margin-bottom: 5px;">Région/Wilaya</label>
<input type="text" id="region-filter" placeholder="Nom de la wilaya" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
</div>
</div>
<div class="modal-footer">
<button class="modal-button" id="advanced-search-btn">Rechercher</button>
<button class="modal-button" id="close-advanced-search-btn">Annuler</button>
</div>
</div>
`;

document.body.appendChild(advancedSearchModal);

// Ajouter un bouton pour ouvrir la recherche avancée
const searchInput = document.querySelector('.search-container input');
const searchContainer = document.querySelector('.search-container');

const advancedButton = document.createElement('button');
advancedButton.innerHTML = '<i class="fas fa-cog"></i>';
advancedButton.style.position = 'absolute';
advancedButton.style.right = '10px';
advancedButton.style.top = '50%';
advancedButton.style.transform = 'translateY(-50%)';
advancedButton.style.background = 'none';
advancedButton.style.border = 'none';
advancedButton.style.color = '#777';
advancedButton.style.cursor = 'pointer';
advancedButton.title = 'Recherche avancée';

searchContainer.style.position = 'relative';
searchContainer.appendChild(advancedButton);

// Écouteurs d'événements
advancedButton.addEventListener('click', function() {
document.getElementById('advanced-search-modal').style.display = 'flex';
});

document.getElementById('close-advanced-search-modal').addEventListener('click', function() {
document.getElementById('advanced-search-modal').style.display = 'none';
});

document.getElementById('close-advanced-search-btn').addEventListener('click', function() {
document.getElementById('advanced-search-modal').style.display = 'none';
});

document.getElementById('advanced-search-btn').addEventListener('click', function() {
const documentType = document.getElementById('document-type').value;
const date = document.getElementById('date-filter').value;
const region = document.getElementById('region-filter').value;

let query = '';
if (documentType) query += `type=${documentType}&`;
if (date) query += `date=${date}&`;
if (region) query += `region=${region}`;

// Appeler la fonction searchDocuments avec les paramètres
window.searchDocuments(query);

// Fermer le modal
document.getElementById('advanced-search-modal').style.display = 'none';
});
}

// Ajouter la recherche avancée lorsque le document est chargé
document.addEventListener('DOMContentLoaded', setupAdvancedSearch);
// Déclarer searchDocuments dans le scope global
window.searchDocuments = function(query) {
showLoading();
fetch(`https://api.geoportail-urbanisme.dz/api/documents?q=${query}`)
.then(response => response.json())
.then(data => {
displayResults(data);
hideLoading();
})
.catch(error => {
console.error('Erreur:', error);
hideLoading();
// Simuler des résultats pour la démonstration en cas d'erreur API
const mockData = [
{
id: 'doc1',
title: 'PLU Alger Centre',
description: 'Plan Local d\'Urbanisme - Centre d\'Alger',
type: 'PLU',
date: '2022-05-15'
},
{
id: 'doc2',
title: 'PDAU Wilaya d\'Alger',
description: 'Plan Directeur d\'Aménagement et d\'Urbanisme de la Wilaya d\'Alger',
type: 'PDAU',
date: '2021-09-20'
}
];
displayResults(mockData);
});
};

// Connecter la barre de recherche principale
document.querySelector('.search-container input').addEventListener('keypress', function(e) {
if (e.key === 'Enter') {
const query = this.value.trim();
if (query) {
window.searchDocuments(query);
}
}
});

// Ajouter les gestionnaires d'événements pour les couches d'urbanisme
document.getElementById('layer-plu').addEventListener('change', function() {
toggleUrbanismLayer('plu', this.checked);
});

document.getElementById('layer-pos').addEventListener('change', function() {
toggleUrbanismLayer('pos', this.checked);
});

document.getElementById('layer-cc').addEventListener('change', function() {
toggleUrbanismLayer('cc', this.checked);
});

document.getElementById('layer-pdau').addEventListener('change', function() {
toggleUrbanismLayer('pdau', this.checked);
});

document.getElementById('layer-ppmr').addEventListener('change', function() {
toggleUrbanismLayer('ppmr', this.checked);
});

// Fonction pour afficher/masquer les couches d'urbanisme
function toggleUrbanismLayer(layerType, isVisible) {
// Supprimer la couche existante si présente
map.eachLayer(function(layer) {
if (layer._urbanismType === layerType) {
map.removeLayer(layer);
}
});

if (isVisible) {
showLoading();

// Simuler un chargement de données GeoJSON
setTimeout(function() {
// Créer des données GeoJSON de démonstration selon le type de couche
let geojsonData;
let layerStyle;

switch(layerType) {
case 'plu':
geojsonData = createMockGeoJSON([36.7538, 3.0588], 'PLU', '#e74c3c');
layerStyle = { color: '#e74c3c', weight: 2, opacity: 0.7, fillOpacity: 0.4 };
break;
case 'pos':
geojsonData = createMockGeoJSON([36.7638, 3.0488], 'POS', '#3498db');
layerStyle = { color: '#3498db', weight: 2, opacity: 0.7, fillOpacity: 0.4 };
break;
case 'cc':
geojsonData = createMockGeoJSON([36.7438, 3.0688], 'CC', '#2ecc71');
layerStyle = { color: '#2ecc71', weight: 2, opacity: 0.7, fillOpacity: 0.4 };
break;
case 'pdau':
geojsonData = createMockGeoJSON([36.7738, 3.0388], 'PDAU', '#f1c40f');
layerStyle = { color: '#f1c40f', weight: 2, opacity: 0.7, fillOpacity: 0.4 };
break;
case 'ppmr':
geojsonData = createMockGeoJSON([36.7338, 3.0788], 'PPR', '#e67e22');
layerStyle = { color: '#e67e22', weight: 2, opacity: 0.7, fillOpacity: 0.4 };
break;
}

// Créer et ajouter la couche GeoJSON
const geoJSONLayer = L.geoJSON(geojsonData, {
style: layerStyle,
onEachFeature: function(feature, layer) {
layer.bindPopup(`
<div class="custom-popup">
    <div class="popup-header">
        <div class="popup-title">${feature.properties.title}</div>
    </div>
    <div class="popup-content">
        <p>${feature.properties.description}</p>
        <p><strong>Type:</strong> ${feature.properties.type}</p>
        <p><strong>Date:</strong> ${feature.properties.date}</p>
    </div>
    <div class="popup-footer">
        <button class="popup-button" onclick="viewDocumentDetails('${feature.properties.id}')">Détails</button>
    </div>
</div>
`);
}
}).addTo(map);

// Marquer cette couche avec son type pour pouvoir la retrouver
geoJSONLayer._urbanismType = layerType;

hideLoading();
}, 1000);
}
}

// Fonction pour créer des données GeoJSON de démonstration
function createMockGeoJSON(center, layerType, color) {
// Créer une géométrie polygonale aléatoire autour d'un point central
const points = 6;
const radius = 0.01 + Math.random() * 0.02; // Entre 0.01 et 0.03 degrés

const coordinates = [];
for (let i = 0; i < points; i++) {
const angle = (i / points) * Math.PI * 2;
const dx = Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
const dy = Math.sin(angle) * radius * (0.8 + Math.random() * 0.4);
coordinates.push([center[1] + dx, center[0] + dy]);
}
coordinates.push(coordinates[0]); // Fermer le polygone

// Créer un objet GeoJSON
return {
type: "FeatureCollection",
features: [{
type: "Feature",
properties: {
id: "mock-" + layerType + "-" + Math.floor(Math.random() * 1000),
title: "Zone " + layerType + " " + Math.floor(Math.random() * 100),
description: "Description de la zone " + layerType,
type: layerType,
date: "2023-" + (Math.floor(Math.random() * 12) + 1) + "-" + (Math.floor(Math.random() * 28) + 1)
},
geometry: {
type: "Polygon",
coordinates: [coordinates]
}
}]
};
}

// Fonction pour afficher les détails d'un document
window.viewDocumentDetails = function(documentId) {
showLoading();

// Simuler un chargement de données
setTimeout(function() {
// Créer une modal pour afficher les détails du document
let documentModal = document.getElementById('document-details-modal');
if (!documentModal) {
documentModal = document.createElement('div');
documentModal.id = 'document-details-modal';
documentModal.className = 'modal';

documentModal.innerHTML = `
<div class="modal-content" style="max-width: 800px;">
<span class="close-modal" id="close-document-modal"><i class="fas fa-times"></i></span>
<div class="modal-header">
<h2 class="modal-title" id="document-title">Détails du document</h2>
</div>
<div class="modal-body" id="document-details">
<div class="document-info">
    <h3>Informations générales</h3>
    <p><strong>Type:</strong> <span id="doc-type"></span></p>
    <p><strong>Date d'approbation:</strong> <span id="doc-date"></span></p>
    <p><strong>Commune:</strong> <span id="doc-commune"></span></p>
    <p><strong>Superficie:</strong> <span id="doc-area"></span></p>
</div>
<div class="document-description">
    <h3>Description</h3>
    <p id="doc-description"></p>
</div>
<div class="document-attachments">
    <h3>Pièces jointes</h3>
    <ul id="doc-attachments" class="attachment-list">
        <li><a href="#" class="attachment-link">Règlement d'urbanisme <i class="fas fa-file-pdf"></i></a></li>
        <li><a href="#" class="attachment-link">Plan de zonage <i class="fas fa-file-image"></i></a></li>
        <li><a href="#" class="attachment-link">Annexes <i class="fas fa-file-archive"></i></a></li>
    </ul>
</div>
</div>
<div class="modal-footer">
<button class="modal-button" id="download-document-btn">Télécharger</button>
<button class="modal-button" id="close-document-btn">Fermer</button>
</div>
</div>
`;

document.body.appendChild(documentModal);

document.getElementById('close-document-modal').addEventListener('click', function() {
documentModal.style.display = 'none';
});

document.getElementById('close-document-btn').addEventListener('click', function() {
documentModal.style.display = 'none';
});

document.getElementById('download-document-btn').addEventListener('click', function() {
alert('Téléchargement du document en cours...');
});
}

// Remplir les détails du document
document.getElementById('document-title').textContent = `Document d'urbanisme #${documentId}`;
document.getElementById('doc-type').textContent = getRandomDocType();
document.getElementById('doc-date').textContent = getRandomDate();
document.getElementById('doc-commune').textContent = "Alger";
document.getElementById('doc-area').textContent = `${(Math.random() * 100 + 50).toFixed(2)} hectares`;
document.getElementById('doc-description').textContent = `Ce document d'urbanisme définit les règles d'aménagement et les servitudes d'utilisation des sols pour la zone concernée. Il a été approuvé par arrêté municipal après enquête publique et consultation des services de l'État.`;

// Afficher le modal
documentModal.style.display = 'flex';

hideLoading();
}, 800);
};

// Fonctions utilitaires pour les documents fictifs
function getRandomDocType() {
const types = ["Plan Local d'Urbanisme (PLU)", "Plan d'Occupation des Sols (POS)", "Carte Communale (CC)", "PDAU", "Plan de Prévention des Risques (PPR)"];
return types[Math.floor(Math.random() * types.length)];
}

function getRandomDate() {
const year = 2018 + Math.floor(Math.random() * 7);
const month = Math.floor(Math.random() * 12) + 1;
const day = Math.floor(Math.random() * 28) + 1;
return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}
           