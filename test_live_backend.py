import urllib.request, json, ssl

ctx = ssl.create_default_context()
base = 'https://baghewala-digital-twin-backend.onrender.com'

print('1. Testing /health...')
with urllib.request.urlopen(f'{base}/health', context=ctx) as resp:
    print('Health Response:', json.loads(resp.read().decode('utf-8')))

print('\n2. Testing /api/v1/wells...')
with urllib.request.urlopen(f'{base}/api/v1/wells', context=ctx) as resp:
    wells = json.loads(resp.read().decode('utf-8'))
    print(f'Retrieved {len(wells)} wells from deployed database:')
    for w in wells[:3]:
        print(' -', w.get('well_id'), '|', w.get('name'), '| Visc:', w.get('current_viscosity'), 'cP')

print('\n3. Testing /api/v1/wells/BGW-001/state...')
with urllib.request.urlopen(f'{base}/api/v1/wells/BGW-001/state', context=ctx) as resp:
    state = json.loads(resp.read().decode('utf-8'))
    print('BGW-001 Twin State:')
    print(' - Reservoir Temp:', state['reservoir']['current_temperature_c'], 'C')
    print(' - SRP P:', state['srp']['pprl_kn'], 'kN, M', state['srp']['mprl_kn'], 'cN')
    print(' - Scaled Load Ratio:', state['srp'].get('scaled_load_ratio'), '| PRHP:', state['srp'].get('prhp_kw'), 'kW')
    print(' - Floating Risk:', round(state['risk']['nod_floating_probability'] * 100, 1), '%')

print('\n4. Testing /api/v1/optimize on BGW-001...')
opt_payload = json.dumps({'well_id': 'BGW-001', 'grid_density': 'coarse'}).encode('utf-8')
opt_req = urllib.request.Request(f'{base}/api/v1/optimize', data=opt_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(opt_req, context=ctx) as resp:
    opt_res = json.loads(resp.read().decode('utf-8'))
    print('Joint Optimizer Result:')
    print(' - Optimization ID:', opt_res.get('optimization_id'))
    print(' - Recommended Parameters:', opt_res.get('recommended_parameters'))
    print(' - Target Objective Score:', opt_res.get('objective_score'))
    print(' - Rationale:', opt_res.get('ai_explanation', {}).get('summary'))
