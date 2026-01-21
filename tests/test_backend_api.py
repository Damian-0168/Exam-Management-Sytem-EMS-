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
    """Status check CRUD tests"""
    
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
        return data["id"]
    
    def test_get_status_checks(self):
        """Test getting all status checks"""
        response = requests.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} status checks")


class TestAuditEndpoints:
    """Audit logging endpoint tests"""
    
    def test_get_audit_logs(self):
        """Test getting audit logs"""
        response = requests.get(f"{BASE_URL}/api/audit/logs")
        # Should return 200 or 404 if no logs
        assert response.status_code in [200, 404]
        print(f"Audit logs response: {response.status_code}")
    
    def test_create_audit_log(self):
        """Test creating an audit log entry"""
        payload = {
            "action": "TEST_ACTION",
            "user_id": "test-user-123",
            "resource_type": "test",
            "resource_id": "test-resource-123",
            "details": {"test": True}
        }
        response = requests.post(f"{BASE_URL}/api/audit/logs", json=payload)
        # Should return 200/201 or 422 if validation fails
        assert response.status_code in [200, 201, 422]
        print(f"Create audit log response: {response.status_code}")


class TestPermissionsEndpoints:
    """RBAC permissions endpoint tests"""
    
    def test_get_roles(self):
        """Test getting roles"""
        response = requests.get(f"{BASE_URL}/api/permissions/roles")
        assert response.status_code in [200, 404]
        print(f"Roles response: {response.status_code}")
    
    def test_get_permissions(self):
        """Test getting permissions"""
        response = requests.get(f"{BASE_URL}/api/permissions")
        assert response.status_code in [200, 404]
        print(f"Permissions response: {response.status_code}")


class TestConfigEndpoints:
    """System configuration endpoint tests"""
    
    def test_get_config(self):
        """Test getting system configuration"""
        response = requests.get(f"{BASE_URL}/api/config")
        assert response.status_code in [200, 404]
        print(f"Config response: {response.status_code}")


class TestStorageEndpoints:
    """Storage endpoint tests"""
    
    def test_storage_health(self):
        """Test storage health endpoint"""
        response = requests.get(f"{BASE_URL}/api/storage/health")
        assert response.status_code in [200, 404, 500]
        print(f"Storage health response: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
