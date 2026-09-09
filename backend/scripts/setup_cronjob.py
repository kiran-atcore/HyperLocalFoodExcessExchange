"""
Utility script to create or update a keep-alive ping monitor on cron-job.org via their API v2.
Usage:
    python setup_cronjob.py [API_KEY]
"""

import sys
import json
import urllib.request
import urllib.error

TARGET_URL = "https://hyperlocalfoodexcessexchange.onrender.com/health/"
CRON_API_URL = "https://api.cron-job.org/jobs"

def create_cron_job(api_key: str):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    # Schedule every 10 minutes: minutes: [0, 10, 20, 30, 40, 50]
    payload = {
        "job": {
            "url": TARGET_URL,
            "title": "ResQ Backend Keep-Alive",
            "enabled": True,
            "saveResponses": False,
            "schedule": {
                "timezone": "UTC",
                "hours": [-1],
                "mdays": [-1],
                "minutes": [0, 10, 20, 30, 40, 50],
                "months": [-1],
                "wdays": [-1]
            }
        }
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(CRON_API_URL, data=data, headers=headers, method='PUT')

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print(f"Success! Cron job configured on cron-job.org:")
            print(res_body)
    except urllib.error.HTTPError as e:
        print(f"Error ({e.code}): {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Failed to connect to cron-job.org API: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        key = sys.argv[1].strip()
    else:
        key = input("Enter your cron-job.org API Key: ").strip()

    if not key:
        print("API key cannot be empty.")
        sys.exit(1)

    create_cron_job(key)
