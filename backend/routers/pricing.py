from fastapi import APIRouter, Depends, HTTPException, Form
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.models.service import ServiceTemplate, ServicePricing
from backend.db import db, get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/pricing", tags=["pricing"])

# Service pricing templates
SERVICE_PRICING_TEMPLATES = {
    "incorporation-india": {
        "base_price": 15000,
        "pricing_type": "tiered",
        "tiers": [
            {"name": "Basic", "price": 15000, "features": ["ROC Registration", "PAN & TAN"]},
            {"name": "Standard", "price": 25000, "features": ["ROC Registration", "PAN & TAN", "Bank Account", "GST Registration"]},
            {"name": "Premium", "price": 35000, "features": ["ROC Registration", "PAN & TAN", "Bank Account", "GST Registration", "Trademark Search", "Legal Compliance"]}
        ],
        "price_factors": [
            {"factor": "urgency", "urgent": 1.5, "normal": 1.0, "flexible": 0.9},
            {"factor": "location", "metro": 1.0, "tier2": 0.9, "tier3": 0.8},
            {"factor": "complexity", "simple": 1.0, "medium": 1.2, "complex": 1.5}
        ]
    },
    "incorporation-uae": {
        "base_price": 25000,
        "pricing_type": "tiered",
        "tiers": [
            {"name": "Freezone", "price": 25000, "features": ["Trade License", "Visa Processing"]},
            {"name": "Mainland", "price": 35000, "features": ["Trade License", "Visa Processing", "Local Sponsor", "Bank Account"]},
            {"name": "Offshore", "price": 20000, "features": ["Trade License", "Bank Account Setup"]}
        ],
        "price_factors": [
            {"factor": "urgency", "urgent": 1.3, "normal": 1.0, "flexible": 0.95},
            {"factor": "visa_count", "1-2": 1.0, "3-5": 1.2, "6+": 1.5}
        ]
    },
    "website-basic": {
        "base_price": 35000,
        "pricing_type": "modular",
        "modules": [
            {"name": "Basic Website", "price": 35000, "required": True},
            {"name": "E-commerce", "price": 15000, "required": False},
            {"name": "Blog Section", "price": 5000, "required": False},
            {"name": "Multi-language", "price": 10000, "required": False},
            {"name": "SEO Package", "price": 8000, "required": False}
        ],
        "price_factors": [
            {"factor": "design_complexity", "template": 1.0, "custom": 1.3, "premium": 1.6},
            {"factor": "page_count", "1-5": 1.0, "6-10": 1.2, "11-20": 1.5, "20+": 2.0}
        ]
    },
    "mobile-app": {
        "base_price": 150000,
        "pricing_type": "platform_based",
        "platforms": [
            {"name": "iOS Only", "price": 100000},
            {"name": "Android Only", "price": 100000},
            {"name": "Both Platforms", "price": 150000},
            {"name": "Cross-Platform", "price": 120000}
        ],
        "features": [
            {"name": "User Authentication", "price": 15000, "required": True},
            {"name": "Push Notifications", "price": 10000, "required": False},
            {"name": "Payment Integration", "price": 20000, "required": False},
            {"name": "Analytics", "price": 12000, "required": False},
            {"name": "Admin Panel", "price": 25000, "required": False}
        ],
        "price_factors": [
            {"factor": "complexity", "simple": 1.0, "medium": 1.3, "complex": 1.8},
            {"factor": "backend_complexity", "simple": 1.0, "medium": 1.2, "complex": 1.5}
        ]
    },
    "legal-docs": {
        "base_price": 12000,
        "pricing_type": "document_based",
        "documents": [
            {"name": "MoU", "price": 3000, "required": False},
            {"name": "NDA", "price": 2000, "required": False},
            {"name": "Shareholder Agreement", "price": 5000, "required": False},
            {"name": "Employment Contract", "price": 2500, "required": False},
            {"name": "Privacy Policy", "price": 1500, "required": False}
        ],
        "packages": [
            {"name": "Startup Package", "price": 12000, "documents": ["MoU", "NDA", "Shareholder Agreement"]},
            {"name": "Full Package", "price": 18000, "documents": ["MoU", "NDA", "Shareholder Agreement", "Employment Contract", "Privacy Policy"]}
        ]
    }
}

@router.post("/calculate")
async def calculate_pricing(
    service_id: str = Form(...),
    configuration: Dict[str, Any] = Form(...),
    current_user=Depends(get_current_user)
):
    """Calculate dynamic pricing for a service based on configuration"""
    try:
        # Parse configuration if it's a string
        if isinstance(configuration, str):
            import json
            configuration = json.loads(configuration)
        
        template = SERVICE_PRICING_TEMPLATES.get(service_id)
        if not template:
            raise HTTPException(status_code=404, detail="Service pricing template not found")
        
        base_price = template["base_price"]
        pricing_type = template["pricing_type"]
        
        calculated_price = base_price
        price_breakdown = {
            "base_price": base_price,
            "adjustments": [],
            "modules": [],
            "total_before_tax": 0,
            "tax_amount": 0,
            "total_amount": 0
        }
        
        # Calculate based on pricing type
        if pricing_type == "tiered":
            selected_tier = configuration.get("tier", "Basic")
            tier_info = next((t for t in template["tiers"] if t["name"] == selected_tier), template["tiers"][0])
            calculated_price = tier_info["price"]
            price_breakdown["base_price"] = calculated_price
            price_breakdown["selected_tier"] = tier_info
            
        elif pricing_type == "modular":
            calculated_price = 0
            for module in template["modules"]:
                if module["required"] or configuration.get("modules", {}).get(module["name"], False):
                    calculated_price += module["price"]
                    price_breakdown["modules"].append({
                        "name": module["name"],
                        "price": module["price"],
                        "required": module["required"]
                    })
                    
        elif pricing_type == "platform_based":
            selected_platform = configuration.get("platform", "Both Platforms")
            platform_info = next((p for p in template["platforms"] if p["name"] == selected_platform), template["platforms"][0])
            calculated_price = platform_info["price"]
            price_breakdown["platform"] = platform_info
            
            # Add selected features
            selected_features = configuration.get("features", [])
            for feature in template["features"]:
                if feature["name"] in selected_features:
                    calculated_price += feature["price"]
                    price_breakdown["modules"].append({
                        "name": feature["name"],
                        "price": feature["price"],
                        "type": "feature"
                    })
                    
        elif pricing_type == "document_based":
            selected_package = configuration.get("package")
            if selected_package:
                package_info = next((p for p in template["packages"] if p["name"] == selected_package), None)
                if package_info:
                    calculated_price = package_info["price"]
                    price_breakdown["package"] = package_info
                else:
                    # Calculate individual documents
                    calculated_price = 0
                    selected_docs = configuration.get("documents", [])
                    for doc in template["documents"]:
                        if doc["name"] in selected_docs:
                            calculated_price += doc["price"]
                            price_breakdown["modules"].append({
                                "name": doc["name"],
                                "price": doc["price"],
                                "type": "document"
                            })
        
        # Apply price factors
        if "price_factors" in template:
            for factor_group in template["price_factors"]:
                factor_name = factor_group["factor"]
                factor_value = configuration.get(factor_name, "normal")
                
                if factor_value in factor_group:
                    multiplier = factor_group[factor_value]
                    adjustment = calculated_price * (multiplier - 1)
                    calculated_price *= multiplier
                    
                    if adjustment != 0:
                        price_breakdown["adjustments"].append({
                            "factor": factor_name,
                            "value": factor_value,
                            "multiplier": multiplier,
                            "adjustment": adjustment
                        })
        
        # Calculate tax (GST for India)
        tax_rate = 0.18  # 18% GST
        tax_amount = calculated_price * tax_rate
        total_amount = calculated_price + tax_amount
        
        price_breakdown.update({
            "total_before_tax": calculated_price,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "total_amount": total_amount
        })
        
        # Store pricing calculation for reference
        pricing_calculation = {
            "id": f"calc_{datetime.utcnow().timestamp()}",
            "user_id": current_user.id,
            "service_id": service_id,
            "configuration": configuration,
            "price_breakdown": price_breakdown,
            "calculated_at": datetime.utcnow(),
            "valid_until": datetime.utcnow().replace(hour=23, minute=59, second=59)  # Valid until end of day
        }
        
        await db.pricing_calculations.insert_one(pricing_calculation)
        
        return {
            "service_id": service_id,
            "calculated_price": total_amount,
            "price_breakdown": price_breakdown,
            "calculation_id": pricing_calculation["id"],
            "valid_until": pricing_calculation["valid_until"].isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pricing calculation failed: {str(e)}")

@router.get("/service-config/{service_id}")
async def get_service_configuration(service_id: str):
    """Get available configuration options for a service"""
    try:
        template = SERVICE_PRICING_TEMPLATES.get(service_id)
        if not template:
            raise HTTPException(status_code=404, detail="Service not found")
        
        config_options = {
            "service_id": service_id,
            "pricing_type": template["pricing_type"],
            "base_price": template["base_price"]
        }
        
        # Add specific configuration options based on pricing type
        if template["pricing_type"] == "tiered":
            config_options["tiers"] = template["tiers"]
            
        elif template["pricing_type"] == "modular":
            config_options["modules"] = template["modules"]
            
        elif template["pricing_type"] == "platform_based":
            config_options["platforms"] = template["platforms"]
            config_options["features"] = template["features"]
            
        elif template["pricing_type"] == "document_based":
            config_options["documents"] = template["documents"]
            config_options["packages"] = template["packages"]
        
        # Add price factors
        if "price_factors" in template:
            config_options["price_factors"] = template["price_factors"]
        
        return config_options
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get service configuration: {str(e)}")

@router.get("/estimate/{service_id}")
async def get_quick_estimate(
    service_id: str,
    urgency: Optional[str] = "normal",
    location: Optional[str] = "metro",
    complexity: Optional[str] = "simple"
):
    """Get a quick price estimate for a service"""
    try:
        template = SERVICE_PRICING_TEMPLATES.get(service_id)
        if not template:
            raise HTTPException(status_code=404, detail="Service not found")
        
        base_price = template["base_price"]
        estimated_price = base_price
        
        # Apply common price factors
        if "price_factors" in template:
            for factor_group in template["price_factors"]:
                factor_name = factor_group["factor"]
                
                if factor_name == "urgency" and urgency in factor_group:
                    estimated_price *= factor_group[urgency]
                elif factor_name == "location" and location in factor_group:
                    estimated_price *= factor_group[location]
                elif factor_name == "complexity" and complexity in factor_group:
                    estimated_price *= factor_group[complexity]
        
        # Add tax
        tax_amount = estimated_price * 0.18
        total_estimate = estimated_price + tax_amount
        
        return {
            "service_id": service_id,
            "base_price": base_price,
            "estimated_price": estimated_price,
            "tax_amount": tax_amount,
            "total_estimate": total_estimate,
            "factors_applied": {
                "urgency": urgency,
                "location": location,
                "complexity": complexity
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate estimate: {str(e)}")

@router.get("/calculation/{calculation_id}")
async def get_pricing_calculation(
    calculation_id: str,
    current_user=Depends(get_current_user)
):
    """Retrieve a previously calculated pricing"""
    try:
        calculation = await db.pricing_calculations.find_one({
            "id": calculation_id,
            "user_id": current_user.id
        })
        
        if not calculation:
            raise HTTPException(status_code=404, detail="Pricing calculation not found")
        
        # Check if calculation is still valid
        if datetime.utcnow() > calculation["valid_until"]:
            raise HTTPException(status_code=410, detail="Pricing calculation has expired")
        
        # Format for response
        calculation["_id"] = str(calculation["_id"])
        calculation["calculated_at"] = calculation["calculated_at"].isoformat()
        calculation["valid_until"] = calculation["valid_until"].isoformat()
        
        return calculation
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve calculation: {str(e)}")