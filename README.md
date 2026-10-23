# CivicVision 🛣️
### AI-Powered Road Hazard Detection and Monitoring System
**Developed by Team Cognitech**  
*Tagline: "Detect Hazards. Map Risks. Build Safer Roads."*

---

## 📌 Project Overview
**CivicVision** is an end-to-end smart city road quality surveillance and hazard management application designed for municipal authorities, highway engineers, and citizens. It facilitates the rapid identification, geographic triage, and resolution tracking of dangerous road defects including:
- **Potholes** (Asphalt cavity formations)
- **Road Cracks** (Structural and fatigue fissures)
- **Open Manholes** (Displaced stormwater and utility covers)
- **Illegal Dumping** (Unauthorized construction debris & municipal waste)

The project combines modern web engineering, geospatial mapping with Leaflet, persistent relational storage via SQLite, and an image processing / AI detection pipeline.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Lucide React icons, Leaflet & OpenStreetMap |
| **Backend** | Python 3.10+, Flask, Flask-CORS, OpenCV (`cv2`), Pillow (`PIL`), NumPy, ONNX Runtime |
| **Database** | SQLite 3 (`civicvision.db`) |
| **Architectural Style** | RESTful API Client-Server Architecture |

---

## 📁 Project Architecture & Directory Structure

```
field project/
├── backend/
│   ├── app.py                 # Flask REST API endpoints & CORS setup
│   ├── database.py            # SQLite schema, queries, metrics & Haversine duplicate detection
│   ├── detection.py           # Modular AI/CV detection engine & demo analyzer
│   ├── seed_data.py           # Demonstration hazard dataset (labelled as demo)
│   ├── create_demo_images.py  # Utility script generating visual sample evidence
│   ├── test_backend.py        # Unit test suite for backend logic
│   ├── test_auth.py           # Authentication API tests
│   ├── requirements.txt       # Python package dependencies
│   ├── civicvision.db         # Persistent SQLite database
│   ├── models/                # Directory for placing custom ONNX neural weights
│   └── uploads/               # Stored user-submitted and demo hazard images
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top header bar with real-time status
│   │   │   ├── Sidebar.jsx          # Cognitech brand sidebar with active route states
│   │   │   ├── HazardModal.jsx      # Hazard inspection, status updater & delete dialog
│   │   │   ├── DuplicateModal.jsx   # 50m proximity duplicate alert modal
│   │   │   └── CategoryChart.jsx    # Visual category distribution chart
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # 4 dynamic KPI cards, recent feed & high-priority triage
│   │   │   ├── HazardMap.jsx        # Leaflet interactive map with custom pins & click-to-add
│   │   │   ├── HazardList.jsx       # Searchable, filterable table with in-place status changer
│   │   │   ├── Detection.jsx        # AI image upload, preset runner & 1-click database save
│   │   │   ├── Login.jsx            # Account registration and sign-in
│   │   │   └── ReportHazard.jsx     # Manual field report with GPS permission & safety warning
│   │   ├── services/
│   │   │   └── api.js               # Centralized REST API client
│   │   ├── App.jsx                  # Main routing configuration
│   │   ├── index.css                # Tailwind directives and Leaflet custom pin styling
│   │   └── main.jsx                 # React root render
│   ├── package.json                 # Frontend dependencies and scripts
│   └── vite.config.js               # Vite config with backend proxy
│
├── test_e2e.py                      # Live end-to-end integration test suite
├── .gitignore
└── README.md                        # Documentation & college evaluation guide
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites & Required Software
Ensure you have the following installed on your computer:
- **Python**: Version 3.10, 3.11, 3.12, 3.13, or 3.14.
- **Node.js**: Version 18.x or newer (Node v20+ recommended).
- **Git** (optional).

---

### ⚡ 1-Click Launch (Windows)
If you are on Windows, you can launch both backend and frontend simultaneously with a single click:
- Double-click **`start_all.bat`** in the project root!  
  *(Or run `.\start_all.bat` in your terminal)*

Alternatively, follow the manual steps below.

---

### 2. Backend Setup & Startup (Flask + SQLite)

Open a terminal in the project directory:

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
python -m pip install -r requirements.txt

# Start the Flask backend server
python app.py
```

The Flask server will start at:  
👉 **`http://127.0.0.1:5000`**

> **Note**: On the first start, CivicVision automatically creates `civicvision.db` and populates 8 clearly labelled demonstration hazard records so the dashboard looks functional immediately.

### Account authentication

Open the frontend and choose **Create an account** to register with an email address and password (at least 8 characters). Passwords are stored as hashes, and successful sign-in creates an HTTP-only session cookie. The dashboard, hazard APIs, image detection, and uploaded images require a signed-in account. The health endpoint remains public.

The frontend API client uses `VITE_API_URL` as the Flask server base URL (default: `https://civicvision-moku.onrender.com`). For a Vercel deployment, set `VITE_API_URL` to that Render URL in the Vercel project environment and redeploy. The Flask CORS allowlist includes `https://civic-vision-one.vercel.app`; append any additional Vercel preview/testing origins to `CIVICVISION_CORS_ORIGINS` as a comma-separated list.

For production, configure a persistent, high-entropy `CIVICVISION_SECRET_KEY` shared by all backend workers. Cross-site Vercel-to-Render sessions use `SameSite=None` and `Secure` cookies by default. For local HTTP development, set `CIVICVISION_SESSION_COOKIE_SAMESITE=Lax` and `CIVICVISION_COOKIE_SECURE=false`.

Example PowerShell configuration before starting the backend:

```powershell
$env:CIVICVISION_SECRET_KEY = "<generate and provide a unique secret>"
$env:CIVICVISION_CORS_ORIGINS = "https://your-preview-domain.vercel.app"
python app.py
```

The backend generates a temporary secret when `CIVICVISION_SECRET_KEY` is unset; this is intended for local development only and invalidates sessions when the process restarts.

---

### 3. Frontend Setup & Startup (React + Vite)

Open a second terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install
# (Note: On Windows PowerShell if script execution is restricted, run: npm.cmd install)

# Start the Vite development server
npm run dev
# (or: npm.cmd run dev)
```

The frontend will start at:  
👉 **`http://localhost:5173`**

Open your web browser and navigate to `http://localhost:5173/` to view **CivicVision**!

---

## 🧭 Application Features & Walkthrough

### 1. Operations Dashboard (`/dashboard`)
- **4 Dynamic KPI Cards**:
  1. *Total Hazards* (Total recorded incidents)
  2. *High-Severity Hazards* (Critical & High priority incidents)
  3. *Awaiting Verification* (Records with status `Detected`)
  4. *Resolved Hazards* (Restored roadway sections)
- **Category Distribution Chart**: Visual percentage bars calculating potholes, cracks, manholes, and dumping directly from SQLite.
- **Highest-Priority Hazards**: Unresolved critical items requiring urgent maintenance dispatch.
- **Recent Telemetry Feed**: Last 5 hazards recorded in the system.

### 2. Interactive Geospatial Hazard Map (`/map`)
- Built using **Leaflet** and **OpenStreetMap**.
- Custom color-coded pulsing pins by severity:
  - 🔴 **Critical** (Open voids, immediate structural failures)
  - 🟠 **High** (Severe potholes, large tire hazard)
  - 🟡 **Medium** (Fatigue cracking, minor debris)
  - 🟢 **Low** (Minor cosmetic damage)
- **Interactive Popups**: Click any pin to view details, photo, coordinates, and change its investigation status.
- **Click-to-Add Feature**: Click anywhere on the map to pin a location and immediately open the hazard reporting form with pre-filled GPS coordinates.
- **Offline / Tile Server Guard**: Displays a graceful notification if internet connectivity or tile servers fail without crashing the app.

### 3. Hazard Registry & Table (`/hazards`)
- Full tabular view of all recorded road hazards with search and multi-criteria filtering (Category, Severity, Status).
- **Inline Status Editor**: Change status directly in the table (`Detected` ➔ `Verified` ➔ `In Progress` ➔ `Resolved`). Every change is immediately saved to SQLite and persists across browser refreshes.
- **Details Modal & Deletion**: Inspect photos and full records, or permanently delete test entries after confirmation.

### 4. AI Image Detection Studio (`/detection`)
- Upload road images (PNG, JPG, WEBP up to 10MB) or select from **1-Click Evaluation Presets** (Pothole, Open Manhole, Road Crack, Illegal Dumping).
- **Honest Attribution Policy**: Results are explicitly badged as either:
  - 🤖 `Actual AI Inference` (when an ONNX neural model is loaded)
  - 🏷️ `Demonstration Mode` (OpenCV edge density and texture feature analysis)
- Displays predicted category, confidence score percentage, and suggested severity.
- **1-Click Save**: Register the detection directly to the database with GPS coordinates and custom notes.

### 5. Field Reporting & Geolocation (`/report`)
- Citizen and road inspector reporting form with strict coordinate validation (-90 to 90, -180 to 180).
- **Device GPS Integration**: Uses browser geolocation with explicit user permission and transparent explanation.
- **Driver Safety Protocol**: Prominent safety banner reminding operators never to operate mobile devices while driving.
- **Duplicate Detection**: Warns if an unresolved hazard of the same category already exists within 50 meters.

---

## 🧠 Technical Concept Explanations (For College Project Defense)

### 1. How Does the Haversine Duplicate Detection Work?
To prevent duplicate reports when multiple citizens report the same pothole, CivicVision implements the **Haversine formula** in `backend/database.py`:

$$\Delta\sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$

$$d = R \cdot \Delta\sigma$$

Where:
- $\phi_1, \phi_2$ are the latitudes in radians.
- $\Delta\lambda$ is the difference in longitude in radians.
- $R$ is Earth's mean radius ($6,371,000\text{ meters}$).

If an unresolved hazard of the same category exists within **50 meters**, the backend responds with `HTTP 409 Conflict`. The user is alerted with the distance (e.g. *"15.3 meters away"*) and offered a choice to link their observation or force creation.

### 2. How Does the AI Detection Service Work?
Located in `backend/detection.py`:
1. **Model Check**: Checks `backend/models/road_hazard_model.onnx`. If present, it executes real neural network tensor inference with ONNX Runtime (`detection_source = 'Actual AI Inference'`).
2. **OpenCV Feature Extraction**: If trained neural weights are not yet connected, it analyzes:
   - **Canny Edge Density**: High linear edge ratio identifies road cracks and fractures.
   - **Contour Circularity**: Identifies circular rims matching open manholes.
   - **Low-Reflectance Dark Ratio**: Clusters depressed dark areas typical of deep potholes.
   - **Color Standard Deviation**: Quantifies scattered high-entropy textures typical of illegal debris/dumping.
3. **Academic Integrity**: Every prediction is clearly identified as `Actual AI Inference` or `Demonstration Mode`.

### 3. How to Connect a Trained Neural Model Later?
To connect a trained PyTorch, TensorFlow, or YOLO model:
1. Export your trained model to ONNX format (e.g., using `torch.onnx.export` or `model.export(format="onnx")`).
2. Save the file to: `backend/models/road_hazard_model.onnx`.
3. Restart `backend/app.py`. The system will automatically detect the weights, initialize `ort.InferenceSession`, and switch the badge to **Actual AI Inference**!

---

## 🗄️ Database Management & Resetting

CivicVision uses SQLite (`civicvision.db`).

### To Reset the Database to Default Demonstration Records:
Simply delete the `civicvision.db` file in `backend/`:
```bash
# On Windows PowerShell
cd backend
Remove-Item civicvision.db

# Restart server
python app.py
```
CivicVision will re-create the schema and re-seed the default 8 demonstration records automatically.

---

## 🧪 Automated Testing

CivicVision includes three automated test suites:

### 1. Backend Unit Tests
```bash
cd backend
python test_backend.py
```
*Tests SQLite connection, schema, dashboard metrics, Haversine duplicate calculations, CRUD operations, and detection fallback.*

### 2. Authentication API Tests
```bash
cd backend
python -m unittest test_auth
```
*Tests registration, validation, password login, session/logout, and API authorization using a temporary database.*

### 3. End-to-End Live Integration Tests
```bash
python test_e2e.py
```
*Executes live HTTP requests against both Flask (port 5000) and Vite proxy (port 5173), validating endpoints, CORS, 409 conflict responses, status patching, and record deletion.*

---

## ❓ Troubleshooting Common Issues

| Issue | Cause | Solution |
|---|---|---|
| `npm : File ... npm.ps1 cannot be loaded` | Windows PowerShell execution policy restriction | Run `npm.cmd install` and `npm.cmd run dev` instead of `npm`. |
| `Failed to fetch` or `Backend Offline` | Flask backend is not running | Ensure `python app.py` is running in a terminal on `http://127.0.0.1:5000`. |
| Map tiles do not load | OpenStreetMap tile server rate limit or offline | CivicVision displays a non-blocking offline banner. Markers and coordinate picking still function normally. |
| Duplicate warning on submission | A hazard exists within 50 meters | Click *"Submit As Separate Hazard Anyway"* or change the coordinates slightly. |

---

## 👥 Development Team
**Team Cognitech**  
- Developed as a practical, production-ready smart city road infrastructure monitoring project.
- Crafted for transparent academic evaluation and real-world municipal applicability.
