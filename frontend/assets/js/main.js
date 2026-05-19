async function loadProducts() {
    const res = await fetch("http://localhost:5000/api/products");
    const products = await res.json();

    let html = "";
    products.forEach(p => {
        html += `
            <div class="product-card">
                <img src="${p.image}" />
                <h3>${p.name}</h3>
                <p>Price: ₹${p.price}</p>
            </div>
        `;
    });

    document.getElementById("product-list").innerHTML = html;
}

loadProducts();
