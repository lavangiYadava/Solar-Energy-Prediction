import requests

latitude = 39.745
longitude = -97.0892

response = requests.get(f'https://api.weather.gov/points/{latitude},{longitude}')
data = response.json()


forecast_url = data["properties"]["forecastHourly"]
forecast_resp = requests.get(forecast_url).json()

# Access properties
properties = data.get("properties", {})

# city = properties.get("relativeLocation", {}).get("properties", {}).get("city")
# state = properties.get("relativeLocation", {}).get("properties", {}).get("state")
forecast_url = properties.get("forecast")
forecast_hourly_url = properties.get("forecastHourly")
#
# print(f"City: {city}")
# print(f"State: {state}")
# print(f"Forecast URL: {forecast_url}")
print(f"Hourly Forecast URL: {forecast_hourly_url}")
