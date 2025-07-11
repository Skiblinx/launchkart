# LaunchKart Backend

This is the backend for the LaunchKart platform, built with FastAPI and MongoDB.

## 🚀 Features

- User authentication (JWT)
- Business essentials asset generation
- Mentorship system
- Services marketplace
- Investment syndicate
- Notifications and analytics

## 🛠️ Requirements

- Python 3.9+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- (Recommended) Create a virtual environment

## ⚙️ Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=launchkart
   JWT_SECRET=your-secret-key
   HOST=0.0.0.0
   PORT=8000
   ```

4. **Start MongoDB**

   - Local: `mongod`
   - Or use [MongoDB Atlas](https://www.mongodb.com/atlas)

5. **Run the server**
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

## 📖 API Documentation

Once running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API docs.

## 🧪 Testing

- Use tools like Postman or the built-in Swagger UI.
- Make sure your `.env` is configured and MongoDB is running. 