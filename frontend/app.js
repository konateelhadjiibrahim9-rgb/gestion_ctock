// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// État global de l'application
let exemplairesData = [];
let produitsData = [];
let currentExemplaire = null;
let deleteCallback = null;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
        ${message}
    `;
    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getStatusBadge(statut) {
    const statusClasses = {
        'En stock': 'status-en-stock',
        'Vendu': 'status-vendu',
        'En réparation': 'status-en-reparation'
    };

    const statusIcons = {
        'En stock': 'fa-check-circle',
        'Vendu': 'fa-shopping-cart',
        'En réparation': 'fa-tools'
    };

    return `
        <span class="status-badge ${statusClasses[statut] || 'bg-gray-200 text-gray-700'}">
            <i class="fas ${statusIcons[statut] || 'fa-question-circle'} mr-1"></i>
            ${statut}
        </span>
    `;
}

// ============================================
// NAVIGATION
// ============================================

function showTab(tabName) {
    // Masquer tout le contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Désactiver tous les onglets
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('tab-active');
        tab.classList.add('text-gray-600');
    });

    // Afficher le contenu sélectionné
    document.getElementById(`${tabName}-content`).classList.remove('hidden');

    // Activer l'onglet sélectionné
    const activeTab = document.getElementById(`tab-${tabName}`);
    activeTab.classList.add('tab-active');
    activeTab.classList.remove('text-gray-600');

    // Charger les données spécifiques à l'onglet
    if (tabName === 'dashboard') {
        loadDashboardStats();
    } else if (tabName === 'stock') {
        loadExemplaires();
    } else if (tabName === 'produits') {
        loadProduits();
    }
}

// ============================================
// API CALLS
// ============================================

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur API');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboardStats() {
    try {
        const stats = await apiCall('/stats/stock-summary');

        // Mettre à jour les cartes statistiques
        document.getElementById('stat-total').textContent = stats.global.total_exemplaires || 0;
        document.getElementById('stat-stock').textContent = stats.global.en_stock || 0;
        document.getElementById('stat-vendus').textContent = stats.global.vendus || 0;
        document.getElementById('stat-reparation').textContent = stats.global.en_reparation || 0;
        document.getElementById('stat-valeur').textContent = formatCurrency(stats.valeurs.valeur_stock || 0);
        document.getElementById('stat-ventes').textContent = formatCurrency(stats.valeurs.valeur_ventes || 0);

        // Mettre à jour le statut API
        document.getElementById('apiStatus').innerHTML = `
            <i class="fas fa-circle text-green-400 mr-1"></i> Connecté
        `;

    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        document.getElementById('apiStatus').innerHTML = `
            <i class="fas fa-circle text-red-400 mr-1"></i> Déconnecté
        `;
        showToast('Erreur de connexion à l\'API', 'error');
    }
}

function refreshDashboard() {
    loadDashboardStats();
    showToast('Tableau de bord actualisé');
}

// ============================================
// STOCK MANAGEMENT
// ============================================

async function loadExemplaires() {
    try {
        exemplairesData = await apiCall('/exemplaires');
        renderExemplairesTable(exemplairesData);
    } catch (error) {
        console.error('Erreur lors du chargement des exemplaires:', error);
        document.getElementById('exemplairesTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Erreur de chargement des données</p>
                </td>
            </tr>
        `;
    }
}

function renderExemplairesTable(exemplaires) {
    const tbody = document.getElementById('exemplairesTableBody');

    if (exemplaires.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-box-open text-4xl mb-2"></i>
                    <p>Aucun exemplaire trouvé</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = exemplaires.map(exemplaire => `
        <tr class="hover:bg-gray-50 transition-colors align-top">
            <td class="px-6 py-4 whitespace-nowrap align-top">
                <span class="font-mono text-sm font-medium text-gray-900">${exemplaire.num_serie}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap align-top">
                <div class="flex items-center space-x-3">
                    ${exemplaire.image_url ?
                        `<img src="http://localhost:3000${exemplaire.image_url}" alt="${exemplaire.nom_produit}" class="w-10 h-10 object-cover rounded-lg border border-gray-200">` :
                        `<div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-image text-gray-400 text-sm"></i>
                        </div>`
                    }
                    <div>
                        <div class="text-sm font-medium text-gray-900">${exemplaire.nom_produit || 'N/A'}</div>
                        <div class="text-sm text-gray-500">${exemplaire.code_produit || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 min-w-[220px] align-top">
                ${getStatusBadge(exemplaire.statut)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-700">${exemplaire.etat_physique || 'N/A'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="viewExemplaireDetails('${exemplaire.num_serie}')"
                        class="text-purple-600 hover:text-purple-900 mr-2" title="Voir détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editExemplaire('${exemplaire.num_serie}')"
                        class="text-blue-600 hover:text-blue-900 mr-2" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmDeleteExemplaire('${exemplaire.num_serie}')"
                        class="text-red-600 hover:text-red-900 mr-2" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="copyToClipboard('${exemplaire.num_serie}')"
                        class="text-gray-600 hover:text-gray-900" title="Copier">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterExemplaires() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = exemplairesData.filter(exemplaire => {
        const matchesSearch = !searchTerm ||
            exemplaire.num_serie.toLowerCase().includes(searchTerm) ||
            (exemplaire.nom_produit && exemplaire.nom_produit.toLowerCase().includes(searchTerm));

        const matchesStatus = !statusFilter || exemplaire.statut === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderExemplairesTable(filtered);
}

function viewExemplaireDetails(numSerie) {
    document.getElementById('historiqueNumSerie').value = numSerie;
    showTab('historique');
    searchHistorique();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Numéro de série copié');
    });
}

// ============================================
// VENTE
// ============================================

document.getElementById('venteNumSerie').addEventListener('input', async function() {
    const numSerie = this.value.trim();
    const previewDiv = document.getElementById('ventePreview');
    const previewContent = document.getElementById('ventePreviewContent');

    if (numSerie.length >= 3) {
        try {
            const exemplaire = await apiCall(`/exemplaires/${numSerie}`);
            currentExemplaire = exemplaire;

            previewDiv.classList.remove('hidden');
            previewContent.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        ${exemplaire.image_url ?
                            `<img src="http://localhost:3000${exemplaire.image_url}" alt="${exemplaire.nom_produit}" class="w-16 h-16 object-cover rounded-lg border border-gray-200">` :
                            `<div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-image text-gray-400"></i>
                            </div>`
                        }
                        <div>
                            <p class="font-medium text-gray-800">${exemplaire.nom_produit || 'Produit inconnu'}</p>
                            <p class="text-sm text-gray-500">${exemplaire.code_produit || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-purple-600">${formatCurrency(exemplaire.prix_vente || 0)}</p>
                        ${getStatusBadge(exemplaire.statut)}
                    </div>
                </div>
            `;
        } catch (error) {
            previewDiv.classList.add('hidden');
            currentExemplaire = null;
        }
    } else {
        previewDiv.classList.add('hidden');
        currentExemplaire = null;
    }
});

async function enregistrerVente(event) {
    event.preventDefault();

    const numSerie = document.getElementById('venteNumSerie').value.trim();
    const commentaire = document.getElementById('venteCommentaire').value.trim();

    if (!numSerie) {
        showToast('Veuillez entrer un numéro de série', 'error');
        return;
    }

    if (!currentExemplaire) {
        showToast('Numéro de série introuvable', 'error');
        return;
    }

    if (currentExemplaire.statut === 'Vendu') {
        showToast('Cet exemplaire est déjà vendu', 'error');
        return;
    }

    try {
        await apiCall('/mouvements/vente', {
            method: 'POST',
            body: JSON.stringify({ num_serie: numSerie, commentaire })
        });

        showToast('Vente enregistrée avec succès');

        // Réinitialiser le formulaire
        document.getElementById('venteForm').reset();
        document.getElementById('ventePreview').classList.add('hidden');
        currentExemplaire = null;

        // Ajouter aux ventes récentes
        addRecentVente(numSerie, currentExemplaire);

        // Actualiser le dashboard
        loadDashboardStats();

    } catch (error) {
        showToast(error.message || 'Erreur lors de l\'enregistrement de la vente', 'error');
    }
}

function addRecentVente(numSerie, exemplaire) {
    const recentVentes = document.getElementById('recentVentes');
    const venteHTML = `
        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
                <p class="font-medium text-gray-800">${numSerie}</p>
                <p class="text-sm text-gray-500">${exemplaire?.nom_produit || 'Produit inconnu'}</p>
            </div>
            <div class="text-right">
                <p class="text-sm text-green-600 font-medium">Vendu</p>
                <p class="text-xs text-gray-400">${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
        </div>
    `;

    if (recentVentes.querySelector('p')) {
        recentVentes.innerHTML = venteHTML;
    } else {
        recentVentes.insertAdjacentHTML('afterbegin', venteHTML);
    }
}

// ============================================
// HISTORIQUE
// ============================================

async function searchHistorique() {
    const numSerie = document.getElementById('historiqueNumSerie').value.trim();

    if (!numSerie) {
        showToast('Veuillez entrer un numéro de série', 'error');
        return;
    }

    try {
        const historique = await apiCall(`/mouvements/historique/${numSerie}`);

        document.getElementById('historiqueResult').classList.remove('hidden');
        document.getElementById('historiqueEmpty').classList.add('hidden');

        // Afficher les infos de l'exemplaire
        document.getElementById('exemplaireInfo').innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    ${historique.image_url ?
                        `<img src="http://localhost:3000${historique.image_url}" alt="${historique.produit}" class="w-20 h-20 object-cover rounded-lg border border-gray-200">` :
                        `<div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-image text-gray-400 text-2xl"></i>
                        </div>`
                    }
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">${historique.produit || 'Produit inconnu'}</h4>
                        <p class="text-gray-500">${historique.code_produit || 'N/A'}</p>
                        <p class="font-mono text-sm text-gray-600 mt-1">${historique.num_serie}</p>
                    </div>
                </div>
                <div class="text-right">
                    ${getStatusBadge(historique.statut_actuel)}
                    <p class="text-sm text-gray-500 mt-2">État: ${historique.etat_physique || 'N/A'}</p>
                </div>
            </div>
        `;

        // Afficher la timeline
        const timeline = document.getElementById('historiqueTimeline');

        if (historique.mouvements && historique.mouvements.length > 0) {
            timeline.innerHTML = historique.mouvements.map((mouvement, index) => `
                <div class="flex items-start">
                    <div class="flex flex-col items-center mr-4">
                        <div class="w-3 h-3 rounded-full ${mouvement.type_mouvement === 'Entrée' ? 'bg-green-500' : 'bg-red-500'}"></div>
                        ${index < historique.mouvements.length - 1 ? '<div class="w-0.5 h-16 bg-gray-200"></div>' : ''}
                    </div>
                    <div class="flex-1 pb-6">
                        <div class="flex items-center justify-between">
                            <h5 class="font-medium text-gray-800">${mouvement.type_mouvement}</h5>
                            <span class="text-sm text-gray-500">${mouvement.date_mouvement}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">${mouvement.commentaire || 'Aucun commentaire'}</p>
                        <div class="mt-2">
                            <span class="inline-block px-2 py-1 text-xs rounded ${mouvement.type_mouvement === 'Entrée' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                ${mouvement.type_mouvement}
                            </span>
                            ${mouvement.type_mouvement === 'Vente' && historique.statut_actuel === 'Vendu' ? `
                                <button onclick="cancelSale('${historique.num_serie}')" class="ml-3 text-xs text-orange-700 hover:text-orange-900 font-medium">
                                    <i class="fas fa-rotate-left mr-1"></i>Annuler la vente
                                </button>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            timeline.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clock text-4xl mb-2"></i>
                    <p>Aucun mouvement enregistré pour cet exemplaire</p>
                </div>
            `;
        }

    } catch (error) {
        document.getElementById('historiqueResult').classList.add('hidden');
        document.getElementById('historiqueEmpty').classList.remove('hidden');
        showToast(error.message || 'Exemplaire non trouvé', 'error');
    }
}

async function cancelSale(numSerie) {
    if (!window.confirm(`Annuler la vente de l'exemplaire ${numSerie} et le remettre en stock ?`)) return;

    try {
        await apiCall('/mouvements/annuler-vente', {
            method: 'POST',
            body: JSON.stringify({ num_serie: numSerie })
        });
        showToast('Vente annulée, exemplaire remis en stock');
        await searchHistorique();
        loadExemplaires();
        loadDashboardStats();
    } catch (error) {
        showToast(error.message || 'Impossible d’annuler la vente', 'error');
    }
}

// ============================================
// PRODUITS MANAGEMENT
// ============================================

async function loadProduits() {
    try {
        produitsData = await apiCall('/produits');
        renderProduitsTable(produitsData);
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        document.getElementById('produitsTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Erreur de chargement des produits</p>
                </td>
            </tr>
        `;
    }
}

function filterProduits() {
    const searchInput = document.getElementById('productSearchInput');
    const searchTerm = (searchInput?.value || '').trim().toLowerCase();

    if (!searchTerm) {
        renderProduitsTable(produitsData);
        return;
    }

    const filteredProduits = produitsData.filter(produit => {
        const searchableText = [
            produit.nom,
            produit.code_produit,
            produit.description
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
    });

    renderProduitsTable(filteredProduits);
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
}

async function analyzeProductListing() {
    const text = document.getElementById('matchingText').value.trim();
    const resultsContainer = document.getElementById('matchingResults');
    const status = document.getElementById('matchingStatus');

    if (!text) {
        showToast('Collez un listing à analyser', 'error');
        return;
    }

    status.textContent = 'Analyse en cours...';
    resultsContainer.innerHTML = '<div class="bg-white rounded-xl shadow-md p-8 text-center"><div class="loading-spinner mx-auto mb-4"></div><p class="text-gray-500">Recherche des correspondances...</p></div>';

    try {
        const response = await apiCall('/produits/match-search', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        const matchedProducts = response.results.flatMap(result => [result.match, ...(result.alternatives || [])]).filter(Boolean);
        const productsById = new Map(produitsData.map(product => [product.id_produit, product]));
        matchedProducts.forEach(product => productsById.set(product.id_produit, product));
        produitsData = [...productsById.values()];
        renderMatchingResults(response.results || []);
        status.textContent = `${response.productsAnalyzed || 0} produit(s) disponible(s) analysé(s).`;
    } catch (error) {
        resultsContainer.innerHTML = '';
        status.textContent = 'Analyse impossible';
        showToast(error.message || 'Erreur pendant l’analyse', 'error');
    }
}

function renderMatchingResults(results) {
    const container = document.getElementById('matchingResults');
    if (!results.length) {
        container.innerHTML = '<div class="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">Aucune ligne exploitable trouvée.</div>';
        return;
    }

    const renderProductCard = (product, exact) => `
        <div class="border border-gray-200 rounded-lg p-4 bg-white">
            <div class="flex items-start gap-4">
                ${product.image_url ? `<img src="${API_BASE_URL.replace('/api', '')}${product.image_url}" alt="${escapeHtml(product.nom)}" class="w-16 h-16 object-cover rounded-lg border">` : '<div class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center"><i class="fas fa-image text-gray-400"></i></div>'}
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <h4 class="font-semibold text-gray-900">${escapeHtml(product.nom)}</h4>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${exact ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${exact ? 'En Stock (Exact)' : 'Alternative Disponible'}</span>
                        <span class="text-xs text-gray-500">Score ${product.score}%</span>
                    </div>
                    <p class="text-sm text-gray-500">${escapeHtml(product.code_produit)} · ${formatCurrency(product.prix_vente || 0)} · <strong class="text-green-700">${Number(product.stock_disponible || 0)} en stock</strong></p>
                    <p class="text-sm text-gray-600 mt-2 whitespace-pre-line line-clamp-2">${escapeHtml(product.description || 'Aucune description')}</p>
                    <div class="flex flex-wrap gap-3 mt-3">
                        <button onclick="showProductDetails(${product.id_produit})" class="text-sm text-purple-600 hover:text-purple-900"><i class="fas fa-eye mr-1"></i>Voir la fiche</button>
                        <button onclick="editProduct(${product.id_produit})" class="text-sm text-blue-600 hover:text-blue-900"><i class="fas fa-edit mr-1"></i>Modifier</button>
                        ${product.num_serie_disponible ? `<button onclick="quickSale('${escapeHtml(product.num_serie_disponible)}')" class="text-sm text-green-600 hover:text-green-900"><i class="fas fa-cart-shopping mr-1"></i>Vente rapide</button>` : ''}
                    </div>
                </div>
            </div>
        </div>`;

    container.innerHTML = results.map(result => `
        <section class="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p class="text-sm font-medium text-gray-700 mb-3"><i class="fas fa-quote-left text-purple-500 mr-2"></i>${escapeHtml(result.query)}</p>
            ${result.match ? renderProductCard(result.match, true) : '<div class="bg-yellow-50 text-yellow-800 rounded-lg p-3 text-sm mb-3">Aucune correspondance exacte. Voici les alternatives disponibles :</div>'}
            ${result.alternatives.length ? `<div class="space-y-3 ${result.match ? 'mt-3' : ''}">${result.alternatives.map(product => renderProductCard(product, false)).join('')}</div>` : (!result.match ? '<p class="text-sm text-gray-500">Aucune alternative trouvée en stock.</p>' : '')}
        </section>
    `).join('');
}

function quickSale(numSerie) {
    showTab('vente');
    const input = document.getElementById('venteNumSerie');
    input.value = numSerie;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function renderProduitsTable(produits) {
    const tbody = document.getElementById('produitsTableBody');

    if (produits.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-box-open text-4xl mb-2"></i>
                    <p>Aucun produit trouvé</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = produits.map(produit => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                ${produit.image_url ?
                    `<img src="http://localhost:3000${produit.image_url}" alt="${produit.nom}" class="w-12 h-12 object-cover rounded-lg border border-gray-200">` :
                    `<div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-image text-gray-400"></i>
                    </div>`
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm font-medium text-gray-900">${produit.code_produit}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-gray-900">${produit.nom}</span>
            </td>
            <td class="px-6 py-4">
                <p class="product-description text-sm text-gray-600 whitespace-pre-line break-words leading-relaxed" title="${produit.description || 'N/A'}">${produit.description || 'N/A'}</p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-700">${formatCurrency(produit.prix_achat || 0)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-green-600">${formatCurrency(produit.prix_vente || 0)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${Number(produit.stock_disponible || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    ${Number(produit.stock_disponible || 0)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="showProductDetails(${produit.id_produit})"
                        class="text-purple-600 hover:text-purple-900 mr-3" title="Voir détails & galerie">
                    <i class="fas fa-images"></i>
                </button>
                <button onclick="exportProductAsText(${produit.id_produit})"
                        class="text-green-600 hover:text-green-900 mr-3" title="Exporter et partager en texte">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button onclick="editProduct(${produit.id_produit})"
                        class="text-blue-600 hover:text-blue-900 mr-3" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmDeleteProduct(${produit.id_produit}, '${produit.nom}')"
                        class="text-red-600 hover:text-red-900" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function exportProductAsText(id) {
    const produit = produitsData.find(product => product.id_produit === id);
    if (!produit) return;

    const fiche = [
        'FICHE PRODUIT',
        '==============================',
        `Nom : ${produit.nom || 'N/A'}`,
        `Code : ${produit.code_produit || 'N/A'}`,
        `Prix achat : ${formatCurrency(produit.prix_achat || 0)}`,
        `Prix vente : ${formatCurrency(produit.prix_vente || 0)}`,
        '',
        'DESCRIPTION TECHNIQUE',
        '==============================',
        produit.description || 'Aucune description disponible',
        '',
        'Contactez-nous pour plus d’informations.'
    ].join('\n');

    const safeName = (produit.nom || 'produit').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    const fileName = `${safeName || 'produit'}-${produit.code_produit || id}.txt`;
    const file = new File([fiche], fileName, { type: 'text/plain;charset=utf-8' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ title: produit.nom, text: fiche, files: [file] });
            return;
        } catch (error) {
            if (error.name === 'AbortError') return;
        }
    }

    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

    if (navigator.clipboard) {
        await navigator.clipboard.writeText(fiche);
        showToast('Fiche texte téléchargée et copiée');
    } else {
        showToast('Fiche texte téléchargée');
    }
}

function openAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Ajouter un Produit';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('productGallery').classList.add('hidden');
    document.getElementById('productGalleryGrid').innerHTML = '';
    document.getElementById('productModal').classList.remove('hidden');
    document.getElementById('productModal').classList.add('flex');
}

function editProduct(id) {
    const produit = produitsData.find(p => p.id_produit === id);
    if (!produit) return;

    document.getElementById('productModalTitle').textContent = 'Modifier le Produit';
    document.getElementById('productId').value = produit.id_produit;
    document.getElementById('productCode').value = produit.code_produit;
    document.getElementById('productName').value = produit.nom;
    document.getElementById('productDescription').value = produit.description || '';
    document.getElementById('productPrixAchat').value = produit.prix_achat || '';
    document.getElementById('productPrixVente').value = produit.prix_vente || '';

    // Réinitialiser l'aperçu d'image
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('productImage').value = '';
    renderProductGallery(produit);

    // Afficher l'image existante si disponible
    if (produit.image_url) {
        const imagePreview = document.getElementById('imagePreview');
        const imagePreviewImg = document.getElementById('imagePreviewImg');
        imagePreviewImg.src = `http://localhost:3000${produit.image_url}`;
        imagePreview.classList.remove('hidden');
    }

    document.getElementById('productModal').classList.remove('hidden');
    document.getElementById('productModal').classList.add('flex');
}

function getProductGallery(produit) {
    let gallery = [];
    if (produit.images_galerie) {
        try {
            gallery = Array.isArray(produit.images_galerie)
                ? produit.images_galerie
                : JSON.parse(produit.images_galerie);
        } catch (error) {
            console.error('Erreur parsing galerie:', error);
        }
    }
    if (!gallery.length && produit.image_url) gallery = [produit.image_url];
    return gallery;
}

function renderProductGallery(produit) {
    const gallery = getProductGallery(produit);
    const galleryContainer = document.getElementById('productGallery');
    const galleryGrid = document.getElementById('productGalleryGrid');
    if (!gallery.length) {
        galleryContainer.classList.add('hidden');
        galleryGrid.innerHTML = '';
        return;
    }

    galleryContainer.classList.remove('hidden');
    galleryGrid.innerHTML = gallery.map((imageUrl, index) => `
        <div class="relative group">
            <img src="http://localhost:3000${imageUrl}" alt="Image ${index + 1}" class="w-full aspect-square object-cover rounded-lg border border-gray-200">
            <button type="button" onclick="removeProductGalleryImage(${produit.id_produit}, '${imageUrl}')"
                    class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white opacity-90 hover:bg-red-700"
                    title="Supprimer cette image">
                <i class="fas fa-trash text-xs"></i>
            </button>
        </div>
    `).join('');
}

async function removeProductGalleryImage(id, imageUrl) {
    if (!window.confirm('Supprimer cette image de la galerie ?')) return;

    try {
        const response = await apiCall(`/produits/${id}/images`, {
            method: 'DELETE',
            body: JSON.stringify({ image_url: imageUrl })
        });
        const produit = produitsData.find(product => product.id_produit === id);
        if (produit) {
            produit.image_url = response.image_url;
            produit.images_galerie = response.images_galerie;
            renderProductGallery(produit);
            const preview = document.getElementById('imagePreview');
            const previewImage = document.getElementById('imagePreviewImg');
            if (produit.image_url) {
                previewImage.src = `http://localhost:3000${produit.image_url}`;
                preview.classList.remove('hidden');
            } else {
                preview.classList.add('hidden');
            }
        }
        showToast('Image supprimée de la galerie');
    } catch (error) {
        showToast(error.message || 'Impossible de supprimer cette image', 'error');
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productModal').classList.remove('flex');
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('productImage').value = '';
    document.getElementById('productGallery').classList.add('hidden');
    document.getElementById('productGalleryGrid').innerHTML = '';
}

function showProductDetails(id) {
    const produit = produitsData.find(p => p.id_produit === id);
    if (!produit) return;

    // Parser la galerie d'images
    let imagesGalerie = [];
    if (produit.images_galerie) {
        try {
            imagesGalerie = Array.isArray(produit.images_galerie)
                ? produit.images_galerie
                : JSON.parse(produit.images_galerie);
        } catch (e) {
            console.error('Erreur parsing galerie:', e);
            imagesGalerie = [];
        }
    }

    // Si pas de galerie mais image principale, l'utiliser
    if (imagesGalerie.length === 0 && produit.image_url) {
        imagesGalerie = [produit.image_url];
    }

    const modalTitle = document.getElementById('productDetailsTitle');
    const modal = document.getElementById('productDetailsModal');

    modalTitle.textContent = produit.nom;

    // Contenu de la modale
    const content = document.getElementById('productDetailsContent');
    content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Galerie d'images -->
            <div>
                <div class="mb-4">
                    <img id="mainImage" src="${imagesGalerie.length > 0 ? 'http://localhost:3000' + imagesGalerie[0] : ''}"
                         alt="${produit.nom}"
                         class="w-full h-80 object-cover rounded-lg border border-gray-200">
                </div>
                ${imagesGalerie.length > 1 ? `
                    <div class="grid grid-cols-4 gap-2">
                        ${imagesGalerie.map((img, index) => `
                            <img src="http://localhost:3000${img}"
                                 alt="Image ${index + 1}"
                                 class="w-full h-20 object-cover rounded cursor-pointer border-2 ${index === 0 ? 'border-purple-500' : 'border-transparent'} hover:border-purple-300"
                                 onclick="changeMainImage('${img}', this)">
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <!-- Caractéristiques -->
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-4">Caractéristiques</h3>
                <div class="space-y-4">
                    <div>
                        <span class="text-sm font-medium text-gray-500">Code produit</span>
                        <p class="text-lg font-semibold text-gray-900">${produit.code_produit}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-gray-500">Nom</span>
                        <p class="text-lg font-semibold text-gray-900">${produit.nom}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-gray-500">Prix d'achat</span>
                        <p class="text-lg font-semibold text-gray-900">${formatCurrency(produit.prix_achat || 0)}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-gray-500">Prix de vente</span>
                        <p class="text-lg font-semibold text-green-600">${formatCurrency(produit.prix_vente || 0)}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-gray-500">Description</span>
                        <div class="bg-gray-50 p-4 rounded-lg mt-2">
                            <p class="text-sm text-gray-700 whitespace-pre-line">${produit.description || 'Aucune description disponible'}</p>
                        </div>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-gray-500">Nombre d'images</span>
                        <p class="text-lg font-semibold text-gray-900">${imagesGalerie.length}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function changeMainImage(imageUrl, thumbnail) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = 'http://localhost:3000' + imageUrl;

    // Mettre à jour les bordures des miniatures
    document.querySelectorAll('#productDetailsContent img[onclick]').forEach(img => {
        img.classList.remove('border-purple-500');
        img.classList.add('border-transparent');
    });
    thumbnail.classList.remove('border-transparent');
    thumbnail.classList.add('border-purple-500');
}

function closeProductDetailsModal() {
    document.getElementById('productDetailsModal').classList.add('hidden');
    document.getElementById('productDetailsModal').classList.remove('flex');
}

async function saveProduct(event) {
    event.preventDefault();

    const id = document.getElementById('productId').value;
    const imageFile = document.getElementById('productImage').files[0];

    // Créer FormData pour gérer l'upload de fichier
    const formData = new FormData();
    formData.append('code_produit', document.getElementById('productCode').value);
    formData.append('nom', document.getElementById('productName').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('prix_achat', parseFloat(document.getElementById('productPrixAchat').value) || 0);
    formData.append('prix_vente', parseFloat(document.getElementById('productPrixVente').value) || 0);

    // Ajouter l'image si elle est fournie
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        if (id) {
            // Modification
            const response = await fetch(`${API_BASE_URL}/produits/${id}`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur API');
            }

            showToast('Produit modifié avec succès');
        } else {
            // Création
            const response = await fetch(`${API_BASE_URL}/produits`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur API');
            }

            showToast('Produit ajouté avec succès');
        }

        closeProductModal();
        loadProduits();
        loadDashboardStats(); // Actualiser les stats
    } catch (error) {
        showToast(error.message || 'Erreur lors de l\'enregistrement du produit', 'error');
    }
}

function confirmDeleteProduct(id, nom) {
    document.getElementById('confirmMessage').textContent =
        `Êtes-vous sûr de vouloir supprimer le produit "${nom}" ? Cette action est irréversible.`;

    deleteCallback = async () => {
        try {
            await apiCall(`/produits/${id}`, { method: 'DELETE' });
            showToast('Produit supprimé avec succès');
            loadProduits();
            loadDashboardStats();
            closeConfirmModal();
        } catch (error) {
            showToast(error.message || 'Erreur lors de la suppression du produit', 'error');
        }
    };

    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmModal').classList.add('flex');
}

// ============================================
// EXEMPLAIRES MANAGEMENT (MODAL)
// ============================================

function openAddExemplaireModal() {
    document.getElementById('exemplaireModalTitle').textContent = 'Ajouter un Exemplaire';
    document.getElementById('exemplaireForm').reset();
    document.getElementById('exemplaireNumSerie').value = '';
    document.getElementById('exemplaireNumSerieInput').disabled = false;

    // Charger les produits dans le select
    loadProduitsForSelect();

    document.getElementById('exemplaireModal').classList.remove('hidden');
    document.getElementById('exemplaireModal').classList.add('flex');
}

function editExemplaire(numSerie) {
    const exemplaire = exemplairesData.find(e => e.num_serie === numSerie);
    if (!exemplaire) return;

    document.getElementById('exemplaireModalTitle').textContent = 'Modifier l\'Exemplaire';
    document.getElementById('exemplaireNumSerie').value = exemplaire.num_serie;
    document.getElementById('exemplaireNumSerieInput').value = exemplaire.num_serie;
    document.getElementById('exemplaireNumSerieInput').disabled = true; // Pas modifiable

    loadProduitsForSelect(exemplaire.id_produit);

    document.getElementById('exemplaireStatut').value = exemplaire.statut;
    document.getElementById('exemplaireEtatPhysique').value = exemplaire.etat_physique;

    document.getElementById('exemplaireModal').classList.remove('hidden');
    document.getElementById('exemplaireModal').classList.add('flex');
}

function closeExemplaireModal() {
    document.getElementById('exemplaireModal').classList.add('hidden');
    document.getElementById('exemplaireModal').classList.remove('flex');
}

async function loadProduitsForSelect(selectedId = null) {
    try {
        const produits = await apiCall('/produits');
        const select = document.getElementById('exemplaireProduit');

        select.innerHTML = '<option value="">Sélectionner un produit</option>';
        produits.forEach(produit => {
            const option = document.createElement('option');
            option.value = produit.id_produit;
            option.textContent = `${produit.code_produit} - ${produit.nom}`;
            if (selectedId && produit.id_produit === selectedId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
    }
}

async function saveExemplaire(event) {
    event.preventDefault();

    const numSerie = document.getElementById('exemplaireNumSerie').value;
    const exemplaireData = {
        num_serie: document.getElementById('exemplaireNumSerieInput').value,
        id_produit: parseInt(document.getElementById('exemplaireProduit').value),
        statut: document.getElementById('exemplaireStatut').value,
        etat_physique: document.getElementById('exemplaireEtatPhysique').value
    };

    try {
        if (numSerie) {
            // Modification
            await apiCall(`/exemplaires/${numSerie}`, {
                method: 'PUT',
                body: JSON.stringify(exemplaireData)
            });
            showToast('Exemplaire modifié avec succès');
        } else {
            // Création
            await apiCall('/exemplaires', {
                method: 'POST',
                body: JSON.stringify(exemplaireData)
            });
            showToast('Exemplaire ajouté avec succès');
        }

        closeExemplaireModal();
        loadExemplaires();
        loadDashboardStats();
    } catch (error) {
        showToast(error.message || 'Erreur lors de l\'enregistrement de l\'exemplaire', 'error');
    }
}

function confirmDeleteExemplaire(numSerie) {
    document.getElementById('confirmMessage').textContent =
        `Êtes-vous sûr de vouloir supprimer l'exemplaire "${numSerie}" ? Cette action est irréversible.`;

    deleteCallback = async () => {
        try {
            await apiCall(`/exemplaires/${numSerie}`, { method: 'DELETE' });
            showToast('Exemplaire supprimé avec succès');
            loadExemplaires();
            loadDashboardStats();
            closeConfirmModal();
        } catch (error) {
            showToast(error.message || 'Erreur lors de la suppression de l\'exemplaire', 'error');
        }
    };

    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmModal').classList.add('flex');
}

// ============================================
// CONFIRM MODAL
// ============================================

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    document.getElementById('confirmModal').classList.remove('flex');
    deleteCallback = null;
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    if (deleteCallback) {
        deleteCallback();
    }
});

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Charger les statistiques du dashboard au démarrage
    loadDashboardStats();

    // Ajouter un écouteur pour la touche Entrée dans la recherche d'historique
    document.getElementById('historiqueNumSerie').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchHistorique();
        }
    });

    // Écouteur pour l'aperçu de l'image du produit
    document.getElementById('productImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imagePreview = document.getElementById('imagePreview');
                const imagePreviewImg = document.getElementById('imagePreviewImg');
                imagePreviewImg.src = e.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('imagePreview').classList.add('hidden');
        }
    });
});