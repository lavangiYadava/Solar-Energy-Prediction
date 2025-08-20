from functools import wraps
import datetime
from datetime import datetime, timedelta, timezone
import jwt
import requests
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from functions import User
from dateutil import parser
from datetime import timezone
from model import get_pipeline


app = Flask(__name__)
CORS(app)
ALGORITHM = "HS256"
# you may put your secret key here
SECRET_KEY = "x"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


@app.before_request
def init_g():
    g.username = None


def parse_iso_aware(s: str) -> datetime:
    return parser.isoparse(s).astimezone(timezone.utc)

@app.route("/", methods=["GET"])
def home():
    return "Welcome!", 200


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
   # print("Request received:", data)
    token1 = data.get('token')
    try:
        # when an application is recieving/sending requests, a unique clientID is established
        # you may put your client id here
        CLIENT_ID = "x"
       # print("hello")

        # this returns the decoded token information
        info = id_token.verify_oauth2_token(token1, google_requests.Request(), CLIENT_ID)

        # parse through data for information
        email = info.get('email')
       # print("Email:", email)

        username = info.get('name', 'unknown')
      #  print("Username:", username)
        g.username = username

        google_sub = info.get('sub')
       # print("Google Sub:", google_sub)

        # save in data base function
        newUser = User(username, email, google_sub)
        status_code = newUser.save_user()

        # Create JWT token
        payload = {
            'sub': google_sub,
            'exp': datetime.now(timezone.utc) + timedelta(hours=1)
        }
        jwt_token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        if status_code == 0:
            return jsonify({'token': jwt_token, 'username': username, 'status': 'login'})
        elif (status_code == 1):
            return jsonify({'token': jwt_token, 'username': username, 'status': 'signup'})
    except Exception as e:
       # print("Login error:", e)
        return jsonify({'error': str(e)}), 400


# for accessing and requesting new pages/sources, authorize
def require_auth(func):
    # preserve data from original function when a new one is made from its copy
    @wraps(func)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace("Bearer ", "")
       # print("here!!")
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            google_requests.google_sub = decoded['sub']
        except jwt.ExpiredSignatureError:
         #   print("expired!!")
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
           # print("invalid!!")
            return jsonify({'error': 'Invalid token'}), 401
        # this will return the actual value from the function

        g.username = decoded.get('sub')
        print(g.username)
        return func(*args, **kwargs)

    return decorated


@app.route("/standard_info", methods=["POST"])
@require_auth
def info():
   # print("here")
    data = request.get_json()

    try:
        latitude = data.get("lat")
        longitude = data.get("lng")
        altitude = data.get("altitude_m")

        if User.standard_information(longitude, latitude, altitude, g.username) == User.success:
            return jsonify({"message": "update success"}), 200
        else:
            return jsonify({"message": "update failed"}), 401
    except Exception as e:
        print("error:", e)
        return jsonify({'error': str(e)}), 401


def datetime_from_iso(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


@app.route("/forecast_information", methods=["POST"])
@require_auth
def forecast_information():
    user_data = request.get_json()
    print(g.username)
    result = User.get_long_and_lat(g.username)

    latitude = result[0]
    longitude = result[1]
    altitude = result[2]
    date = user_data.get("date")
    visibility = user_data.get("visibility")
    pressure = user_data.get("pressure")
    cloud_ceiling = user_data.get("cloud_ceiling")
    User.dynamic_input(visibility, pressure, cloud_ceiling, date, g.username)
    target_dt = datetime_from_iso(date)

    try:
        weather_forecast_data = requests.get(f'https://api.weather.gov/points/{latitude},{longitude}').json()
        forecast_url = weather_forecast_data["properties"]["forecastHourly"]
        forecast_resp = requests.get(forecast_url).json()

        periods = forecast_resp['properties']['periods']

        closest = min(periods, key=lambda p: abs(parse_iso_aware(p['startTime']) - target_dt.astimezone(timezone.utc)))
        period_time = closest["startTime"]
        temp = closest["temperature"]
        humidity = closest["relativeHumidity"]["value"]

        wind_speed = closest["windSpeed"]
        speed_float = float(wind_speed.split()[0])


        print("i am here")
        val = User.get_prediction(period_time, temp, humidity, speed_float, g.username)
        if val == User.error:
            print("error here")
            return jsonify(({"error"})), 400
        else:
            print("success")
            return jsonify({"value": val})
    except Exception as e:
        print("error:", e)
        return jsonify({'error': str(e)}), 401


@app.route("/dynamic_forecast_information", methods=["POST"])
# @require_auth
def dynamic_forecast_information():
    data = request.get_json()
    visibility = data.get("visibility")
    pressure = data.get("pressure")
    cloud_ceiling = data.get("cloud_ceiling")
    date = data.get("date")
    print(g.username)

    User.dynamic_input(visibility, pressure, cloud_ceiling, date, g.username)
    return jsonify({"success": True}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=3500)


