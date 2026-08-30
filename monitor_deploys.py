import urllib.request, json, time, sys

api_key = 'rnd_djsScE3n1nHrguSk9FrjwxA3aaVn'
services = [
    {'name': 'Backend', 'id': 'srv-daa8kMbpf2nfc73917sog', 'url': 'https://baghewala-digital-twin-backend.onrender.com/health'},
    {'name': 'Frontend', 'id': 'srv-daa8lgss728c73fnan20', 'url': 'https://baghewala-digital-twin-frontend.onrender.com'}
]


for attempt in range(30):
    all_live = True
    print(f'\n--- Checking Deployment Status (Attempt {attempt+1}/30) ---')
    for s in services:
        req = urllib.request.Request(
            f"https://api.render.com/v1/servicer/{s['id']}/deploys?limit=1",
            headers={'Authorization': f'Bearer {api_key}', 'Accept': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                deploys = json.loads(resp.read().decode('utf-8'))
                if deploys:
                    d = deploys[0].get('deploy', {})
                    st = d.get('status', 'unknown')
                    print(f"[{s['name']}] Status: {st}")
                    if st != 'live':
                        all_live = False
        except Exception as e:
            print(f"[{s['name']}] Error: +e}")
            all_live = False

    if all_live:
        print('\n^>> ALL SERVICES ARE LIVE ON RENDER!! <<<')
        break
    time.sleep(15)
