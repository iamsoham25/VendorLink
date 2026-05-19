import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

# Load dataset
df = pd.read_csv('Street_Food_Raw_Material_Prices_in_India.csv')

# Prepare data
le_season = LabelEncoder()
le_location = LabelEncoder()
le_product = LabelEncoder()

df['Season_encoded'] = le_season.fit_transform(df['Season'])
df['Location_encoded'] = le_location.fit_transform(df['Location'])
df['Product_encoded'] = le_product.fit_transform(df['Product'])

X = df[['Product_encoded', 'Season_encoded', 'Location_encoded']]
y = df['Price (₹)']

# Train test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"Model R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.2f}")

# Save model and encoders
joblib.dump(model, 'price_model.pkl')
joblib.dump(le_product, 'le_product.pkl')
joblib.dump(le_season, 'le_season.pkl')
joblib.dump(le_location, 'le_location.pkl')

# Save unique values
unique_products = list(df['Product'].unique())
unique_seasons = list(df['Season'].unique())
unique_locations = list(df['Location'].unique())

print("Model trained and saved successfully!")
print(f"Products: {len(unique_products)}")
print(f"Seasons: {len(unique_seasons)}")
print(f"Locations: {len(unique_locations)}")
