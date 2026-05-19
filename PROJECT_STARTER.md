# Project Starter — VendorLink

You need **2 terminals** running at the same time.

---

## Terminal 1 — ML Price API (Flask)

```bash
cd ml_price_api
```

```bash
pip install -r requirements.txt
```

```bash
python app.py
```

✅ Flask runs on **http://127.0.0.1:5001**

---

## Terminal 2 — Main Server (Node.js)

```bash
cd server
```

```bash
npm install
```

```bash
npm run dev
```

✅ VendorLink runs on **http://localhost:5000**

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Vendor | `john@example.com` | `password123` |
| Supplier | `alice@restaurant.com` | `password123` |
| Customer | `bob@shop.com` | `password123` |

---

> ⚠️ Start **Terminal 1 (Flask) first**, then **Terminal 2 (Node.js)**.
> Both must be running at the same time for AI price prediction to work.
