import urllib.request, json, ssl

ctx = ssl.create_default_context()
base = 'https://baghewala-digital-twin-backend.onrender.com'

# 1. Health
print('1. GET /health')
with urllib.request.urlopen(base + '/health', context=ctx) as r:
    print('   ->', json.loads(r.read().decode('utf-8')))

# 2. Wells
print('2. GET /api/v1/wells')
with urllib.request.urlopen(base + '/api/v1/wells', context=ctx) as r:
    wells = json.loads(r.read().decode('utf-8'))
    print('   ->', len(wells), 'wells active')

# 3. CSS Predict
print('3. POST /api/v1/css/predict')
css_p = json.dumps({'well_id': 'BGW-001', 'steam_volume': 85.0, 'injection_pressure': 18.0, 'soak_time': 72.0, 'production_cutoff': 30.0}).encode('utf-8')
req = urllib.request.Request(base + '/api/v1/css/predict', data=css_p, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, context=ctx) as r:
    res = json.loads(r.read().decode('utf-8'))
    print('   -> Peak Temp:', res['peak_temperature'], 'C | Predicted Oil Rate:', res['predicted_oil_rate'], 'BOPD | Predicted SOR:', res['predicted_sor'])

# 4. SRP Predict
print('4. POST /api/v1/srp/predict')
srp_p = json.dumps({'well_id': 'BGW-001', 'stroke_length': 72.0, 'spm': 3.8, 'vfd_frequency': 38.0}).encode('utf-8')
req = urllib.request.Request(base + '/api/v1/srp/predict', data=srp_p, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, context=ctx) as r:
    res = json.loads(r.read().decode('utf-8'))
    print('   -> PPRL:', res['pprl'], 'kN | MPRL:', res['mprl'], 'kN | Scaled Load Ratio:', res.get('scaled_load_ratio'), '| Dynacard:', res['dynacard']['card_type'])

# 5. Joint Optimizer
print('5. POST /api/v1/optimize')
opt_p = json.dumps({'well_id': 'BGW-001', 'grid_density': 'coarse'}).encode('utf-8')
req = urllib.request.Request(base + '/api/v1/optimize', data=opt_p, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, context=ctx) as r:
    res = json.loads(r.read().decode('utf-8'))
    print('   -> Optimization ID:', res.get('optimization_id'))
    print('   -> Recommended Parameters:', res.get('recommended_parameters'))
    print('   -> Objective Score:', res.get('objective_score'))
    print('   -> AI Rationale:', res.get('ai_explanation', {}).get('summary'))

# 6. Simulate Sandbox
print('6. POST /api/v1/simulate')
sim_p = json.dumps({
    'well_id': 'BGW-001', 'steam_volume': 90.0, 'injection_pressure': 19.0, 'soak_time': 72.0,
    'production_cutoff': 30.0, 'stroke_length': 72.0, 'spm': 3.7, 'vfd_frequency': 37.0
}).encode('utf-8')
req = urllib.request.Request(base + '/api/v1/simulate', data=sim_p, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, context=ctx) as r:
    res = json.loads(r.read().decode('utf-8'))
    print('   -> Simulated State for', res['well_id'], ': Temp', res['reservoir']['temperature'], 'C | Oil Rate', res['production']['oil_rate'], 'BOPD')

# 7. Model Performance
print('7. GET /api/v1/models/performance')
with urllib.request.urlopen(base + '/api/v1/models/performance', context=ctx) as r:
    res = json.loads(r.read().decode('utf-8'))
    print('   -> Loaded Models:', list(res.get('models', {}).keys()))
