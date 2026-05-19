// Vendor Marketplace JavaScript - Supplier Discovery Platform

let savedSuppliers = JSON.parse(localStorage.getItem('savedSuppliers') || '[]');
let compareList = [];
let currentRFQSupplier = '';
let suppliers = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  updateSavedCount();
  initializeFilters();
  loadSuppliers();
});

// Initialize filters
function initializeFilters() {
  // Search functionality only
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterSuppliers);
  }
}

// Mock supplier data - Fallback for Indian Food Suppliers + Farmers & Small Businesses
function getMockSuppliers() {
  return [
    {
      id: 'supplier_1',
      name: 'Safal (Mother Dairy)',
      type: 'Producer',
      location: 'Delhi NCR',
      materials: ['Fresh Potatoes', 'Iceberg Lettuce', 'Tomatoes', 'Onions', 'Pickles'],
      capacity: 500,
      leadTime: '1 day',
      rating: 4.6,
      reviews: 892,
      verified: true,
      available: true,
      contact: '+91 11-2747-3747',
      email: 'safal@motherdairy.com',
      specialties: 'FSSAI Certified, Daily Fresh, 100+ Outlets',
      website: 'www.motherdairy.com',
      createdAt: new Date('2026-03-29T10:00:00Z')
    },
    {
      id: 'supplier_2',
      name: 'Amul',
      type: 'Manufacturer',
      location: 'Anand, Gujarat',
      materials: ['Cheddar Cheese Slices', 'Mozzarella', 'American Cheese', 'Butter', 'Cream'],
      capacity: 2000,
      leadTime: '2-3 days',
      rating: 4.8,
      reviews: 2341,
      verified: true,
      available: true,
      contact: '+91 2692-258-041',
      email: 'amul@amul.com',
      specialties: 'Largest Dairy Cooperative, ISO Certified, 50+ Years',
      website: 'www.amul.com',
      createdAt: new Date('2026-03-28T14:00:00Z')
    },
    {
      id: 'supplier_3',
      name: 'Ramesh Kumar - Local Vegetable Farmer',
      type: 'Farmer',
      location: 'Bangalore Rural, Karnataka',
      materials: ['Fresh Potatoes', 'Tomatoes', 'Onions', 'Lettuce', 'Coriander'],
      capacity: 100,
      leadTime: '1 day',
      rating: 4.4,
      reviews: 67,
      verified: true,
      available: true,
      contact: '+91 9448234567',
      email: 'ramesh.farmer@gmail.com',
      specialties: 'Organic Farming, Direct from Farm, No Pesticides',
      supportType: 'Small Farmer Support',
      createdAt: new Date('2026-03-27T11:00:00Z')
    },
    {
      id: 'supplier_4',
      name: 'Britannia Industries',
      type: 'Bakery',
      location: 'Bangalore, Karnataka',
      materials: ['Burger Buns', 'Sesame Seed Buns', 'Brioche Buns', 'Whole Wheat Buns'],
      capacity: 1500,
      leadTime: '1 day',
      rating: 4.5,
      reviews: 1567,
      verified: true,
      available: true,
      contact: '+91 80-6624-2000',
      email: 'contact@britannia.co.in',
      specialties: '100+ Years Heritage, National Distribution',
      website: 'www.britannia.co.in',
      createdAt: new Date('2026-03-26T09:00:00Z')
    },
    {
      id: 'supplier_5',
      name: 'Godrej Tyson Foods',
      type: 'Processor',
      location: 'Mumbai, Maharashtra',
      materials: ['Chicken Patties', 'Veggie Patties', 'Bacon Strips', 'Sausages'],
      capacity: 800,
      leadTime: '2 days',
      rating: 4.4,
      reviews: 743,
      verified: true,
      available: true,
      contact: '+91 22-6172-8000',
      email: 'info@godrejtyson.com',
      specialties: 'FSSAI Approved, Cold Chain Logistics',
      website: 'www.godrejtyson.com',
      createdAt: new Date('2026-03-25T08:00:00Z')
    }
  ];
}

let filteredSuppliers = [];

// Load suppliers from API
async function loadSuppliers() {
  try {
    const response = await fetch('/api/suppliers');
    suppliers = await response.json();

    // Transform supplier data to match the expected format and preserve createdAt
    suppliers = suppliers.map(supplier => ({
      id: supplier._id,
      name: supplier.businessName || supplier.name || 'Unknown Supplier',
      type: supplier.businessType || 'Supplier',
      location: supplier.location || supplier.city || 'Location not specified',
      materials: supplier.products || supplier.materials || ['Various products'],
      capacity: supplier.capacity || 100,
      leadTime: supplier.leadTime || '3-5 days',
      rating: supplier.rating || 4.0,
      reviews: supplier.reviewCount || 0,
      verified: supplier.verified || false,
      available: supplier.available !== false,
      contact: supplier.phone || '',
      email: supplier.email || '',
      specialties: supplier.specialties || '',
      website: supplier.website || '',
      createdAt: supplier.createdAt ? new Date(supplier.createdAt) : new Date()
    }));

    // Always show most recent suppliers first
    suppliers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filteredSuppliers = [...suppliers];
    renderSuppliers(filteredSuppliers);
    updateSupplierCount();
  } catch (error) {
    console.error('Error loading suppliers:', error);

    // Fallback to mock data if API fails
    suppliers = getMockSuppliers();
    suppliers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filteredSuppliers = [...suppliers];
    renderSuppliers(filteredSuppliers);
    updateSupplierCount();
  }
}

// Render suppliers
function renderSuppliers(suppliers) {
  const grid = document.getElementById('suppliersGrid');
  grid.innerHTML = '';
  
  suppliers.forEach((supplier, index) => {
    const card = createSupplierCard(supplier, index);
    grid.innerHTML += card;
  });
  
  // Re-attach event listeners
  attachCardListeners();
}

// Create supplier card HTML
function createSupplierCard(supplier, index) {
  const isSaved = savedSuppliers.includes(supplier.id);
  const materialColors = {
    'Steel': 'blue',
    'Cement': 'gray',
    'Chemical': 'purple',
    'Plastic': 'green',
    'Textile': 'yellow'
  };
  
  const firstMaterial = supplier.materials[0].split(' ')[0];
  const color = materialColors[firstMaterial] || 'gray';
  
  return `
    <div class="supplier-card bg-white rounded-xl shadow-sm p-6 slide-up" style="animation-delay: ${index * 0.1}s;" data-supplier-id="${supplier.id}">
      <div class="flex items-start justify-between mb-4">
        <img src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png" class="w-16 h-16 rounded-lg">
        <div class="flex items-center space-x-2">
          ${supplier.verified ? `
            <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
              <i class="fas fa-check-circle mr-1"></i>Verified
            </span>
          ` : ''}
          ${!supplier.available ? `
            <span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
              <i class="fas fa-times-circle mr-1"></i>Unavailable
            </span>
          ` : ''}
          <button onclick="toggleSaveSupplier('${supplier.id}')" class="text-gray-400 hover:text-red-500 transition">
            <i class="${isSaved ? 'fas' : 'far'} fa-heart"></i>
          </button>
        </div>
      </div>
      
      <h3 class="font-semibold text-lg mb-1">${supplier.name}</h3>
      <p class="text-sm text-gray-600 mb-3">${supplier.type} • ${supplier.location}</p>
      
      <div class="flex items-center mb-3">
        <div class="flex text-yellow-400">
          ${generateStars(supplier.rating)}
        </div>
        <span class="ml-2 text-sm text-gray-600">${supplier.rating} (${supplier.reviews} reviews)</span>
      </div>
      
      <div class="mb-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Materials:</p>
        <div class="flex flex-wrap gap-1">
          ${supplier.materials.map(material => `
            <span class="px-2 py-1 bg-${color}-50 text-${color}-700 rounded text-xs">${material}</span>
          `).join('')}
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div>
          <span class="text-gray-500">Capacity:</span>
          <span class="font-medium">${supplier.capacity} tons/month</span>
        </div>
        <div>
          <span class="text-gray-500">Lead Time:</span>
          <span class="font-medium">${supplier.leadTime}</span>
        </div>
      </div>
      
      <div class="flex space-x-2">
        <button onclick="viewSupplierProfile('${supplier.id}')" 
                class="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm">
          <i class="fas fa-eye mr-1"></i>View Profile
        </button>
        <button onclick="sendRFQ('${supplier.id}')" 
                class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
          <i class="fas fa-file-alt mr-1"></i>Send RFQ
        </button>
      </div>
      
      <div class="mt-3 pt-3 border-t">
        <label class="flex items-center">
          <input type="checkbox" onchange="toggleCompare('${supplier.id}')" class="mr-2">
          <span class="text-sm text-gray-600">Add to compare</span>
        </label>
      </div>
    </div>
  `;
}

// Generate star rating HTML
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
    stars += '<i class="far fa-star"></i>';
  }
  
  return stars;
}

// Attach event listeners to cards
function attachCardListeners() {
  // Event listeners are now inline in the HTML
}

// Filter suppliers
function filterSuppliers() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();

  filteredSuppliers = suppliers.filter(supplier => {
    if (!searchTerm) return true;
    const terms = [
      supplier.name,
      supplier.location,
      ...(supplier.materials || [])
    ].join(' ').toLowerCase();
    return terms.includes(searchTerm);
  });

  renderSuppliers(filteredSuppliers);
  updateSupplierCount();
}

// Update supplier count
function updateSupplierCount() {
  document.getElementById('supplierCount').textContent = filteredSuppliers.length;
}

// Show proposals received by vendor
async function showVendorProposals() {
  const modal = document.getElementById('vendorProposalsModal');
  const proposalsList = document.getElementById('vendorProposalsList');
  modal.classList.remove('hidden');
  proposalsList.innerHTML = '<p class="text-center text-gray-400 py-8">Loading proposals...</p>';

  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (!user.id && !user._id)) {
      proposalsList.innerHTML = '<p class="text-center text-red-500 py-8">Please login as vendor to view proposals</p>';
      return;
    }

    const vendorId = user.id || user._id;
    const response = await fetch(`/api/marketplace/proposals/vendor/${vendorId}`);

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const proposals = await response.json();

    if (!proposals || proposals.length === 0) {
      proposalsList.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-gray-400 text-5xl mb-4"></i>
          <p class="text-gray-500">No supplier proposals received yet</p>
          <p class="text-sm text-gray-400">Once suppliers respond, you will see them here.</p>
        </div>
      `;
      return;
    }

    proposalsList.innerHTML = proposals.map(proposal => `
      <div class="border rounded-lg p-4 hover:shadow-md transition">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h4 class="font-semibold text-gray-900">${proposal.supplierName}</h4>
            <p class="text-sm text-gray-500">Requirement ID: ${proposal.requirementId}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-medium ${
            proposal.status === 'accepted' ? 'bg-green-100 text-green-700' :
            proposal.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }">
            ${proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-3 text-sm mb-3">
          <div class="bg-gray-50 p-2 rounded">
            <p class="text-gray-600">Price/Unit</p>
            <p class="font-semibold">₹${proposal.pricePerUnit}</p>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <p class="text-gray-600">Quantity</p>
            <p class="font-semibold">${proposal.availableQuantity}</p>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <p class="text-gray-600">Delivery</p>
            <p class="font-semibold">${proposal.deliveryTimeline}</p>
          </div>
        </div>

        ${proposal.additionalNotes ? `
          <div class="bg-blue-50 p-3 rounded text-sm mb-3">
            <p class="text-gray-700"><strong>Notes:</strong> ${proposal.additionalNotes}</p>
          </div>
        ` : ''}

        <p class="text-xs text-gray-400">Sent: ${new Date(proposal.sentAt).toLocaleDateString()}</p>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading vendor proposals:', error);
    proposalsList.innerHTML = '<p class="text-center text-red-500 py-8">Error loading proposals</p>';
  }
}

function closeVendorProposalsModal() {
  document.getElementById('vendorProposalsModal').classList.add('hidden');
}

// Show Saved Suppliers list
function showSavedSuppliers() {
  const savedIds = JSON.parse(localStorage.getItem('savedSuppliers') || '[]');
  const list = document.getElementById('savedSuppliersList');
  if (!list) return;

  if (savedIds.length === 0) {
    list.innerHTML = '<p class="text-sm text-gray-500">No saved suppliers yet. Click the heart icon on a supplier card to save.</p>';
  } else {
    const items = savedIds.map(id => {
      const supplier = suppliers.find(s => s.id === id);
      if (!supplier) return `<div class="p-3 rounded-lg bg-gray-50 text-sm text-gray-600">Supplier ${id} not available</div>`;
      return `
        <div class="p-3 rounded-lg bg-gray-50 border">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-semibold">${supplier.name}</h4>
              <p class="text-xs text-gray-500">${supplier.type} • ${supplier.location}</p>
            </div>
            <button onclick="removeSavedSupplier('${id}')" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        </div>
      `;
    });
    list.innerHTML = items.join('');
  }

  document.getElementById('savedSuppliersModal').classList.remove('hidden');
}

function closeSavedSuppliersModal() {
  document.getElementById('savedSuppliersModal').classList.add('hidden');
}

function removeSavedSupplier(supplierId) {
  let saved = JSON.parse(localStorage.getItem('savedSuppliers') || '[]');
  saved = saved.filter(id => id !== supplierId);
  localStorage.setItem('savedSuppliers', JSON.stringify(saved));
  savedSuppliers = saved;
  updateSavedCount();
  showSavedSuppliers();
}

// Show My RFQs
function showMyRFQs() {
  const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
  const list = document.getElementById('myRFQsList');
  if (!list) return;

  if (rfqs.length === 0) {
    list.innerHTML = '<p class="text-sm text-gray-500">No RFQs sent yet. Send an RFQ from a supplier card.</p>';
  } else {
    const items = rfqs.map(rfq => {
      const supplier = suppliers.find(s => s.id === rfq.supplierId) || {name: 'Unknown Supplier'};
      return `
        <div class="p-3 rounded-lg bg-gray-50 border">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-semibold">${supplier.name}</h4>
              <p class="text-xs text-gray-500">Material: ${rfq.material || 'N/A'} • Qty: ${rfq.quantity || 'N/A'}</p>
              <p class="text-xs text-gray-500">Required by: ${rfq.requiredBy || 'N/A'}</p>
            </div>
            <span class="px-2 py-1 text-xs rounded-full ${rfq.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}">
              ${rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
            </span>
          </div>
          <p class="mt-2 text-xs text-gray-600">${rfq.details || 'No extra details provided.'}</p>
        </div>
      `;
    });
    list.innerHTML = items.join('');
  }

  document.getElementById('myRFQsModal').classList.remove('hidden');
}

function closeMyRFQsModal() {
  document.getElementById('myRFQsModal').classList.add('hidden');
}

// Toggle save supplier
function toggleSaveSupplier(supplierId) {
  const index = savedSuppliers.indexOf(supplierId);
  
  if (index > -1) {
    savedSuppliers.splice(index, 1);
  } else {
    savedSuppliers.push(supplierId);
  }
  
  localStorage.setItem('savedSuppliers', JSON.stringify(savedSuppliers));
  updateSavedCount();
  
  // Update heart icon
  const button = event.currentTarget;
  const icon = button.querySelector('i');
  icon.className = index > -1 ? 'far fa-heart' : 'fas fa-heart';
}

// Update saved count
function updateSavedCount() {
  document.getElementById('savedCount').textContent = savedSuppliers.length;
}

// Toggle compare
function toggleCompare(supplierId) {
  const index = compareList.indexOf(supplierId);
  
  if (index > -1) {
    compareList.splice(index, 1);
  } else {
    if (compareList.length < 3) {
      compareList.push(supplierId);
    } else {
      alert('You can compare maximum 3 suppliers at a time');
      event.target.checked = false;
      return;
    }
  }
  
  updateCompareSection();
}

// Update compare section
function updateCompareSection() {
  const compareSection = document.getElementById('compareSection');
  const compareCount = document.getElementById('compareCount');
  const compareListDiv = document.getElementById('compareList');
  
  if (compareList.length > 0) {
    compareSection.classList.remove('hidden');
    compareCount.textContent = `(${compareList.length} selected)`;
    
    compareListDiv.innerHTML = compareList.map(id => {
      const supplier = suppliers.find(s => s.id === id);
      return `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span class="text-sm">${supplier ? supplier.name : 'Unknown Supplier'}</span>
          <button onclick="removeFromCompare('${id}')" class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    }).join('');
  } else {
    compareSection.classList.add('hidden');
  }
}

// Remove from compare
function removeFromCompare(supplierId) {
  const index = compareList.indexOf(supplierId);
  if (index > -1) {
    compareList.splice(index, 1);
    updateCompareSection();
    
    // Uncheck the checkbox
    const checkbox = document.querySelector(`input[onchange*="${supplierId}"]`);
    if (checkbox) checkbox.checked = false;
  }
}

// Compare suppliers
function compareSuppliers() {
  if (compareList.length < 2) {
    alert('Please select at least 2 suppliers to compare');
    return;
  }
  
  // Store compare list and redirect to compare page
  localStorage.setItem('compareList', JSON.stringify(compareList));
  // window.location.href = 'compare-suppliers.html';
  alert('Compare feature coming soon! Selected suppliers: ' + compareList.join(', '));
}

// View supplier profile
function viewSupplierProfile(supplierId) {
  const supplier = suppliers.find(s => s.id === supplierId);
  if (supplier) {
    // Store supplier data and redirect to profile page
    localStorage.setItem('viewingSupplier', JSON.stringify(supplier));
    window.location.href = `suppliers.html?id=${supplier.id}`;
  }
}

// Send RFQ
function sendRFQ(supplierId) {
  currentRFQSupplier = supplierId;
  document.getElementById('rfqModal').classList.remove('hidden');
}

// Close RFQ modal
function closeRFQModal() {
  document.getElementById('rfqModal').classList.add('hidden');
  currentRFQSupplier = '';
}

// Submit RFQ
function submitRFQ(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const rfqData = {
    id: 'rfq_' + Date.now(),
    supplierId: currentRFQSupplier,
    material: formData.get('material') || event.target[0].value,
    quantity: formData.get('quantity') || event.target[1].value,
    requiredBy: formData.get('requiredBy') || event.target[2].value,
    details: formData.get('details') || event.target[3].value,
    status: 'sent',
    createdAt: new Date().toISOString()
  };
  
  // Store RFQ
  const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
  rfqs.push(rfqData);
  localStorage.setItem('rfqs', JSON.stringify(rfqs));
  
  // Show success message
  showNotification('RFQ sent successfully!', 'success');
  
  // Close modal
  closeRFQModal();
  
  // Reset form
  event.target.reset();
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 ${
    type === 'success' ? 'bg-green-500' : 'bg-blue-500'
  } text-white`;
  
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} text-2xl"></i>
    <div>
      <div class="font-bold">${type === 'success' ? 'Success!' : 'Info'}</div>
      <div class="text-sm">${message}</div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Requirement Modal Functions
function showPostRequirementModal() {
  document.getElementById('requirementModal').classList.remove('hidden');
}

function closeRequirementModal() {
  document.getElementById('requirementModal').classList.add('hidden');
}

async function submitRequirement(event) {
  event.preventDefault();
  
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'vendor') {
    showNotification('Please login as a vendor to post requirements', 'error');
    return;
  }
  
  const requirementData = {
    vendorId: user.id,
    title: document.getElementById('reqTitle').value,
    vendorName: user.businessName || user.name,
    vendorLocation: user.location || 'Location not specified',
    material: document.getElementById('reqMaterial').value,
    quantity: document.getElementById('reqQuantity').value,
    budget: parseFloat(document.getElementById('reqBudget').value),
    requiredBy: document.getElementById('reqDate').value,
    urgency: document.getElementById('reqUrgency').value,
    description: document.getElementById('reqDescription').value,
    requirementsList: document.getElementById('reqList').value
  };
  
  try {
    const response = await fetch('/api/marketplace/requirements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requirementData)
    });
    
    if (response.ok) {
      showNotification('Requirement posted successfully! Suppliers will see your needs.', 'success');
      closeRequirementModal();
      event.target.reset();
    } else {
      const error = await response.json();
      showNotification('Error posting requirement: ' + (error.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error posting requirement:', error);
    showNotification('Error posting requirement. Please try again.', 'error');
  }
}
