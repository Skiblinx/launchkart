from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any
import requests
import base64
import json
from datetime import datetime
from enum import Enum
import os

# Additional KYC-specific enums and models
class KYCTier(str, Enum):
    BASIC = "basic"
    FULL = "full"

class KYCProvider(str, Enum):
    HYPERVERGE = "hyperverge"
    IDFY = "idfy"

class DocumentType(str, Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    EMIRATES_ID = "emirates_id"
    PASSPORT = "passport"
    DRIVING_LICENSE = "driving_license"

# Import these from your main models if needed
# from .server import KYCStatus, KYCDocument, KYCLevel, Country, db, User
# For now, assume they are imported or defined in the main app

class KYCVerificationRequest(BaseModel):
    document_type: DocumentType
    document_number: Optional[str] = None
    otp: Optional[str] = None
    selfie_image: Optional[str] = None  # base64 encoded

class KYCVerificationResponse(BaseModel):
    success: bool
    verification_id: str
    status: str  # Use KYCStatus if imported
    confidence_score: Optional[float] = None
    extracted_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    next_step: Optional[str] = None

class HyperVergeService:
    def __init__(self, api_key: str, base_url: str = "https://ind.hyperverge.co/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "appId": api_key,
            "appKey": os.environ.get('HYPERVERGE_APP_KEY'),
            "Content-Type": "application/json"
        }
    
    async def verify_aadhaar_otp(self, aadhaar_number: str, otp: str) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/aadhaar/otp/verify"
        payload = {"aadhaarNumber": aadhaar_number, "otp": otp}
        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"HyperVerge API error: {str(e)}")
    
    async def verify_pan_ocr(self, pan_image: str) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/pan/ocr"
        payload = {"image": pan_image}
        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"HyperVerge API error: {str(e)}")
    
    async def verify_emirates_id(self, emirates_id_image: str, selfie_image: str) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/emirates-id/verify"
        payload = {"emiratesIdImage": emirates_id_image, "selfieImage": selfie_image}
        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"HyperVerge API error: {str(e)}")

class IDfyService:
    def __init__(self, api_key: str, base_url: str = "https://eve.idfy.com/v3"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "account-id": os.environ.get('IDFY_ACCOUNT_ID'),
            "api-key": api_key,
            "Content-Type": "application/json"
        }
    
    async def initiate_video_kyc(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/video-kyc/initiate"
        payload = {
            "name": user_data.get("fullName"),
            "email": user_data.get("email"),
            "phone": user_data.get("phoneNumber"),
            "country": user_data.get("country"),
            "workflow": "full_kyc"
        }
        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"IDfy API error: {str(e)}")
    
    async def verify_document_advanced(self, document_type: str, document_image: str, selfie_image: str) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/document/verify-advanced"
        payload = {
            "documentType": document_type,
            "documentImage": document_image,
            "selfieImage": selfie_image,
            "performBiometricMatch": True,
            "extractData": True
        }
        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"IDfy API error: {str(e)}")

api_router = APIRouter()

# (Paste all the enhanced KYC route handlers here, using api_router)
# You may need to import or pass db, User, KYCStatus, KYCLevel, Country, KYCDocument from your main app
# For now, assume they are available in the global scope or import them as needed

# ... (Paste all the KYC route handlers and helper functions here) ... 

from .server import (
    db,
    User,
    KYCDocument,
    KYCStatus,
    KYCLevel,
    Country,
    get_current_user
) 