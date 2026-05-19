import { api } from "./api.js";
import { requireSupplier } from "./protect.js";

requireSupplier();

const ordersCountEl = document.getElementById("ordersCount");
const revenueEl = document.getElementById("revenue");
const topProductEl = document.getElementById("topProduct");

async function loadAnalytics() {
  const data = await api("/analytics/supplier", "GET", null, true);

  ordersCountEl.textContent = data.totalOrders;
  revenueEl.textContent = "₹" + data.revenue;
  topProductEl.textContent = data.topProducts[0]?.name || "No products added";

  // Chart data
  const labels = Object.keys(data.monthlyRevenue);
  const values = Object.values(data.monthlyRevenue);

  new Chart(document.getElementById("revenueChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: values,
          borderColor: "#d97706",
          backgroundColor: "rgba(217, 119, 6, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
  });
}

loadAnalytics();
