#!/usr/bin/env python3
"""
Dependency checker for LaunchKart backend
Run this script to check if all required packages are installed.
"""

import importlib
import sys

def check_package(package_name, import_name=None):
    """Check if a package is installed"""
    if import_name is None:
        import_name = package_name
    
    try:
        importlib.import_module(import_name)
        print(f"✅ {package_name}")
        return True
    except ImportError:
        print(f"❌ {package_name} - NOT INSTALLED")
        return False

def main():
    """Check all required dependencies"""
    print("🔍 Checking LaunchKart Backend Dependencies")
    print("=" * 50)
    
    # Core dependencies
    core_packages = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("pydantic", "pydantic"),
        ("motor", "motor"),
        ("python-dotenv", "dotenv"),
        ("PyJWT", "jwt"),
        ("passlib", "passlib"),
        ("bcrypt", "bcrypt"),
        ("python-jose", "jose"),
        ("requests", "requests"),
        ("python-multipart", "multipart"),
        ("starlette", "starlette"),
        ("aiofiles", "aiofiles"),
        ("email-validator", "email_validator"),
    ]
    
    print("\n📦 Core Dependencies:")
    core_missing = 0
    for package, import_name in core_packages:
        if not check_package(package, import_name):
            core_missing += 1
    
    # Optional dependencies
    optional_packages = [
        ("boto3", "boto3"),
        ("pandas", "pandas"),
        ("numpy", "numpy"),
        ("Pillow", "PIL"),
        ("jinja2", "jinja2"),
    ]
    
    print("\n📦 Optional Dependencies:")
    optional_missing = 0
    for package, import_name in optional_packages:
        if not check_package(package, import_name):
            optional_missing += 1
    
    # Development dependencies
    dev_packages = [
        ("pytest", "pytest"),
        ("black", "black"),
        ("isort", "isort"),
        ("flake8", "flake8"),
        ("mypy", "mypy"),
    ]
    
    print("\n📦 Development Dependencies:")
    dev_missing = 0
    for package, import_name in dev_packages:
        if not check_package(package, import_name):
            dev_missing += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Summary:")
    print(f"Core packages missing: {core_missing}")
    print(f"Optional packages missing: {optional_missing}")
    print(f"Dev packages missing: {dev_missing}")
    
    if core_missing > 0:
        print(f"\n⚠️  {core_missing} core packages are missing!")
        print("Run: pip install -r requirements.txt")
        return False
    elif optional_missing > 0:
        print(f"\nℹ️  {optional_missing} optional packages are missing.")
        print("These are not required for basic functionality.")
    else:
        print("\n🎉 All required packages are installed!")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 