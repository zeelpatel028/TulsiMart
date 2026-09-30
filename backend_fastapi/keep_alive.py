import os
import time
import requests
from datetime import datetime

# URL of your Render backend health check endpoint
RENDER_URL = os.environ.get(
    "RENDER_BACKEND_URL",
    "https://tulsi-mart-backend.onrender.com/api/health/light"
)

# Interval in seconds (default 60 seconds)
PING_INTERVAL = int(os.environ.get("PING_INTERVAL", "60"))

def ping_server():
    """
    Sends an HTTP GET request to the Render backend server to keep it active.
    """
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        response = requests.get(RENDER_URL, timeout=10)
        if response.status_code == 200:
            print(f"[{now}] SUCCESS: Server pinged successfully! Status: {response.status_code}")
        else:
            print(f"[{now}] WARNING: Received status code {response.status_code}")
    except requests.exceptions.RequestException as err:
        print(f"[{now}] ERROR: Failed to reach server: {err}")

def main():
    print("=" * 60)
    print("🚀 Tulsi Mart Render Keep-Alive Auto-Ping Service Started")
    print(f"Target URL : {RENDER_URL}")
    print(f"Ping Interval: Every {PING_INTERVAL} seconds")
    print("=" * 60)
    
    # Run loop
    while True:
        ping_server()
        time.sleep(PING_INTERVAL)

if __name__ == "__main__":
    main()
