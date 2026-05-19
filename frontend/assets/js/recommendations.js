/**
 * Recommendation System - Frontend Integration
 * File: assets/js/recommendations.js
 * 
 * This module handles all frontend interactions with the recommendation API
 * Including fetching recommendations, displaying them, and handling user interactions
 */

class RecommendationSystem {
  constructor() {
    this.userId = this.getUserId();
    this.recommendations = [];
    this.isLoading = false;
  }

  /**
   * Extract user ID from localStorage (set during login)
   * Falls back to demo user if not logged in
   */
  getUserId() {
    // Try to get userId from localStorage (set during login)
    let userId = localStorage.getItem("userId");
    
    // If not logged in, use a demo user ID for testing
    if (!userId) {
      userId = "user1"; // Demo user for testing
      console.warn("⚠️  No userId in localStorage, using demo user:", userId);
    }
    
    return userId;
  }

  /**
   * Fetch personalized vendor recommendations
   * @param {number} limit - Number of recommendations to fetch (default: 5)
   * @returns {Promise<Array>} Array of recommended vendors
   */
  async fetchRecommendations(limit = 5) {
    if (!this.userId) {
      console.error("❌ User not authenticated");
      return [];
    }

    this.isLoading = true;

    try {
      console.log(`📊 Fetching ${limit} vendor recommendations...`);

      const response = await fetch(
        `/api/recommend/${this.userId}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.recommendations = data.recommendations;
        console.log(`✅ Received ${this.recommendations.length} recommendations`);
        return this.recommendations;
      } else {
        console.error("❌ Recommendation fetch failed:", data.message);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching recommendations:", error);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch detailed information about a specific recommended vendor
   * @param {string} vendorId - ID of the vendor
   * @returns {Promise<Object>} Vendor details with recommendation breakdown
   */
  async fetchVendorDetails(vendorId) {
    if (!this.userId) {
      console.error("❌ User not authenticated");
      return null;
    }

    try {
      const response = await fetch(
        `/api/recommend/${this.userId}/vendor/${vendorId}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Received vendor details for ${vendorId}`);
        return data;
      } else {
        console.error("❌ Failed to fetch vendor details:", data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching vendor details:", error);
      return null;
    }
  }

  /**
   * Fetch user's preference profile for recommendations
   * @returns {Promise<Object>} User's order history and preferences
   */
  async fetchUserProfile() {
    if (!this.userId) {
      console.error("❌ User not authenticated");
      return null;
    }

    try {
      const response = await fetch(`/api/recommend/stats/${this.userId}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ User profile loaded");
        return data;
      } else {
        console.error("❌ Failed to fetch user profile:", data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Display recommended vendors in the marketplace
   * Creates vendor cards with recommendation scores
   * @param {Array} vendors - Array of vendor objects
   * @param {string} containerId - ID of the container element
   */
  displayRecommendations(vendors, containerId = "recommended-vendors") {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`❌ Container #${containerId} not found`);
      return;
    }

    // Clear existing content
    container.innerHTML = "";

    if (vendors.length === 0) {
      container.innerHTML =
        '<p class="no-recommendations">No recommendations available yet. Make some purchases to get personalized recommendations!</p>';
      return;
    }

    // Create header
    const header = document.createElement("h2");
    header.textContent = "🎯 Recommended for You";
    header.className = "recommendations-header";
    container.appendChild(header);

    // Create vendor cards
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "recommendations-grid";

    vendors.forEach((vendor, index) => {
      const card = this.createVendorCard(vendor, index);
      cardsContainer.appendChild(card);
    });

    container.appendChild(cardsContainer);

    // Add event listeners to cards
    this.attachCardListeners();
  }

  /**
   * Create a vendor card element
   * @param {Object} vendor - Vendor data
   * @param {number} index - Card index for ranking
   * @returns {HTMLElement} Vendor card element
   */
  createVendorCard(vendor, index) {
    const card = document.createElement("div");
    card.className = "vendor-recommendation-card";
    card.id = `vendor-${vendor._id}`;

    // Calculate match percentage
    const matchPercent = (vendor.recommendationScore * 100).toFixed(0);

    // Determine badge color based on score
    let badgeClass = "badge-gold";
    if (vendor.recommendationScore < 0.6) badgeClass = "badge-silver";
    if (vendor.recommendationScore < 0.4) badgeClass = "badge-bronze";

    card.innerHTML = `
      <div class="vendor-card-image">
        <img src="${vendor.image || 'assets/Images/default-vendor.jpg'}" 
             alt="${vendor.shopName}" 
             onerror="this.src='assets/Images/default-vendor.jpg'">
        <div class="match-badge ${badgeClass}">
          ${matchPercent}% Match
        </div>
        <div class="ranking-badge">
          #${index + 1}
        </div>
      </div>

      <div class="vendor-card-content">
        <h3 class="vendor-name">${vendor.shopName}</h3>

        <div class="vendor-meta">
          <span class="location">📍 ${vendor.location}</span>
          <span class="rating">⭐ ${vendor.rating.toFixed(1)}</span>
        </div>

        <div class="recommendation-detail">
          <small>Why recommended?</small>
          <p class="recommendation-reason">
            Based on your purchase history and preferences
          </p>
        </div>

        <div class="vendor-card-actions">
          <button class="btn-primary view-details" 
                  data-vendor-id="${vendor._id}"
                  type="button">
            View Details
          </button>
          <button class="btn-secondary contact" 
                  data-contact="${vendor.contactNumber}"
                  type="button">
            Contact
          </button>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Attach event listeners to vendor cards
   */
  attachCardListeners() {
    // View Details buttons
    document.querySelectorAll(".view-details").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const vendorId = btn.getAttribute("data-vendor-id");
        this.showVendorModal(vendorId);
      });
    });

    // Contact buttons
    document.querySelectorAll(".contact").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const phone = btn.getAttribute("data-contact");
        console.log(`📞 Contact vendor: ${phone}`);
        // Implement contact action (phone call, WhatsApp, etc.)
        window.open(`tel:${phone}`);
      });
    });
  }

  /**
   * Show vendor details in a modal
   * @param {string} vendorId - Vendor ID
   */
  async showVendorModal(vendorId) {
    const vendorData = await this.fetchVendorDetails(vendorId);

    if (!vendorData) {
      alert("Failed to load vendor details");
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal recommendation-modal";
    modal.id = `modal-${vendorId}`;

    const vendor = vendorData.vendor;
    const breakdown = vendorData.recommendationBreakdown;
    const products = vendorData.topProducts;

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${vendor.shopName}</h2>
          <button class="modal-close" type="button">&times;</button>
        </div>

        <div class="modal-body">
          <div class="vendor-info">
            <img src="${vendor.image || 'assets/Images/default-vendor.jpg'}" 
                 alt="${vendor.shopName}"
                 class="vendor-modal-image">
            
            <div class="vendor-details">
              <p><strong>📍 Location:</strong> ${vendor.location}</p>
              <p><strong>⭐ Rating:</strong> ${vendor.rating.toFixed(1)}/5</p>
              <p><strong>📞 Contact:</strong> <a href="tel:${vendor.contactNumber}">${vendor.contactNumber}</a></p>
            </div>
          </div>

          <div class="recommendation-breakdown">
            <h3>Why You're Recommended This Vendor</h3>
            
            <div class="score-breakdown">
              <div class="score-item">
                <div class="score-label">Content-Based Match</div>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${breakdown.contentBasedScore * 100}%"></div>
                </div>
                <div class="score-value">${(breakdown.contentBasedScore * 100).toFixed(0)}%</div>
              </div>

              <div class="score-item">
                <div class="score-label">Collaborative Score</div>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${breakdown.collaborativeScore * 100}%"></div>
                </div>
                <div class="score-value">${(breakdown.collaborativeScore * 100).toFixed(0)}%</div>
              </div>

              <div class="score-item">
                <div class="score-label">Overall Recommendation</div>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${breakdown.hybridScore * 100}%"></div>
                </div>
                <div class="score-value">${(breakdown.hybridScore * 100).toFixed(0)}%</div>
              </div>
            </div>

            <div class="score-explanations">
              <p><strong>Content-Based:</strong> ${breakdown.explanation.contentBased}</p>
              <p><strong>Collaborative:</strong> ${breakdown.explanation.collaborative}</p>
            </div>
          </div>

          ${
            products && products.length > 0
              ? `
            <div class="top-products">
              <h3>Popular Products from this Vendor</h3>
              <div class="products-list">
                ${products
                  .map(
                    (p) => `
                  <div class="product-item">
                    <span class="product-name">${p.name}</span>
                    <span class="product-category">${p.category}</span>
                    <span class="product-price">₹${p.price}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" type="button" data-action="close">Close</button>
          <button class="btn-primary" type="button" data-action="contact">
            Contact Vendor
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal
    modal.querySelector(".modal-close").addEventListener("click", () => {
      modal.remove();
    });

    modal
      .querySelector('[data-action="close"]')
      .addEventListener("click", () => {
        modal.remove();
      });

    // Contact vendor
    modal
      .querySelector('[data-action="contact"]')
      .addEventListener("click", () => {
        window.open(`tel:${vendor.contactNumber}`);
      });

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Display user's preference profile
   * @param {string} containerId - ID of the container element
   */
  async displayUserProfile(containerId = "user-profile") {
    const profile = await this.fetchUserProfile();

    if (!profile) {
      console.error("Failed to load user profile");
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    const history = profile.orderHistory;
    const prefs = profile.preferences;

    container.innerHTML = `
      <div class="profile-section">
        <h3>Your Recommendation Profile</h3>
        
        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-value">${history.totalOrders}</div>
            <div class="stat-label">Total Orders</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">₹${history.totalSpent}</div>
            <div class="stat-label">Total Spent</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${history.uniqueSuppliers}</div>
            <div class="stat-label">Suppliers</div>
          </div>
        </div>

        <div class="profile-preferences">
          <h4>Your Categories</h4>
          <div class="categories">
            ${prefs.favoriteCategories.map((cat) => `<span class="category-tag">${cat}</span>`).join("")}
          </div>

          <h4>Price Range</h4>
          <p>Min: ₹${prefs.priceRange.min} | Avg: ₹${prefs.priceRange.average.toFixed(0)} | Max: ₹${prefs.priceRange.max}</p>
        </div>
      </div>
    `;
  }
}

// Initialize recommendation system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.recommendationSystem = new RecommendationSystem();
  console.log("✅ Recommendation System initialized");
});
