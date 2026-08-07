# Hyper-Local Food Excess Exchange: Android App Architecture & Technical Blueprint
*(React Native with Expo & Django REST Framework - 100% Local Development)*

## 1. Executive Summary & Mobile Architecture

The **Hyper-Local Food Excess Exchange** mobile application connects commercial kitchens (restaurants, bakeries, caterers) directly with nearby community shelters and budget-conscious consumers. Built for native Android deployment using **React Native (Expo)** on the frontend and **Django REST Framework (DRF)** on the backend, this mobile-first setup provides instant camera-based QR redemption, native geolocation tracking, and dynamic mapping.

This blueprint details a fully local development stack:
* **Mobile Client:** Expo SDK 51+ (React Native) with Expo Router, React Native Maps, Expo Camera, and Expo Location.
* **Backend Server:** Django 5.0 + DRF with SimpleJWT authentication.
* **Database & File System:** Local SQLite (`db.sqlite3`) with pure Python Haversine spatial calculations and local disk storage (`/media/`) for tax receipt PDFs.
* **Real-time Layer:** Django Channels with an In-Memory channel layer for WebSocket notifications.

---

## 2. Key Mobile Differentiators

* **Native Geolocation & Map Integration:** Hardware-accelerated maps using `react-native-maps` linked with `expo-location` for precise user distance checks.
* **Embedded Web Cam / Hardware Camera Scanner:** Fast verification using `expo-camera` to scan consumer/NGO pickup QR codes at kitchen doors.
* **Digital Pass Wallet:** Mobile view rendering high-contrast QR passes offline or online for rapid redemption.
* **Role-Based Navigation (Expo Router):** Distinct, secure tab layouts tailored to Commercial Kitchen Donors, Shelters/NGOs, and Consumers.

---

## 3. Technology Stack & Local Dependencies

| Component | Production Stack | Local Mobile Development Stack | Purpose / Role |
| :--- | :--- | :--- | :--- |
| **Mobile Frontend** | React Native (Expo) | **React Native (Expo SDK 51+)** | Cross-platform mobile runtime. |
| **Routing / Navigation** | Expo Router | **Expo Router v3** | File-based native screen navigation. |
| **Mapping Engine** | Mapbox Mobile SDK | **`react-native-maps`** | Native Android/Google Maps engine. |
| **Device Hardware APIs** | Native Android Modules | **`expo-location`, `expo-camera`** | Geolocation & camera QR scanning. |
| **Backend REST API** | Django 5.0 + DRF | **Django 5.0 + DRF** | REST endpoints & business logic. |
| **Authentication** | OAuth2 / Session Cookies | **`djangorestframework-simplejwt`** | Bearer JWT Token Auth for mobile requests. |
| **Database** | PostgreSQL + PostGIS | **SQLite 3 + Haversine Formula** | Single-file database (`db.sqlite3`). |
| **Real-Time Push** | Firebase Cloud Messaging / Redis | **Django Channels (In-Memory)** | WebSockets within local network. |
| **PDF Generation** | AWS Lambda / Cloud Services | **ReportLab (Django Local)** | Generates IRS 170(e)(3) tax receipt PDFs. |

---

## 4. Mobile System Data Flow

```
+-----------------------------------------------------------------------------------+
|                           EXPO REACT NATIVE MOBILE APP                            |
|                                                                                   |
|  +--------------------+     +---------------------+     +----------------------+  |
|  | Donor Camera View  |     | React Native Maps   |     | Digital QR Wallet    |  |
|  | (expo-camera)      |     | (react-native-maps) |     | (react-native-svg)   |  |
|  +---------+----------+     +----------+----------+     +----------+-----------+  |
|            |                           |                           |              |
+------------|---------------------------|---------------------------|--------------+
             |                           |                           |
     REST API (HTTP/JWT)         REST API (HTTP/JWT)         WebSockets (ws://)
             |                           |                           |
+------------v---------------------------v---------------------------v--------------+
|                               DJANGO BACKEND (DRF)                                |
|   (Runs on http://10.0.2.2:8000 for Android Emulator or Local IP:8000)             |
|                                                                                   |
|  +--------------------+     +---------------------+     +----------------------+  |
|  | JWT Authentication |     | Haversine Distance  |     | In-Memory Channels   |  |
|  | (SimpleJWT)        |     | Search Engine       |     | (WebSocket Engine)   |  |
|  +---------+----------+     +----------+----------+     +----------+-----------+  |
|            |                           |                           |              |
|            +---------------------------+---------------------------+              |
|                                        |                                          |
|  +-------------------------------------v---------------------------------------+  |
|  |                         LOCAL FILE & STORAGE LAYER                          |  |
|  |                                                                             |  |
|  |   +-------------------------------+     +-------------------------------+   |  |
|  |   | SQLite Database (`db.sqlite3`)|     | Media Root (`/media/`)        |   |  |
|  |   | Stores Users, Items, Orders   |     | Stores Tax PDF Receipts       |   |  |
|  |   +-------------------------------+     +-------------------------------+   |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 5. Complete Project Directory Layout

```text
hyperlocal-food-exchange/
├── backend/                        # Django REST Framework Backend
│   ├── manage.py
│   ├── db.sqlite3                  # Local SQLite Database
│   ├── media/                      # Local PDF Receipts & Uploads
│   │   └── tax_receipts/
│   ├── core/
│   │   ├── asgi.py
│   │   ├── wsgi.py
│   │   ├── urls.py
│   │   └── settings.py             # SimpleJWT & Local IP Settings
│   └── apps/
│       ├── users/                  # Custom User Model & JWT Token Views
│       ├── listings/               # Haversine Distance API & Listings
│       ├── orders/                 # Order Claims & QR Verification
│       ├── tax_receipts/           # ReportLab PDF Generator
│       └── notifications/          # Django Channels WebSockets
│
└── mobile/                         # Expo React Native App
    ├── package.json
    ├── app.json                    # Expo Configuration (Plugins for Camera & Location)
    ├── tsconfig.json
    ├── babel.config.js
    ├── assets/                     # App icons & map marker graphics
    └── src/
        ├── app/                    # Expo Router (File-based Routing)
        │   ├── _layout.tsx         # Master App Provider & QueryClient Setup
        │   ├── index.tsx           # Entry Gatekeeper / Auth Redirect
        │   ├── (auth)/
        │   │   ├── login.tsx       # JWT Token Login Screen
        │   │   └── register.tsx    # Role-based Account Registration
        │   └── (tabs)/             # Main Tab Bar Engine
        │       ├── _layout.tsx     # Dynamic Tab Navigation based on User Role
        │       ├── donor/          # Commercial Kitchen Views
        │       │   ├── index.tsx   # Active Surplus Dashboard
        │       │   ├── create.tsx  # Post Food Surplus Form
        │       │   ├── scan.tsx    # Expo Camera QR Scanner
        │       │   └── tax.tsx     # Tax Log & PDF Download View
        │       ├── shelter/        # NGO & Community Kitchen Views
        │       │   ├── index.tsx   # Priority 100% Free Food Feed
        │       │   └── claims.tsx  # Reserved NGO Collections
        │       └── consumer/       # Price-Sensitive Consumer Views
        │           ├── index.tsx   # Distance-sorted Deals Feed
        │           ├── map.tsx     # Native React Native Map View
        │           └── wallet.tsx  # QR Code Pickup Pass Wallet
        ├── components/
        │   ├── MapViewComponent.tsx
        │   ├── QRPassModal.tsx
        │   └── ListingCard.tsx
        ├── hooks/
        │   ├── useLocation.ts      # Native expo-location hook
        │   ├── useAuth.ts          # Auth state & SecureStore JWT hook
        │   └── useNearbyListings.ts# TanStack Query integration
        ├── services/
        │   ├── api.ts              # Axios instance configured for Local IP / Emulator
        │   └── storage.ts          # expo-secure-store token manager
        └── types/
            └── index.ts            # TypeScript interfaces
```

---

## 6. Django Backend Setup & Mobile Configuration

Mobile clients running on Android Emulators or physical devices cannot connect to `localhost`. You must configure Django to accept connections over the local network and set up **SimpleJWT** for mobile token authentication.

### `core/settings.py`
```python
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-mobile-local-dev-key'
DEBUG = True

# Allow local network IPs, localhost, and Android Emulator host (10.0.2.2)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third Party Packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    
    # Local Apps
    'apps.users',
    'apps.listings',
    'apps.orders',
    'apps.tax_receipts',
    'apps.notifications',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}

CORS_ALLOW_ALL_ORIGINS = True
AUTH_USER_MODEL = 'users.User'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

---

## 7. Django Models & Haversine Spatial Logic

### Database Schema (`apps/listings/models.py`)
```python
from django.db import models
from django.conf import settings

class FoodListing(models.Model):
    class ListingType(models.TextChoices):
        DONATION = 'DONATION', '100% Free NGO Donation'
        DISCOUNT = 'DISCOUNT', 'Discounted Consumer Sale'

    donor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    listing_type = models.CharField(max_length=20, choices=ListingType.choices, default=ListingType.DISCOUNT)
    
    original_price = models.DecimalField(max_digits=6, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    estimated_fmv = models.DecimalField(max_digits=6, decimal_places=2, help_text="Fair Market Value for Tax Receipt")
    
    quantity_available = models.PositiveIntegerField(default=1)
    
    # Geolocation standard float fields for pure SQLite support
    latitude = models.FloatField()
    longitude = models.FloatField()
    pickup_address = models.CharField(max_length=255)
    
    pickup_start = models.DateTimeField()
    pickup_end = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
```

### Haversine Proximity Search View (`apps/listings/views.py`)
```python
import math
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import FoodListing
from .serializers import FoodListingSerializer

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class NearbyFoodListingsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            user_lat = float(request.query_params.get('lat'))
            user_lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return Response({"error": "Valid 'lat' and 'lng' parameters required."}, status=status.HTTP_400_BAD_REQUEST)

        radius_km = float(request.query_params.get('radius_km', 5.0))

        # Rough bounding box pre-filter
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * math.cos(math.radians(user_lat)))

        candidates = FoodListing.objects.filter(
            is_active=True,
            quantity_available__gt=0,
            latitude__gte=user_lat - lat_delta,
            latitude__lte=user_lat + lat_delta,
            longitude__gte=user_lng - lng_delta,
            longitude__lte=user_lng + lng_delta,
        )

        results = []
        for item in candidates:
            dist = haversine(user_lat, user_lng, item.latitude, item.longitude)
            if dist <= radius_km:
                data = FoodListingSerializer(item).data
                data['distance_km'] = round(dist, 2)
                results.append(data)

        results.sort(key=lambda x: x['distance_km'])
        return Response(results, status=status.HTTP_200_OK)
```

---

## 8. Expo React Native Implementation Snippets

### 1. API Service Config (`src/services/api.ts`)
Configures Axios to connect to the Django host depending on whether you are using an Android Emulator or a Physical Phone on local Wi-Fi.

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android Emulator uses 10.0.2.2 to point to host computer localhost
// Physical Android Phone uses your local network IP (e.g., http://192.168.1.50:8000)
const LOCAL_IP = '192.168.1.50'; // Replace with your local machine IP
const BASE_URL = Platform.OS === 'android' && __DEV__
  ? `http://${LOCAL_IP}:8000/api/v1`
  : 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. Expo Geolocation Hook (`src/hooks/useLocation.ts`)
```typescript
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  return { location, errorMsg };
}
```

### 3. Native Map Screen (`src/app/(tabs)/consumer/map.tsx`)
```tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useLocation } from '../../../hooks/useLocation';
import { api } from '../../../services/api';

export default function ConsumerMapScreen() {
  const { location } = useLocation();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (location) {
      api.get(`/listings/nearby/?lat=${location.latitude}&lng=${location.longitude}&radius_km=10`)
        .then(res => setListings(res.data))
        .catch(err => console.error(err));
    }
  }, [location]);

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Fetching Location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {listings.map((item: any) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            pinColor={item.listing_type === 'DONATION' ? 'green' : 'orange'}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.price}>
                  {item.discounted_price === "0.00" ? "FREE DONATION" : `$${item.discounted_price}`}
                </Text>
                <Text style={styles.distance}>{item.distance_km} km away</Text>
              </div>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  callout: { padding: 5, width: 160 },
  title: { fontWeight: 'bold', fontSize: 14 },
  price: { color: '#059669', fontWeight: 'bold', marginTop: 4 },
  distance: { fontSize: 10, color: '#64748b', marginTop: 2 }
});
```

### 4. Donor Camera QR Scanner Screen (`src/app/(tabs)/donor/scan.tsx`)
```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../../../services/api';

export default function DonorQRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access is required to scan redemption QR passes.</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const response = await api.post('/orders/verify-qr/', { qr_code_hash: data });
      if (response.data.valid) {
        Alert.alert("Success!", `Verified ${response.data.item_title} for ${response.data.claimant}`, [
          { text: "OK", onPress: () => setScanned(false) }
        ]);
      }
    } catch (error: any) {
      Alert.alert("Invalid Pass", error.response?.data?.message || "QR Code verification failed", [
        { text: "Try Again", onPress: () => setScanned(false) }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View style={styles.overlay}>
        <Text style={styles.scanText}>Scan Customer QR Pickup Pass</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  overlay: {
    position: 'absolute',
    bottom: 60,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  scanText: { color: '#ffffff', fontWeight: 'bold' }
});
```

---

## 9. Mobile Screen & Tab Navigation Breakdown

### 1. Kitchen Donor Screens (`app/(tabs)/donor/`)
* **Dashboard (`index.tsx`):** Active surplus inventory cards, portion counters, and pickup countdown timers.
* **Post Item (`create.tsx`):** Form with title, original/discount price, FMV rating, allergen toggles, and location picker.
* **Scan Pass (`scan.tsx`):** `expo-camera` view that scans pickup QR codes and marks orders completed instantly.
* **Tax Log (`tax.tsx`):** Accumulated deduction ledger with download buttons that open locally generated tax PDF receipts.

### 2. NGO & Shelter Screens (`app/(tabs)/shelter/`)
* **Priority Rescue Feed (`index.tsx`):** Real-time feed restricted to **100% Free** bulk donations sorted by distance.
* **Claim Queue (`claims.tsx`):** Claimed food items with turn-by-turn navigation buttons linking directly to Google Maps or Apple Maps.

### 3. Consumer Screens (`app/(tabs)/consumer/`)
* **Deals Feed (`index.tsx`):** Card-based marketplace of discounted excess meals sorted by proximity.
* **Interactive Map (`map.tsx`):** Native `react-native-maps` view displaying clickable category pins.
* **Pass Wallet (`wallet.tsx`):** Storage for active pickup QR codes generated via `react-native-svg` and `qrcode`.

---

## 10. Local Development & Android Testing Guide

### Step 1: Configure Android Permissions (`mobile/app.json`)
Ensure the camera and location plugins are present in `app.json`:

```json
{
  "expo": {
    "name": "FoodExchange",
    "slug": "food-exchange",
    "version": "1.0.0",
    "scheme": "foodexchange",
    "plugins": [
      [
        "expo-location",
        { "locationAlwaysAndWhenInUsePermission": "Allow FoodExchange to detect nearby food offers." }
      ],
      [
        "expo-camera",
        { "cameraPermission": "Allow FoodExchange to scan QR codes for pickup verification." }
      ]
    ]
  }
}
```

### Step 2: Start Django Backend
```bash
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Bind to 0.0.0.0 to listen on local network for physical phone/emulator connections
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Run Expo Mobile App
In a second terminal:

```bash
cd mobile
npm install

# Start Expo local server
npx expo start
```

### Step 4: Launch on Android
* **Android Studio Emulator:** Press `a` in the Expo terminal window.
* **Physical Android Device:** Download the **Expo Go** app from Google Play Store and scan the QR code printed in your terminal (ensure phone is on the same local Wi-Fi network).

---

## 11. Core API Endpoints

| Method | Endpoint | Description | Auth Header |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/users/token/` | Obtains SimpleJWT access and refresh tokens. | None |
| `GET` | `/api/v1/listings/nearby/` | Queries active listings by `lat`, `lng`, and `radius_km`. | Optional |
| `POST` | `/api/v1/listings/` | Posts a new food surplus item. | Bearer Token (Donor) |
| `POST` | `/api/v1/orders/reserve/` | Claims an item and returns unique `qr_code_hash`. | Bearer Token |
| `POST` | `/api/v1/orders/verify-qr/` | Scans QR hash and completes the order. | Bearer Token (Donor) |

---
*Blueprint generated for Hyper-Local Food Excess Exchange - React Native (Expo) & Django Local Architecture.*
