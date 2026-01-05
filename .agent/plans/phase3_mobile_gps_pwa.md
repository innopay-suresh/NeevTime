# Phase 3: Mobile PWA & GPS Geofenced Attendance
## Operational Objective
Enable employees to mark attendance using their smartphones, strictly restricted to specific geographic locations (Geofences) such as Office HQ, Client Sites, or Warehouses.

## 1. Technical Architecture

### A. Database Schema Changes (PostgreSQL)
We need to store "Allowed Locations" and enhance the logs to capture "Where" the person was.

1.  **New Table: `geofences`**
    *   `id`: UUID / Serial
    *   `name`: String (e.g., "Head Office", "Bangalore Warehouse")
    *   `latitude`: Decimal (e.g., 12.9716)
    *   `longitude`: Decimal (e.g., 77.5946)
    *   `radius_meters`: Integer (e.g., 100 meters)
    *   `is_active`: Boolean

2.  **Update Table: `attendance_logs`**
    *   Add `punch_source`: String ('biometric', 'mobile', 'web')
    *   Add `latitude`: Decimal (nullable)
    *   Add `longitude`: Decimal (nullable)
    *   Add `is_geofence_verified`: Boolean
    *   Add `distance_from_center`: Decimal (for auditing)

3.  **Update Table: `employees`**
    *   Add `assigned_geofence_id`: FK to `geofences` (Nullable - if null, valid everywhere or nowhere depending on policy)

### B. Backend Logic (Node.js)
1.  **Distance Calculation (Haversine Formula):**
    *   Implement a utility function to calculate the distance between user's live GPS and the target Geofence.
    *   *Logic:* `If Distance(User, Office) <= Office.Radius THEN Accept Punch ELSE Reject`.

2.  **API Endpoints:**
    *   `POST /api/mobile/punch`: Accepts `{ lat, lng, employee_id }`. Validates location. Records punch.
    *   `GET /api/geofences`: Manage locations.
    *   `POST /api/geofences`: Create new locations.

### C. Frontend Interface (React PWA)
1.  **Mobile-First "Punch" Screen:**
    *   Clean, simple UI optimized for phones.
    *   **Live Location Indicator:** Shows "Locating..." -> "You are at Head Office" (Green) or "You are 500m away" (Red).
    *   **Big Action Button:** "Slide to Punch In".

2.  **Admin Geofence Manager:**
    *   A page to Create/Edit allowed zones.
    *   (Optional) Map integration to pick location by clicking.

---

## 2. Implementation Steps

### Step 1: Database Migration
- Create the schema migration script to add tables and columns.

### Step 2: Backend API Development
- Implement the `Geofence` model and controller.
- Create the `MobilePunch` controller with the Haversine validation logic.

### Step 3: Frontend - Admin Module
- Add "Locations / Geofences" to the Settings menu.
- Build the form to add a location (Name, Lat, Lng, Radius).

### Step 4: Frontend - Employee Mobile View
- Create a new route `/mobile/attendance`.
- Implement `navigator.geolocation.getCurrentPosition`.
- Connect to the backend API.

## 3. Future Enhancements (Post-MVP)
- **Face Liveness Check:** integration to ensure user is real.
- **Offline Mode:** Store punch locally if internet is lost and sync later (with timestamp verification).
