import asyncio
import os
import json
import base64
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from pathlib import Path
import zipfile
import io
from PIL import Image, ImageDraw, ImageFont
import aiofiles
from jinja2 import Template
from fastapi import BackgroundTasks

class BusinessEssentialsGenerator:
    def __init__(self, db, storage_path="./storage/essentials"):
        self.db = db
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
    async def generate_single_asset(self, user_id: str, asset_type: str, user_data: dict, background_tasks: BackgroundTasks):
        """Generate a single asset for user on-demand"""
        try:
            # Check if user has required KYC level
            user = await self.db.users.find_one({"id": user_id})
            if not user or user.get("kyc_level") not in ["basic", "full"]:
                raise Exception("Basic KYC verification required")
            
            # Check if asset already exists and is not failed
            existing_asset = await self.db.user_assets.find_one({
                "user_id": user_id, 
                "asset_type": asset_type
            })
            
            if existing_asset and existing_asset.get("status") not in ["failed", None]:
                return existing_asset
            
            # Create asset record
            asset_id = str(uuid.uuid4())
            asset_record = {
                "id": asset_id,
                "user_id": user_id,
                "asset_type": asset_type,
                "status": "generating",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert or update asset record
            await self.db.user_assets.update_one(
                {"user_id": user_id, "asset_type": asset_type},
                {"$set": asset_record},
                upsert=True
            )
            
            # Generate asset in background
            background_tasks.add_task(self._generate_asset_background, asset_id, asset_type, user_data)
            
            return asset_record
            
        except Exception as e:
            print(f"Error generating asset {asset_type} for user {user_id}: {e}")
            # Mark as failed
            await self.db.user_assets.update_one(
                {"user_id": user_id, "asset_type": asset_type},
                {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.utcnow()}},
                upsert=True
            )
            raise e
    
    async def _generate_asset_background(self, asset_id: str, asset_type: str, user_data: dict):
        """Background task to generate asset"""
        try:
            # Generate the specific asset
            if asset_type == "logo":
                asset_data = await self._generate_logo(user_data)
            elif asset_type == "landing_page":
                asset_data = await self._generate_landing_page(user_data)
            elif asset_type == "social_creatives":
                asset_data = await self._generate_social_creatives(user_data)
            elif asset_type == "promo_video":
                asset_data = await self._generate_promo_video(user_data)
            elif asset_type == "mockups":
                asset_data = await self._generate_mockups(user_data)
            else:
                raise Exception(f"Unknown asset type: {asset_type}")
            
            # Update asset record with generated data
            await self.db.user_assets.update_one(
                {"id": asset_id},
                {"$set": {
                    **asset_data,
                    "status": "ready",
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # Create notification
            await self._create_asset_ready_notification(asset_id, asset_type)
            
        except Exception as e:
            print(f"Error in background generation for asset {asset_id}: {e}")
            await self.db.user_assets.update_one(
                {"id": asset_id},
                {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.utcnow()}}
            )
    
    async def _create_asset_ready_notification(self, asset_id: str, asset_type: str):
        """Create notification when asset is ready"""
        try:
            asset = await self.db.user_assets.find_one({"id": asset_id})
            if not asset:
                return
                
            asset_names = {
                "logo": "Professional Logo",
                "landing_page": "Landing Page", 
                "social_creatives": "Social Media Pack",
                "promo_video": "Promo Video",
                "mockups": "Product Mockups"
            }
            
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": asset["user_id"],
                "type": "asset_ready",
                "title": f"✅ Your {asset_names.get(asset_type, asset_type)} is Ready!",
                "message": f"Your {asset_names.get(asset_type, asset_type).lower()} has been generated and is ready for download.",
                "data": {
                    "asset_id": asset_id,
                    "asset_type": asset_type
                },
                "read": False,
                "created_at": datetime.utcnow()
            }
            
            await self.db.notifications.insert_one(notification)
            
        except Exception as e:
            print(f"Error creating notification: {e}")
    
    async def _generate_logo(self, user_data: dict) -> dict:
        """Generate logo variations"""
        company_name = user_data.get("fullName", "Your Company")
        initials = "".join([word[0].upper() for word in company_name.split()[:2]])
        
        variants = []
        colors = [
            ("#3B82F6", "#FFFFFF", "Blue"),
            ("#10B981", "#FFFFFF", "Green"), 
            ("#8B5CF6", "#FFFFFF", "Purple"),
            ("#EF4444", "#FFFFFF", "Red"),
            ("#F59E0B", "#FFFFFF", "Orange"),
        ]
        
        for i, (bg_color, text_color, color_name) in enumerate(colors):
            # Create logo image
            img = Image.new('RGB', (300, 300), bg_color)
            draw = ImageDraw.Draw(img)
            
            try:
                font = ImageFont.truetype("arial.ttf", 80)
            except:
                font = ImageFont.load_default()
            
            # Center text
            bbox = draw.textbbox((0, 0), initials, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (300 - text_width) // 2
            y = (300 - text_height) // 2
            
            draw.text((x, y), initials, fill=text_color, font=font)
            
            # Save logo
            logo_filename = f"logo_{color_name.lower()}_{uuid.uuid4().hex[:8]}.png"
            logo_path = self.storage_path / logo_filename
            img.save(logo_path)
            
            variants.append({
                "name": f"{color_name} Logo",
                "url": f"/api/business-essentials/assets/{logo_filename}",
                "color": bg_color,
                "path": str(logo_path)
            })
        
        # Set preview to first variant
        preview_url = variants[0]["url"] if variants else None
        
        return {
            "variants": variants,
            "preview_url": preview_url,
            "primary_variant": variants[0] if variants else None
        }
    
    async def _generate_landing_page(self, user_data: dict) -> dict:
        """Generate responsive landing page"""
        company_name = user_data.get("fullName", "Your Company")
        business_stage = user_data.get("businessStage", "Idea")
        
        template_html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ company_name }} - {{ tagline }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 4rem 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .hero-content {
            max-width: 600px;
        }
        
        .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 2rem;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .tagline {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .cta-button {
            background: linear-gradient(45deg, #ff6b6b, #ffa500);
            color: white;
            padding: 1.2rem 2.5rem;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: bold;
            transition: all 0.3s ease;
            display: inline-block;
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
        }
        
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
        }
        
        .features {
            padding: 5rem 0;
            background: #f8f9fa;
        }
        
        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: #2c3e50;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2.5rem;
            margin-top: 2rem;
        }
        
        .feature {
            background: white;
            padding: 2.5rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-5px);
        }
        
        .feature-icon {
            font-size: 3.5rem;
            margin-bottom: 1.5rem;
        }
        
        .feature h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #2c3e50;
        }
        
        .feature p {
            color: #666;
            line-height: 1.6;
        }
        
        .stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            text-align: center;
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 3rem 0;
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 2.5rem;
            }
            
            .hero-content {
                padding: 0 1rem;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="hero-content">
                <div class="logo">{{ initials }}</div>
                <h1>{{ company_name }}</h1>
                <p class="tagline">{{ tagline }}</p>
                <a href="#contact" class="cta-button">Get Started Today</a>
            </div>
        </div>
    </header>

    <section class="features">
        <div class="container">
            <h2 class="section-title">Why Choose {{ company_name }}?</h2>
            <div class="features-grid">
                <div class="feature">
                    <div class="feature-icon">🚀</div>
                    <h3>Innovation First</h3>
                    <p>Cutting-edge solutions designed for tomorrow's challenges with today's technology.</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">💡</div>
                    <h3>Expert Team</h3>
                    <p>Deep industry knowledge and years of experience delivering exceptional results.</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">⭐</div>
                    <h3>Premium Quality</h3>
                    <p>Uncompromising standards and attention to detail in everything we deliver.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-number">500+</div>
                    <div class="stat-label">Happy Clients</div>
                </div>
                <div class="stat">
                    <div class="stat-number">1000+</div>
                    <div class="stat-label">Projects Completed</div>
                </div>
                <div class="stat">
                    <div class="stat-number">50+</div>
                    <div class="stat-label">Team Members</div>
                </div>
                <div class="stat">
                    <div class="stat-number">5+</div>
                    <div class="stat-label">Years Experience</div>
                </div>
            </div>
        </div>
    </section>

    <footer id="contact">
        <div class="container">
            <h3>Ready to Get Started?</h3>
            <p style="margin: 1rem 0;">Contact us today to discuss your project</p>
            <p>&copy; 2024 {{ company_name }}. All rights reserved.</p>
            <p style="margin-top: 1rem; opacity: 0.7;">Built with LaunchKart Business Essentials</p>
        </div>
    </footer>
</body>
</html>
        """
        
        taglines = {
            "Idea": "Turning Bold Ideas Into Reality",
            "Prototype": "Building Tomorrow's Solutions Today", 
            "Launched": "Growing Your Success Story",
            "Scaling": "Scaling for Global Impact"
        }
        
        initials = "".join([word[0].upper() for word in company_name.split()[:2]])
        
        template = Template(template_html)
        html_content = template.render(
            company_name=company_name,
            tagline=taglines.get(business_stage, "Your Business Solution"),
            initials=initials
        )
        
        # Save landing page
        page_filename = f"landing_page_{uuid.uuid4().hex[:8]}.html"
        page_path = self.storage_path / page_filename
        
        async with aiofiles.open(page_path, 'w') as f:
            await f.write(html_content)
        
        return {
            "preview_url": f"/api/business-essentials/assets/{page_filename}",
            "live_url": f"/api/business-essentials/assets/{page_filename}",
            "path": str(page_path)
        }
    
    async def _generate_social_creatives(self, user_data: dict) -> dict:
        """Generate social media creatives"""
        company_name = user_data.get("fullName", "Your Company")
        creatives = []
        
        platforms = [
            {"name": "Instagram Post", "size": (1080, 1080), "format": "square"},
            {"name": "Facebook Cover", "size": (1200, 630), "format": "landscape"},
            {"name": "Twitter Header", "size": (1500, 500), "format": "banner"},
            {"name": "LinkedIn Post", "size": (1200, 627), "format": "landscape"},
            {"name": "Instagram Story", "size": (1080, 1920), "format": "portrait"}
        ]
        
        colors = [
            ("#3B82F6", "Professional Blue"),
            ("#10B981", "Success Green"), 
            ("#8B5CF6", "Creative Purple"),
            ("#EF4444", "Bold Red"),
            ("#F59E0B", "Energetic Orange")
        ]
        
        for i, platform in enumerate(platforms):
            color, color_name = colors[i % len(colors)]
            
            # Create social media creative
            img = Image.new('RGB', platform["size"], color)
            draw = ImageDraw.Draw(img)
            
            try:
                title_font = ImageFont.truetype("arial.ttf", min(60, platform["size"][1]//20))
                subtitle_font = ImageFont.truetype("arial.ttf", min(30, platform["size"][1]//35))
            except:
                title_font = ImageFont.load_default()
                subtitle_font = ImageFont.load_default()
            
            # Add company name
            bbox = draw.textbbox((0, 0), company_name, font=title_font)
            text_width = bbox[2] - bbox[0]
            x = (platform["size"][0] - text_width) // 2
            y = platform["size"][1] // 3
            
            draw.text((x, y), company_name, fill="white", font=title_font)
            
            # Add tagline
            tagline = "Building the Future Together"
            bbox = draw.textbbox((0, 0), tagline, font=subtitle_font)
            text_width = bbox[2] - bbox[0]
            x = (platform["size"][0] - text_width) // 2
            y = y + 100
            
            draw.text((x, y), tagline, fill="white", font=subtitle_font)
            
            # Add decorative elements
            if platform["format"] != "portrait":
                # Add corner decoration
                draw.ellipse([20, 20, 100, 100], fill="rgba(255,255,255,0.2)")
            
            # Save creative
            creative_filename = f"social_{platform['format']}_{uuid.uuid4().hex[:8]}.png"
            creative_path = self.storage_path / creative_filename
            img.save(creative_path)
            
            creatives.append({
                "platform": platform["name"],
                "dimensions": f"{platform['size'][0]}x{platform['size'][1]}",
                "url": f"/api/business-essentials/assets/{creative_filename}",
                "path": str(creative_path)
            })
        
        # Set preview to first creative
        preview_url = creatives[0]["url"] if creatives else None
        
        return {
            "creatives": creatives,
            "preview_url": preview_url
        }
    
    async def _generate_promo_video(self, user_data: dict) -> dict:
        """Generate promo video player"""
        company_name = user_data.get("fullName", "Your Company")
        business_stage = user_data.get("businessStage", "Idea")
        
        # Create a branded video player HTML
        video_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{company_name} - Promotional Video</title>
    <style>
        body {{
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .video-container {{
            max-width: 800px;
            width: 100%;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }}
        .video-header {{
            margin-bottom: 30px;
        }}
        .video-header h1 {{
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }}
        .video-header p {{
            font-size: 1.2rem;
            opacity: 0.9;
        }}
        .video-placeholder {{
            width: 100%;
            height: 400px;
            background: rgba(0,0,0,0.5);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }}
        .play-button {{
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        .play-button:hover {{
            transform: scale(1.1);
            background: white;
        }}
        .play-icon {{
            width: 0;
            height: 0;
            border-left: 25px solid #667eea;
            border-top: 15px solid transparent;
            border-bottom: 15px solid transparent;
            margin-left: 5px;
        }}
        .video-info {{
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }}
        @media (max-width: 768px) {{
            .video-container {{
                padding: 20px;
                margin: 20px;
            }}
            .video-header h1 {{
                font-size: 2rem;
            }}
            .video-placeholder {{
                height: 250px;
            }}
        }}
    </style>
</head>
<body>
    <div class="video-container">
        <div class="video-header">
            <h1>{company_name}</h1>
            <p>Discover our {business_stage.lower()} stage innovation</p>
        </div>
        
        <div class="video-placeholder">
            <div class="play-button">
                <div class="play-icon"></div>
            </div>
        </div>
        
        <div class="video-info">
            <h3>30-Second Company Overview</h3>
            <p>Learn about our mission, vision, and what makes {company_name} unique in the market.</p>
        </div>
    </div>
    
    <script>
        document.querySelector('.play-button').addEventListener('click', function() {{
            alert('Video player would launch here. In production, this would embed your actual promotional video.');
        }});
    </script>
</body>
</html>
        """
        
        # Save video player
        video_filename = f"promo_video_{uuid.uuid4().hex[:8]}.html"
        video_path = self.storage_path / video_filename
        
        async with aiofiles.open(video_path, 'w') as f:
            await f.write(video_html)
        
        return {
            "embed_url": f"/api/business-essentials/assets/{video_filename}",
            "preview_url": f"/api/business-essentials/assets/{video_filename}",
            "duration": "30 seconds",
            "path": str(video_path)
        }
    
    async def _generate_mockups(self, user_data: dict) -> dict:
        """Generate product mockups"""
        company_name = user_data.get("fullName", "Your Company")
        initials = "".join([word[0].upper() for word in company_name.split()[:2]])
        
        mockups = []
        mockup_types = [
            {"name": "Business Card", "size": (400, 240), "bg": "#FFFFFF"},
            {"name": "Letterhead", "size": (400, 300), "bg": "#FFFFFF"},
            {"name": "T-Shirt Mockup", "size": (400, 400), "bg": "#F8F9FA"},
            {"name": "Coffee Mug", "size": (350, 350), "bg": "#FFFFFF"},
            {"name": "Tote Bag", "size": (350, 400), "bg": "#F5F5F5"}
        ]
        
        primary_color = "#3B82F6"
        
        for mockup_type in mockup_types:
            # Create mockup image
            img = Image.new('RGB', mockup_type["size"], mockup_type["bg"])
            draw = ImageDraw.Draw(img)
            
            try:
                font = ImageFont.truetype("arial.ttf", 28)
                small_font = ImageFont.truetype("arial.ttf", 18)
            except:
                font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            
            if mockup_type["name"] == "Business Card":
                # Add border
                draw.rectangle([0, 0, mockup_type["size"][0]-1, mockup_type["size"][1]-1], 
                             outline="#E5E7EB", width=2)
                
                # Company info
                draw.text((25, 30), company_name, fill=primary_color, font=font)
                draw.text((25, 65), "Founder & CEO", fill="#6B7280", font=small_font)
                draw.text((25, 90), "hello@company.com", fill="#6B7280", font=small_font)
                draw.text((25, 115), "+1 (555) 123-4567", fill="#6B7280", font=small_font)
                
                # Logo
                draw.ellipse([300, 30, 370, 100], fill=primary_color)
                bbox = draw.textbbox((0, 0), initials, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                x = 335 - text_width // 2
                y = 65 - text_height // 2
                draw.text((x, y), initials, fill="white", font=font)
                
            elif mockup_type["name"] == "T-Shirt Mockup":
                # T-shirt outline
                draw.rectangle([80, 60, 320, 380], fill="#E5E7EB")
                draw.rectangle([90, 70, 310, 370], fill="#FFFFFF")
                
                # Logo on shirt
                draw.ellipse([170, 140, 230, 200], fill=primary_color)
                bbox = draw.textbbox((0, 0), initials, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                x = 200 - text_width // 2
                y = 170 - text_height // 2
                draw.text((x, y), initials, fill="white", font=font)
                
                # Company name below logo
                bbox = draw.textbbox((0, 0), company_name, font=small_font)
                text_width = bbox[2] - bbox[0]
                x = 200 - text_width // 2
                draw.text((x, 210), company_name, fill=primary_color, font=small_font)
                
            else:
                # Generic branding
                bbox = draw.textbbox((0, 0), company_name, font=font)
                text_width = bbox[2] - bbox[0]
                x = (mockup_type["size"][0] - text_width) // 2
                y = mockup_type["size"][1] // 2 - 20
                draw.text((x, y), company_name, fill=primary_color, font=font)
                
                # Add logo
                logo_size = 40
                logo_x = (mockup_type["size"][0] - logo_size) // 2
                logo_y = y - 60
                draw.ellipse([logo_x, logo_y, logo_x + logo_size, logo_y + logo_size], fill=primary_color)
                
                # Add initials to logo
                bbox = draw.textbbox((0, 0), initials, font=small_font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                x = logo_x + logo_size//2 - text_width // 2
                y = logo_y + logo_size//2 - text_height // 2
                draw.text((x, y), initials, fill="white", font=small_font)
            
            # Save mockup
            mockup_filename = f"mockup_{mockup_type['name'].lower().replace(' ', '_')}_{uuid.uuid4().hex[:8]}.png"
            mockup_path = self.storage_path / mockup_filename
            img.save(mockup_path)
            
            mockups.append({
                "type": mockup_type["name"],
                "url": f"/api/business-essentials/assets/{mockup_filename}",
                "path": str(mockup_path)
            })
        
        # Set preview to first mockup
        preview_url = mockups[0]["url"] if mockups else None
        
        return {
            "mockups": mockups,
            "preview_url": preview_url
        }
    
    async def create_asset_download_package(self, asset_id: str) -> Optional[str]:
        """Create downloadable package for single asset"""
        try:
            asset = await self.db.user_assets.find_one({"id": asset_id})
            if not asset or asset.get("status") != "ready":
                return None
            
            # Create ZIP file
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                asset_type = asset["asset_type"]
                
                if asset_type == "logo" and asset.get("variants"):
                    for i, variant in enumerate(asset["variants"]):
                        if os.path.exists(variant["path"]):
                            zip_file.write(variant["path"], f"logo_variant_{i+1}.png")
                
                elif asset_type == "landing_page" and asset.get("path"):
                    if os.path.exists(asset["path"]):
                        zip_file.write(asset["path"], "landing_page.html")
                
                elif asset_type == "social_creatives" and asset.get("creatives"):
                    for creative in asset["creatives"]:
                        if os.path.exists(creative["path"]):
                            filename = f"{creative['platform'].lower().replace(' ', '_')}.png"
                            zip_file.write(creative["path"], filename)
                
                elif asset_type == "promo_video" and asset.get("path"):
                    if os.path.exists(asset["path"]):
                        zip_file.write(asset["path"], "promo_video.html")
                
                elif asset_type == "mockups" and asset.get("mockups"):
                    for mockup in asset["mockups"]:
                        if os.path.exists(mockup["path"]):
                            filename = f"{mockup['type'].lower().replace(' ', '_')}.png"
                            zip_file.write(mockup["path"], filename)
                
                # Add README
                readme_content = f"""
# {asset_type.replace('_', ' ').title()} Package

Generated by LaunchKart Business Essentials

Asset Type: {asset_type.replace('_', ' ').title()}
Generated: {asset.get('created_at', datetime.now()).strftime('%Y-%m-%d %H:%M:%S')}

This package contains your professional {asset_type.replace('_', ' ')} ready for immediate use.
                """
                
                zip_file.writestr("README.txt", readme_content)
            
            # Save ZIP file
            zip_filename = f"{asset_type}_{asset_id[:8]}.zip"
            zip_path = self.storage_path / zip_filename
            
            zip_buffer.seek(0)
            with open(zip_path, 'wb') as f:
                f.write(zip_buffer.getvalue())
            
            return str(zip_path)
            
        except Exception as e:
            print(f"Error creating download package: {e}")
            return None 