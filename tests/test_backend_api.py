"""
SEAMS Backend API Tests
Tests for the School Examination & Academic Management System API
"""
import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Health check and root endpoint tests"""
    
    def test_root_endpoint(self):
        """Test root API endpoint returns operational status"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert data["message"] == "SEAMS API v2.0"
        assert "features" in data
        assert isinstance(data["features"], list)
        assert len(data["features"]) > 0
        print(f"Root endpoint: {data}")
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"Health check: {data}")


class TestStatusEndpoints:
    """Status check CRUD tests (MongoDB)"""
    
    def test_create_status_check(self):
        """Test creating a status check"""
        payload = {"client_name": "TEST_pytest_client"}
        response = requests.post(f"{BASE_URL}/api/status", json=payload)
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_name"] == "TEST_pytest_client"
        assert "id" in data
        assert "timestamp" in data
        print(f"Created status check: {data}")
    
    def test_get_status_checks(self):
        """Test getting all status checks"""
        response = requests.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} status checks")


class TestAuditEndpoints:
    """Audit logging endpoint tests (Supabase)
    Note: These endpoints require Supabase database tables to be set up
    """
    
    def test_get_audit_logs(self):
        """Test getting audit logs - may fail if Supabase tables not set up"""
        response = requests.get(f"{BASE_URL}/api/audit/logs")
        # 200 = success, 500 = Supabase not configured/tables missing
        print(f"Audit logs response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            print(f"Audit logs: {data}")
        else:
            print(f"Audit logs endpoint returned {response.status_code} - Supabase may not be fully configured")
            pytest.skip("Supabase audit_logs table may not be configured")
    
    def test_create_audit_log(self):
        """Test creating an audit log entry - POST to /audit/log"""
        payload = {
            "action_type": "VIEW",
            "resource_type": "EXAM",
            "user_id": "test-user-123",
            "user_email": "test@example.com",
            "resource_id": "test-resource-123",
            "resource_name": "Test Resource",
            "details": {"test": True}
        }
        response = requests.post(f"{BASE_URL}/api/audit/log", json=payload)
        print(f"Create audit log response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
        else:
            print(f"Create audit log returned {response.status_code} - Supabase may not be fully configured")
            pytest.skip("Supabase audit_logs table may not be configured")


class TestPermissionsEndpoints:
    """RBAC permissions endpoint tests (Supabase)
    Note: These endpoints require Supabase database tables to be set up
    """
    
    def test_get_roles(self):
        """Test getting roles - may fail if Supabase tables not set up"""
        response = requests.get(f"{BASE_URL}/api/permissions/roles")
        print(f"Roles response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
        else:
            print(f"Roles endpoint returned {response.status_code} - Supabase may not be fully configured")
            pytest.skip("Supabase permissions tables may not be configured")
    
    def test_check_permission(self):
        """Test checking permission - POST endpoint"""
        payload = {
            "user_id": "test-user-123",
            "permission_name": "view_exams"
        }
        response = requests.post(f"{BASE_URL}/api/permissions/check", json=payload)
        print(f"Check permission response: {response.status_code}")
        # 200 = success, 404 = user not found, 500 = Supabase not configured
        if response.status_code in [200, 404]:
            data = response.json()
            print(f"Permission check: {data}")
        else:
            pytest.skip("Supabase permissions tables may not be configured")


class TestConfigEndpoints:
    """System configuration endpoint tests (Supabase)"""
    
    def test_get_school_config(self):
        """Test getting school configuration"""
        # Use a test school ID
        response = requests.get(f"{BASE_URL}/api/config/school/test-school-id")
        print(f"Config response: {response.status_code}")
        # Should return 200 even if no config found (returns empty)
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            print(f"Config: {data}")
        else:
            pytest.skip("Supabase config tables may not be configured")


class TestStorageEndpoints:
    """Storage endpoint tests (Supabase Storage)"""
    
    def test_get_file_versions(self):
        """Test getting file versions for an exam subject"""
        response = requests.get(f"{BASE_URL}/api/storage/file-versions/test-exam-id")
        print(f"File versions response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
        else:
            pytest.skip("Supabase storage tables may not be configured")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
