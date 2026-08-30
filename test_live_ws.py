import asyncio, websockets, json

async def test_ws():
    uri = 'wss://baghewala-digital-twin-backend.onrender.com/api/v1/telemetry/ws/BGW-001'
    print('Connecting to live WebSocket at', uri)
    async with websockets.connect(uri) as ws:
        for i in range(3):
            msg = await ws.recv()
            data = json.loads(msg)
            print('- Tick', i+1, '| Well:', data.get('well_id'), '| Rod Load:', data.get('surface_rod_load'), 'kN, Float Risk:', data.get('rod_floating_risk'))
        print('WEBSOCKET VERIFIED SUCCESSFULLY!')

asyncio.run(test_ws())
