import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.main import app
from database.init_db import init_db

client = TestClient(app)

def setup_module(module):
    init_db()

def test_health_endpoint():
    response = client.get('/health')
    assert response.status_code == 200
    data = response.json()
    assert 'status' in data
    assert 'database' in data
    assert 'model' in data

def test_full_application_workflow():
    auth_resp = client.post('/api/auth/login', json={
        'email': 'admin@smartcity.gov',
        'password': 'Admin@123'
    })
    assert auth_resp.status_code == 200, f'Authority login failed: {auth_resp.text}'
    auth_token = auth_resp.json()['access_token']
    authority_headers = {'Authorization': f'Bearer {auth_token}'}

    work_resp = client.post('/api/auth/login', json={
        'email': 'worker1@smartcity.gov',
        'password': 'Worker@123'
    })
    assert work_resp.status_code == 200, f'Worker login failed: {work_resp.text}'
    worker_token = work_resp.json()['access_token']
    worker_headers = {'Authorization': f'Bearer {worker_token}'}

    test_img_path = ROOT_DIR / 'backend' / 'tests' / 'test_road.jpg'
    test_img_path.parent.mkdir(parents=True, exist_ok=True)
    import cv2, numpy as np
    dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(dummy_img, 'Test Pothole', (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.imwrite(str(test_img_path), dummy_img)

    with open(test_img_path, 'rb') as img_file:
        pub_resp = client.post(
            '/api/public/reports',
            files={'image': ('test_road.jpg', img_file, 'image/jpeg')},
            data={
                'latitude': 17.3850,
                'longitude': 78.4867,
                'location_name': 'MG Road, Zone 1',
                'description': 'Severe pothole near traffic junction.'
            }
        )
    assert pub_resp.status_code == 200, f'Public report failed: {pub_resp.text}'
    report_data = pub_resp.json()
    report_id = report_data['report_id']
    issue_id = report_data['id']
    assert report_id.startswith('REP-')

    track_resp = client.get(f'/api/public/track/{report_id}')
    assert track_resp.status_code == 200
    assert track_resp.json()['report_id'] == report_id

    issues_resp = client.get('/api/authority/issues', headers=authority_headers)
    assert issues_resp.status_code == 200
    assert any(i['id'] == issue_id for i in issues_resp.json())

    workers_resp = client.get('/api/workers', headers=authority_headers)
    assert workers_resp.status_code == 200
    workers = workers_resp.json()
    assert len(workers) > 0
    worker_id = workers[0]['id']

    assign_resp = client.post(
        '/api/authority/assign',
        headers=authority_headers,
        json={'issue_id': issue_id, 'worker_id': worker_id, 'notes': 'Please repair urgently.'}
    )
    assert assign_resp.status_code == 200, f'Worker assign failed: {assign_resp.text}'
    assert assign_resp.json()['status'] == 'Assigned'

    tasks_resp = client.get('/api/worker/tasks', headers=worker_headers)
    assert tasks_resp.status_code == 200
    assert any(t['id'] == issue_id for t in tasks_resp.json())

    status_resp = client.put(
        f'/api/worker/tasks/{issue_id}/status?new_status=Accepted',
        headers=worker_headers
    )
    assert status_resp.status_code == 200

    status_resp2 = client.put(
        f'/api/worker/tasks/{issue_id}/status?new_status=In Progress',
        headers=worker_headers
    )
    assert status_resp2.status_code == 200

    proof_path = ROOT_DIR / 'backend' / 'tests' / 'test_proof.jpg'
    cv2.imwrite(str(proof_path), dummy_img)

    with open(proof_path, 'rb') as proof_file:
        proof_resp = client.post(
            f'/api/worker/tasks/{issue_id}/repair-proof',
            headers=worker_headers,
            files={'proof_image': ('proof.jpg', proof_file, 'image/jpeg')},
            data={'completion_notes': 'Patched with hot asphalt.'}
        )
    assert proof_resp.status_code == 200, f'Proof upload failed: {proof_resp.text}'
    assert proof_resp.json()['verification_status'] == 'Pending'

    verify_resp = client.post(
        f'/api/authority/verify/{issue_id}',
        headers=authority_headers,
        json={'action': 'VERIFY'}
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()['status'] == 'Verified'

    pay_resp = client.post(
        '/api/payments',
        headers=authority_headers,
        json={'issue_id': issue_id, 'worker_id': worker_id, 'amount': 1500.0, 'remarks': 'Approved payment for patch work.'}
    )
    assert pay_resp.status_code == 200
    assert pay_resp.json()['amount'] == 1500.0

    health_resp = client.get('/api/authority/health-score', headers=authority_headers)
    assert health_resp.status_code == 200
    assert 'health_score' in health_resp.json()

    analytics_resp = client.get('/api/authority/analytics', headers=authority_headers)
    assert analytics_resp.status_code == 200

    print('--- ALL BACKEND WORKFLOW TESTS PASSED SUCCESSFULLY ---')

def test_security_and_error_handling():
    unauth_resp = client.get('/api/authority/issues')
    assert unauth_resp.status_code in [401, 403]

    invalid_track = client.get('/api/public/track/REP-INVALID-9999')
    assert invalid_track.status_code == 404

    auth_resp = client.post('/api/auth/login', json={'email': 'worker1@smartcity.gov', 'password': 'Worker@123'})
    token = auth_resp.json()['access_token']
    invalid_status = client.put('/api/worker/tasks/1/status?new_status=Verified', headers={'Authorization': f'Bearer {token}'})
    assert invalid_status.status_code == 400

    print('--- ALL SECURITY AND ERROR HANDLING TESTS PASSED SUCCESSFULLY ---')
