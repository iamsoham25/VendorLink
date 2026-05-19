// Load options on page load
document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    setupFormListener();
});

// Fetch and populate dropdown options
async function loadOptions() {
    try {
        const response = await fetch('/api/options');
        const data = await response.json();
        
        // Populate dropdowns
        populateSelect('product', data.products);
        populateSelect('season', data.seasons);
        populateSelect('location', data.locations);
    } catch (error) {
        showError('Failed to load options: ' + error.message);
    }
}

function populateSelect(elementId, options) {
    const select = document.getElementById(elementId);
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

// Setup form submission
function setupFormListener() {
    document.getElementById('predictionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        clearError();
        
        const product = document.getElementById('product').value;
        const season = document.getElementById('season').value;
        const location = document.getElementById('location').value;
        
        if (!product || !season || !location) {
            showError('Please select all fields');
            return;
        }
        
        await makePrediction(product, season, location);
    });
}

// Make prediction API call
async function makePrediction(product, season, location) {
    const button = document.querySelector('.btn-predict');
    button.disabled = true;
    button.textContent = 'Predicting...';
    
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product: product,
                season: season,
                location: location
            })
        });
        
        if (!response.ok) {
            throw new Error('Prediction failed');
        }
        
        const result = await response.json();
        displayResult(result);
    } catch (error) {
        showError('Error: ' + error.message);
        button.disabled = false;
        button.textContent = 'Predict Price';
    }
}

// Display prediction result
function displayResult(result) {
    const formContainer = document.querySelector('.form-container');
    const resultContainer = document.getElementById('resultContainer');
    
    // Hide form, show results
    formContainer.style.display = 'none';
    resultContainer.classList.remove('hidden');
    
    // Fill in result data
    document.getElementById('resultProduct').textContent = result.product;
    document.getElementById('resultSeason').textContent = result.season;
    document.getElementById('resultLocation').textContent = result.location;
    document.getElementById('predictedPrice').textContent = result.predicted_price.toFixed(2);
    
    // Show actual average if available
    const actualBox = document.getElementById('actualAvgBox');
    if (result.actual_average) {
        actualBox.classList.remove('hidden');
        document.getElementById('actualPrice').textContent = result.actual_average.toFixed(2);
        
        const difference = result.predicted_price - result.actual_average;
        const diffPercentage = ((difference / result.actual_average) * 100).toFixed(2);
        
        const diffElement = document.getElementById('difference');
        diffElement.className = 'difference';
        
        if (Math.abs(difference) < 1) {
            diffElement.textContent = '✓ Very close match!';
            diffElement.style.color = '#27AE60';
        } else if (difference > 0) {
            diffElement.classList.add('positive');
            diffElement.textContent = `↑ ${diffPercentage}% higher than actual`;
        } else {
            diffElement.classList.add('negative');
            diffElement.textContent = `↓ ${Math.abs(diffPercentage)}% lower than actual`;
        }
    }
}

// Reset form
function resetForm() {
    document.getElementById('predictionForm').reset();
    document.querySelector('.form-container').style.display = 'block';
    document.getElementById('resultContainer').classList.add('hidden');
    const button = document.querySelector('.btn-predict');
    button.disabled = false;
    button.textContent = 'Predict Price';
    clearError();
}

// Error handling
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
}
