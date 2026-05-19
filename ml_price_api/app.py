# ml_price_api/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

# app = Flask(__name__)
# CORS(app)  # allow requests from your frontend

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # Load model + encoders
# model = joblib.load(os.path.join(BASE_DIR, "price_model.pkl"))
# le_product = joblib.load(os.path.join(BASE_DIR, "le_product.pkl"))
# le_season = joblib.load(os.path.join(BASE_DIR, "le_season.pkl"))
# le_location = joblib.load(os.path.join(BASE_DIR, "le_location.pkl"))

# # Load dataset to calculate actual average price (optional)
# df = pd.read_csv(os.path.join(BASE_DIR, "Street_Food_Raw_Material_Prices_in_India.csv"))

# # Unique values (if needed later)df = pd.read_csv('Street_Food_Raw_Material_Prices_in_India.csv')
# unique_products = sorted(df["Product"].dropna().unique().tolist())
# unique_seasons = sorted(df["Season"].dropna().unique().tolist())
# unique_locations = sorted(df["Location"].dropna().unique().tolist())

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load model + encoders
model      = joblib.load(os.path.join(BASE_DIR, "price_model.pkl"))
le_product = joblib.load(os.path.join(BASE_DIR, "le_product.pkl"))
le_season  = joblib.load(os.path.join(BASE_DIR, "le_season.pkl"))
le_location= joblib.load(os.path.join(BASE_DIR, "le_location.pkl"))

# Load dataset
df = pd.read_csv(os.path.join(BASE_DIR, "Street_Food_Raw_Material_Prices_in_India.csv"))

unique_products  = sorted(df["Product"].dropna().unique().tolist())
unique_seasons   = sorted(df["Season"].dropna().unique().tolist())
unique_locations = sorted(df["Location"].dropna().unique().tolist())



@app.route("/meta", methods=["GET"])
def meta():
  """Returns available products, seasons, locations."""
  return jsonify({
      "products": unique_products,
      "seasons": unique_seasons,
      "locations": unique_locations,
  })


@app.route("/predict", methods=["POST"])
def predict():
  try:
    data = request.get_json()

    product = data.get("product")
    season = data.get("season")
    location = data.get("location")

    if not product or not season or not location:
      return jsonify({"error": "product, season and location are required"}), 400

    # Encode
    product_enc = le_product.transform([product])[0]
    season_enc = le_season.transform([season])[0]
    location_enc = le_location.transform([location])[0]

    X = np.array([[product_enc, season_enc, location_enc]])
    predicted_price = model.predict(X)[0]

    # actual average from dataset (optional)
    subset = df[
        (df["Product"] == product) &
        (df["Season"] == season) &
        (df["Location"] == location)
    ]
    actual_avg = subset["Price (₹)"].mean()
    if np.isnan(actual_avg):
      actual_avg = None

    return jsonify({
        "product": product,
        "season": season,
        "location": location,
        "predicted_price": round(float(predicted_price), 2),
        "actual_average": round(float(actual_avg), 2) if actual_avg is not None else None
    })
  except Exception as e:
    return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
  # use 5001 so it doesn't clash with Node.js (5000)
  app.run(debug=True, port=5001)


