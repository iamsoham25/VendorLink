// LOAD REVIEWS
async function loadReviews(supplierId) {
  const res = await fetch(`http://localhost:5000/api/reviews/supplier/${supplierId}`);
  const reviews = await res.json();

  const container = document.getElementById("reviewsContainer");
  container.innerHTML = "";

  reviews.forEach(r => {
    container.innerHTML += `
      <div class="p-3 rounded border bg-gray-50 dark:bg-gray-700">
        <p class="font-semibold">${"⭐".repeat(r.rating)}</p>
        <p class="text-sm text-gray-300">${r.userId?.name || "User"}</p>
        <p>${r.comment}</p>
      </div>
    `;
  });
}

// ADD REVIEW
async function addReview() {
  const token = localStorage.getItem("token");
  const supplierId = localStorage.getItem("currentSupplier");

  const rating = document.getElementById("rating").value;
  const comment = document.getElementById("comment").value;

  const res = await fetch("http://localhost:5000/api/reviews/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ supplierId, rating, comment })
  });

  const data = await res.json();
  alert(data.message);

  loadReviews(supplierId);
}
