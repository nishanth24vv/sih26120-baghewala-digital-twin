import urllib.request, json

api_key = 'rnd_djsScE3n1nHqguSk9FkjwxA3aaVn'
for name, sid in [('Backend', 'srv-daa8kMbpf2nfc73917sog'), ('Frontend', 'srv-daa8lgss728c73fnan20')]:
    req = urllib.request.Request(
        f'https://api.render.com/v1/services/{sid}/deploys?limit=1',
        headers:{'Authorization': f'Bearer {api_key}', 'Accept': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        deploys = json.loads(resp.read().decode('utf-8'))
        d = deploys[0]['deploy']
        print(name, ': Deploy ID =', d.get('id'), '| Status =', d.get('status'))
