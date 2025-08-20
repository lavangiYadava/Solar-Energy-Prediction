import string
import bcrypt
import psycopg2
from model import get_pipeline, predict_power
from fastapi.security import OAuth2PasswordBearer

oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")
import datetime
from datetime import datetime

# from backEnd import model

connection = psycopg2.connect(
    user='x',
    password='x',
    host='x',
    port=x,
    database='xr'
)

cursor = connection.cursor()
query = ""


class User:
    success = 1
    error = 0

    def __init__(self, username, email, google_sub):
        self.username = username
        self.email = email
        self.google_sub = google_sub

    def save_user(self):
        print("called.")
        # Check if user already exists
        cursor.execute('SELECT * FROM "user" WHERE email = %s', (self.email,))
        existing_user = cursor.fetchone()

        if existing_user:
            print("User already exists.")
            return 0  # login (existing user)

        # Insert new user
        query = """
            INSERT INTO "user" (username, email, google_sub)
            VALUES (%s, %s, %s)
            """
        cursor.execute(query, (self.username, self.email, self.google_sub))
        connection.commit()
        print("New user inserted!")
        return 1  # sign-up (new user)

    def find_by_email(self, email):
        query = "SELECT * FROM user WHERE email = %s"
        cursor.execute(query, (email,))
        return cursor.fetchone()

    def set_location(self, longitude: float, latitude: float, altitude: float):
        self.longitude = longitude
        self.latitude = latitude
        self.altitude = altitude

    @classmethod
    def hash_password(cls, password) -> string:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt)

    @classmethod
    def create_account(cls, username: str, email: str, password: str) -> int:
        cursor.execute('SELECT 1 FROM "user" WHERE username = %s;', (username,))

        if cursor.fetchone() is not None:
            print("Username exists in database, user cannot be created.")
            return User.error
        else:
            try:
                hashed_password = cls.hash_password(password).decode('utf-8')

                cursor.execute(
                    'INSERT INTO "user" (username, email, password) VALUES (%s, %s, %s);',
                    (username, email, hashed_password)
                )
                connection.commit()
                return User.success
            except Exception as e:
                connection.rollback()
                print(f"Error inserting user: {e}")
                return User.error

    def log_in(username: str, password: str) -> int:
        # if credentials match, return success
        cursor.execute('SELECT password FROM "user" WHERE username = %s;', (username,))
        result = cursor.fetchone()
        if result:
            stored_hashed_password = result[0].encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password):
                return User.success
        return User.error

    @classmethod
    def standard_information(cls, long: float, lat: float, alt: float, username: str):
        cursor.execute('UPDATE "user" SET longitude=%s, latitude=%s, altitude=%s WHERE google_sub=%s',
                       (long, lat, alt, username))
        connection.commit()
        return User.success

    @classmethod
    def get_prediction(cls, time: str, temp: float, humidity: float, wind_speed: float, username: str):
        long_lat = User.get_long_and_lat(username)
        print("i am here 1")
        dt = datetime.fromisoformat(time)
        dynamic_values = User.get_dynamic_input(username, dt)
        longitude = long_lat[0]
        latitude = long_lat[1]
        altitude = long_lat[2]
        visibility = dynamic_values[0]
        cloud_ceiling = dynamic_values[1]
        pressure = dynamic_values[2]
        print("i am here 1")
        YR = f"{dt.year:04d}"
        MO = f"{dt.month:02d}"
        DA = f"{dt.day:02d}"
        HR = f"{dt.hour:02d}"
        MI = f"{dt.minute:02d}"

        proper_time = dt.hour * 100 + dt.minute

        YRMODAHRMI = int(YR + MO + DA + HR + MI)
        date = YR + MO + DA

        formatted = f"{YRMODAHRMI:.5E}"

        print("made it here")
        print(date)
        print(proper_time)
        print(HR)
        print(latitude)
        print(longitude)
        print(altitude)
        print(MO)
        print(humidity)
        print(temp)
        print(wind_speed)
        print(visibility)
        print(pressure)
        print(cloud_ceiling)
        print(formatted)
        print("i am here 2")
        features = {
            'Date': date,  # e.g., 20250131
            'Time': proper_time,  # e.g., 1533
            'Latitude': latitude,
            'Longitude': longitude,
            'Altitude': altitude,
            'YRMODAHRMI': YRMODAHRMI,
            'Month': MO,
            'Hour': HR,
            'Humidity': humidity,
            'AmbientTemp': temp,
            'Wind.Speed': wind_speed,
            'Visibility': visibility,
            'Pressure': pressure,
            'Cloud.Ceiling': cloud_ceiling,
        }

        pipe = get_pipeline()  # loads saved model or trains once on first call
        value = predict_power(pipeline=pipe, **features)

        print(value)
        return value

    @classmethod
    def get_long_and_lat(cls, username: str):
        cursor.execute('SELECT latitude, longitude, altitude FROM "user" WHERE google_sub=%s;',
                       (username,))
        result = cursor.fetchone()
        if result:
            latitude, longitude, altitude = result
            return latitude, longitude, altitude
        return User.error

    @classmethod
    def dynamic_input(cls, visibility: float, cloudCeiling: float, pressure: float, date: datetime, username: str):

        print(visibility)
        print(cloudCeiling)
        print(pressure)
        cursor.execute(
            'INSERT INTO "data" (visibility, cloud_ceiling, pressure, date, username) VALUES (%s, %s, %s, %s, %s);',
            (visibility, cloudCeiling, pressure, date, username)
        )
        connection.commit()

    @classmethod
    def get_dynamic_input(cls, username: str, date_given: datetime):
        cursor.execute(
            'SELECT visibility, pressure, cloud_ceiling FROM "data" WHERE username = %s AND date = %s;',
            (username, datetime.date(date_given))
        )

        result = cursor.fetchone()
        if result:
            visibility, cloud_ceiling, pressure = result
            return result
