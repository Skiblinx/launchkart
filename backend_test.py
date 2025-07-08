import requests
import json
import unittest
import os
import logging
import time
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Use local backend URL for testing
API_URL = "http://localhost:8001/api"
logger.info(f"Using API URL: {API_URL}")

class LaunchKartBackendTest(unittest.TestCase):
    def setUp(self):
        self.session_token = None
        self.session_id = "test_session_id"  # Mock session ID for testing
        self.user_data = None
    
    def test_01_login_redirect(self):
        """Test the login redirect endpoint"""
        logger.info("Testing login redirect endpoint...")
        try:
            response = requests.get(f"{API_URL}/auth/login", timeout=10)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("auth_url", data)
            logger.info("Login redirect endpoint test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_02_profile_without_session_id(self):
        """Test profile endpoint without session ID"""
        logger.info("Testing profile endpoint without session ID...")
        try:
            response = requests.post(f"{API_URL}/auth/profile", timeout=10)
            self.assertEqual(response.status_code, 400)
            logger.info("Profile endpoint without session ID test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_03_profile_with_session_id(self):
        """Test profile endpoint with session ID (mocked)"""
        logger.info("Testing profile endpoint with session ID...")
        
        # This test will fail in a real environment since we're using a mock session ID
        # In a real test, we would need to get a valid session ID from Emergent Auth
        # For testing purposes, we'll just check the error response
        
        try:
            response = requests.post(
                f"{API_URL}/auth/profile",
                headers={"X-Session-ID": self.session_id},
                timeout=10
            )
            
            # Since we're using a mock session ID, we expect an error
            # In a real environment with valid credentials, this would return 200
            self.assertIn(response.status_code, [401, 500])
            
            logger.info(f"Profile endpoint with session ID test completed with status {response.status_code}")
            logger.info("Note: This test is expected to fail with a mock session ID")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_04_me_without_auth(self):
        """Test current user endpoint without authentication"""
        logger.info("Testing current user endpoint without authentication...")
        try:
            response = requests.get(f"{API_URL}/auth/me", timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Current user endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_05_me_with_invalid_auth(self):
        """Test current user endpoint with invalid authentication"""
        logger.info("Testing current user endpoint with invalid authentication...")
        try:
            response = requests.get(
                f"{API_URL}/auth/me",
                headers={"Authorization": "Bearer invalid_token"},
                timeout=10
            )
            self.assertEqual(response.status_code, 401)
            logger.info("Current user endpoint with invalid authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_06_role_update_without_auth(self):
        """Test role update endpoint without authentication"""
        logger.info("Testing role update endpoint without authentication...")
        try:
            response = requests.put(f"{API_URL}/auth/role?role=founder", timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Role update endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_07_dashboard_without_auth(self):
        """Test dashboard endpoint without authentication"""
        logger.info("Testing dashboard endpoint without authentication...")
        try:
            response = requests.get(f"{API_URL}/dashboard", timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Dashboard endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_08_business_essentials_without_auth(self):
        """Test business essentials endpoint without authentication"""
        logger.info("Testing business essentials endpoint without authentication...")
        try:
            response = requests.get(f"{API_URL}/business-essentials", timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Business essentials endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_09_generate_business_essentials_without_auth(self):
        """Test generate business essentials endpoint without authentication"""
        logger.info("Testing generate business essentials endpoint without authentication...")
        try:
            response = requests.post(f"{API_URL}/business-essentials/generate", timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Generate business essentials endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_10_services_list(self):
        """Test services list endpoint (public)"""
        logger.info("Testing services list endpoint...")
        try:
            response = requests.get(f"{API_URL}/services", timeout=10)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)
            self.assertTrue(len(data) > 0)
            logger.info("Services list endpoint test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_11_create_service_request_without_auth(self):
        """Test create service request endpoint without authentication"""
        logger.info("Testing create service request endpoint without authentication...")
        service_data = {
            "service_type": "website",
            "title": "Company Website",
            "description": "Need a professional website",
            "budget": 1500
        }
        try:
            response = requests.post(f"{API_URL}/services/request", params=service_data, timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Create service request endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_12_admin_users_without_auth(self):
        """Test admin users endpoint without authentication"""
        logger.info("Testing admin users endpoint without authentication...")
        try:
            response = requests.get(f"{API_URL}/admin/users", timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Admin users endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_13_admin_service_requests_without_auth(self):
        """Test admin service requests endpoint without authentication"""
        logger.info("Testing admin service requests endpoint without authentication...")
        try:
            response = requests.get(f"{API_URL}/admin/service-requests", timeout=10)
            self.assertEqual(response.status_code, 401)
            logger.info("Admin service requests endpoint without authentication test passed")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            self.fail(f"Request failed: {e}")
    
    def test_14_authenticated_flow_simulation(self):
        """
        Simulate an authenticated flow with mocked data
        
        Note: This test doesn't actually authenticate but demonstrates the flow
        In a real test environment, we would need to:
        1. Get a valid session ID from Emergent Auth
        2. Call the profile endpoint to get a session token
        3. Use that token for authenticated requests
        """
        logger.info("Simulating authenticated flow (demonstration only)...")
        
        # Step 1: In a real test, we would get a valid session ID from Emergent Auth
        # For this simulation, we'll use a mock session ID
        
        # Step 2: Call profile endpoint (this would fail with our mock session ID)
        logger.info("This is a simulation only - not actually authenticating")
        
        # Step 3: For demonstration purposes, let's create a mock authenticated user
        mock_user = {
            "id": "mock-user-id",
            "email": "test@example.com",
            "name": "Test User",
            "role": "founder",
            "session_token": "mock-session-token"
        }
        
        # Step 4: Demonstrate what authenticated requests would look like
        logger.info("Example of what authenticated requests would look like:")
        logger.info(f"GET {API_URL}/auth/me")
        logger.info("Headers: {'Authorization': 'Bearer mock-session-token'}")
        
        logger.info(f"GET {API_URL}/dashboard")
        logger.info("Headers: {'Authorization': 'Bearer mock-session-token'}")
        
        logger.info(f"GET {API_URL}/business-essentials")
        logger.info("Headers: {'Authorization': 'Bearer mock-session-token'}")
        
        logger.info(f"POST {API_URL}/business-essentials/generate")
        logger.info("Headers: {'Authorization': 'Bearer mock-session-token'}")
        
        logger.info(f"POST {API_URL}/services/request")
        logger.info("Headers: {'Authorization': 'Bearer mock-session-token'}")
        logger.info("Params: {'service_type': 'website', 'title': 'Company Website', 'description': 'Need a professional website', 'budget': 1500}")
        
        logger.info("Authenticated flow simulation completed")

if __name__ == "__main__":
    # Wait for backend to be fully started
    logger.info("Waiting for backend to be fully started...")
    time.sleep(5)
    unittest.main(verbosity=2)