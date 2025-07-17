from fastapi import APIRouter, Depends, HTTPException, Form
from typing import Optional, Dict, Any
from datetime import datetime
import os
import hashlib
import hmac
import json
from backend.models.service import PaymentRecord, EnhancedServiceRequest
from backend.db import db, get_current_user
from backend.utils.email_service import email_service
from bson import ObjectId
import razorpay
import stripe

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Initialize payment gateways
def get_razorpay_client():
    return razorpay.Client(auth=(
        os.getenv("RAZORPAY_KEY_ID"),
        os.getenv("RAZORPAY_KEY_SECRET")
    ))

def get_stripe_client():
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    return stripe

@router.post("/create-order")
async def create_payment_order(
    service_request_id: str = Form(...),
    payment_method: str = Form(...),  # razorpay or stripe
    current_user=Depends(get_current_user)
):
    """Create a payment order for a service request"""
    try:
        # Fetch service request
        service_request = await db.service_requests.find_one({"id": service_request_id})
        if not service_request or service_request["user_id"] != current_user.id:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        if service_request["status"] != "quoted":
            raise HTTPException(status_code=400, detail="Service request must be quoted before payment")
        
        amount = service_request.get("quote_amount", service_request["budget"])
        
        # Determine payment gateway based on user location/preference
        if payment_method == "razorpay":
            client = get_razorpay_client()
            order = client.order.create({
                "amount": int(amount * 100),  # Convert to paise
                "currency": "INR",
                "payment_capture": 1
            })
            gateway_order_id = order["id"]
            
        elif payment_method == "stripe":
            stripe_client = get_stripe_client()
            intent = stripe_client.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency="usd",
                metadata={
                    "service_request_id": service_request_id,
                    "user_id": current_user.id
                }
            )
            gateway_order_id = intent["id"]
            
        else:
            raise HTTPException(status_code=400, detail="Invalid payment method")
        
        # Create payment record
        payment_record = PaymentRecord(
            service_request_id=service_request_id,
            user_id=current_user.id,
            amount=amount,
            currency="INR" if payment_method == "razorpay" else "USD",
            gateway=payment_method,
            gateway_order_id=gateway_order_id,
            status="pending"
        )
        
        await db.payment_records.insert_one(payment_record.dict())
        
        # Update service request status
        await db.service_requests.update_one(
            {"id": service_request_id},
            {"$set": {
                "status": "payment_pending",
                "payment_record_id": payment_record.id,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {
            "payment_record_id": payment_record.id,
            "gateway_order_id": gateway_order_id,
            "amount": amount,
            "currency": payment_record.currency,
            "gateway": payment_method
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(
    payment_record_id: str = Form(...),
    gateway_payment_id: str = Form(...),
    gateway_signature: str = Form(None),
    current_user=Depends(get_current_user)
):
    """Verify payment completion"""
    try:
        # Fetch payment record
        payment_record = await db.payment_records.find_one({"id": payment_record_id})
        if not payment_record or payment_record["user_id"] != current_user.id:
            raise HTTPException(status_code=404, detail="Payment record not found")
        
        # Verify payment with gateway
        if payment_record["gateway"] == "razorpay":
            client = get_razorpay_client()
            
            # Verify signature
            generated_signature = hmac.new(
                os.getenv("RAZORPAY_KEY_SECRET").encode(),
                f"{payment_record['gateway_order_id']}|{gateway_payment_id}".encode(),
                hashlib.sha256
            ).hexdigest()
            
            if generated_signature != gateway_signature:
                raise HTTPException(status_code=400, detail="Invalid payment signature")
            
            # Fetch payment details
            payment_details = client.payment.fetch(gateway_payment_id)
            if payment_details["status"] != "captured":
                raise HTTPException(status_code=400, detail="Payment not captured")
                
        elif payment_record["gateway"] == "stripe":
            stripe_client = get_stripe_client()
            intent = stripe_client.PaymentIntent.retrieve(gateway_payment_id)
            
            if intent["status"] != "succeeded":
                raise HTTPException(status_code=400, detail="Payment not succeeded")
        
        # Update payment record
        await db.payment_records.update_one(
            {"id": payment_record_id},
            {"$set": {
                "gateway_payment_id": gateway_payment_id,
                "status": "completed",
                "updated_at": datetime.utcnow(),
                "metadata": {
                    "gateway_signature": gateway_signature,
                    "verified_at": datetime.utcnow().isoformat()
                }
            }}
        )
        
        # Update service request status
        await db.service_requests.update_one(
            {"id": payment_record["service_request_id"]},
            {"$set": {
                "status": "paid",
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Send confirmation email
        service_request = await db.service_requests.find_one({"id": payment_record["service_request_id"]})
        user = await db.users.find_one({"id": current_user.id})
        
        await email_service.send_payment_confirmation(user, service_request, payment_record)
        
        return {
            "message": "Payment verified successfully",
            "payment_status": "completed",
            "service_status": "paid"
        }
        
    except Exception as e:
        # Update payment record as failed
        await db.payment_records.update_one(
            {"id": payment_record_id},
            {"$set": {
                "status": "failed",
                "updated_at": datetime.utcnow(),
                "metadata": {"error": str(e)}
            }}
        )
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

@router.get("/payment-history")
async def get_payment_history(current_user=Depends(get_current_user)):
    """Get user's payment history"""
    try:
        payments = await db.payment_records.find(
            {"user_id": current_user.id}
        ).sort([("created_at", -1)]).to_list(100)
        
        # Fix ObjectIds and format for frontend
        for payment in payments:
            payment["_id"] = str(payment["_id"])
            payment["created_at"] = payment["created_at"].isoformat()
            payment["updated_at"] = payment["updated_at"].isoformat()
            
        return payments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment history: {str(e)}")

@router.post("/refund")
async def process_refund(
    payment_record_id: str = Form(...),
    refund_amount: Optional[float] = Form(None),
    reason: str = Form(...),
    current_user=Depends(get_current_user)
):
    """Process refund for a payment (admin only for now)"""
    try:
        # Check if user has admin privileges (you may want to implement proper admin check)
        user = await db.users.find_one({"id": current_user.id})
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can process refunds")
        
        # Fetch payment record
        payment_record = await db.payment_records.find_one({"id": payment_record_id})
        if not payment_record:
            raise HTTPException(status_code=404, detail="Payment record not found")
        
        if payment_record["status"] != "completed":
            raise HTTPException(status_code=400, detail="Can only refund completed payments")
        
        refund_amount = refund_amount or payment_record["amount"]
        
        # Process refund with gateway
        if payment_record["gateway"] == "razorpay":
            client = get_razorpay_client()
            refund = client.payment.refund(
                payment_record["gateway_payment_id"],
                {"amount": int(refund_amount * 100)}
            )
            
        elif payment_record["gateway"] == "stripe":
            stripe_client = get_stripe_client()
            refund = stripe_client.Refund.create(
                payment_intent=payment_record["gateway_payment_id"],
                amount=int(refund_amount * 100)
            )
        
        # Update payment record
        await db.payment_records.update_one(
            {"id": payment_record_id},
            {"$set": {
                "status": "refunded",
                "updated_at": datetime.utcnow(),
                "metadata": {
                    **payment_record.get("metadata", {}),
                    "refund_amount": refund_amount,
                    "refund_reason": reason,
                    "refunded_at": datetime.utcnow().isoformat()
                }
            }}
        )
        
        # Update service request status
        await db.service_requests.update_one(
            {"id": payment_record["service_request_id"]},
            {"$set": {
                "status": "refunded",
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {
            "message": "Refund processed successfully",
            "refund_amount": refund_amount,
            "status": "refunded"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refund processing failed: {str(e)}")

async def send_payment_confirmation_email(user, service_request, payment_record):
    """Send payment confirmation email to user"""
    try:
        subject = f"Payment Confirmation - {service_request['title']}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Payment Confirmation</h2>
            <p>Dear {user.get('name', 'User')},</p>
            <p>Your payment has been successfully processed!</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Service:</strong> {service_request['title']}</p>
                <p><strong>Amount:</strong> {payment_record['currency']} {payment_record['amount']:,.2f}</p>
                <p><strong>Payment ID:</strong> {payment_record['gateway_payment_id']}</p>
                <p><strong>Date:</strong> {payment_record['updated_at'].strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <p>Our team will now begin working on your service request. You'll receive regular updates on the progress.</p>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Dashboard
                </a>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Thank you for choosing LaunchKart!<br>
                If you have any questions, please contact our support team.
            </p>
        </div>
        """
        
        text_content = f"""
        Payment Confirmation
        
        Dear {user.get('name', 'User')},
        
        Your payment has been successfully processed!
        
        Payment Details:
        - Service: {service_request['title']}
        - Amount: {payment_record['currency']} {payment_record['amount']:,.2f}
        - Payment ID: {payment_record['gateway_payment_id']}
        - Date: {payment_record['updated_at'].strftime('%Y-%m-%d %H:%M:%S')}
        
        Our team will now begin working on your service request. You'll receive regular updates on the progress.
        
        Thank you for choosing LaunchKart!
        """
        
        await send_email(
            to_email=user["email"],
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
        
    except Exception as e:
        print(f"Failed to send payment confirmation email: {str(e)}")