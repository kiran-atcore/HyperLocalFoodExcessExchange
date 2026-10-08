# ResQ — HyperLocal Food Excess Exchange 🍲🌱

> Real-time surplus food rescue & dynamic discounted meal exchange platform connecting commercial kitchens, food banks/NGOs, and local consumers.

---

## 🌟 Overview

**ResQ** is a hyperlocal surplus food exchange ecosystem engineered to prevent food waste and address food insecurity. It provides real-time matching between food donors (restaurants, caterers, grocery stores) and two distinct recipient channels:
1. **Charitable Organizations / Shelters (100% Free Surplus Donations)**
2. **Local Consumers (Flash Meal Deals at Steep Discounts)**

---

## 🚀 Key Features

### 🏢 Donors & Kitchens
- **Quick Listing Creation:** Publish surplus food items with quantity, freshness window, dietary tags, pickup deadline, and photos.
- **Dynamic Dual Channeling:** Route batches to charitable NGOs as donations or to consumers as flash deals.
- **Live Claims Management:** Real-time incoming reservation tracking with recipient ETA and instant order status updates.

### 🏛️ Shelters & NGOs
- **Surplus Food Feed:** Discover nearby donation listings with live distance calculations and sorting by **Closest**, **Latest**, **Oldest**, or **Value**.
- **ETA & Capacity Coordination:** Claim surplus batches with estimated pickup time arrival and quantity reservation.
- **Digital Proof-of-Pickup:** Streamlined voucher and redemption verification.

### 👥 Consumers
- **Flash Food Deals:** Access discounted fresh kitchen portions before closing time.
- **Hyperlocal Geo-Filtering:** Sort listings by **Closest distance**, newest arrivals, or price.
- **Digital Pass Wallet:** High-contrast redemption passes for rapid counter pickup.

### 🔐 Security & Operations
- **Email OTP Verification:** 6-digit HTML email verification powered by Brevo.
- **JWT & Role-Based Access Control:** Distinct workflows for Donors, Consumers, Shelters, and Admins.
- **AI-Powered Food Insights:** Groq and Gemini integration for automated descriptions and categorization.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Mobile Client** | React Native (Expo Router v4, TypeScript, Reanimated, Moti, Linear Gradient, Toast) |
| **Backend API** | Django 5.0, Django REST Framework (DRF), Django Channels, Daphne ASGI |
| **Database** | Turso (Distributed libSQL / SQLite), PostgreSQL (`dj-database-url`), Local SQLite |
| **Media & Storage** | Cloudinary Storage |
| **Email Service** | Brevo SMTP & REST API Relay |
| **AI Services** | Groq API & Google Gemini API |
| **Deployment** | Render Web Services (`render.yaml`) & Turso Cloud |

---

## 📂 Project Structure

```
HyperLocalFoodExcessExchange/
├── backend/                  # Django backend application
│   ├── apps/                 # Core domain apps (users, listings, orders, notifications, etc.)
│   ├── core/                 # Project settings, ASGI/WSGI, routing, and URLs
│   ├── django_libsql/        # Turso libSQL database backend integration
│   ├── requirements.txt      # Python dependencies
│   └── manage.py
├── mobile/                   # Expo React Native application
│   ├── src/
│   │   ├── app/              # File-based routing ((auth), (donor), (shelter), (consumer), (views))
│   │   ├── components/       # Reusable UI components & animations
│   │   └── utils/            # API client, geolocation, and shared state
│   ├── app.json
│   └── package.json
├── render.yaml               # Render Infrastructure as Code (IaC) deployment config
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v18+) & **npm** / **yarn**
- **Python** (v3.11+)
- **Expo Go** app on Android/iOS (or Android Studio / Xcode simulator)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
cp .env.example .env # or create .env with required keys

# Apply database migrations
python manage.py migrate

# Start ASGI dev server
python manage.py runserver
```

#### Key Backend Environment Variables:
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
TURSO_DB_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
BREVO_SMTP_KEY=your-brevo-smtp-key
BREVO_SMTP_LOGIN=your-brevo-smtp-login
DEFAULT_FROM_EMAIL=ResQ <your-email@domain.com>
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

---

### 2. Mobile App Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator.
- Scan the QR code using **Expo Go** on a physical device.

---

## 🚢 Deployment

### Render Cloud Deployment
The repository includes [render.yaml](render.yaml) for one-click Infrastructure-as-Code deployment:
1. Connect your repository to **Render**.
2. Select **New $\rightarrow$ Blueprint** and choose this repository.
3. Configure the required environment variables in the Render Dashboard (`TURSO_DB_URL`, `TURSO_AUTH_TOKEN`, `BREVO_SMTP_KEY`, etc.).
4. Deploy!

---

## 📄 License

This project is licensed under the MIT License.
