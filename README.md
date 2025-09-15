# Campaign Rules Engine

A simple app to **automate Meta Ads campaign management**. Users can set conditions that trigger campaign actions, such as:

- Pausing campaigns
- Adjusting budgets
- Logging events  

The code structure allows easy addition of new actions, and automation rules are based on metrics from the **Meta Ads API** (e.g., Spend, ROAS, CTR). These metrics are essential, but more can be added to make automation rules more complex and complete.

The app uses:

- **Frontend:** React + Vite + TypeScript  
- **Backend:** Node.js + Express.js + TypeScript  

> **Note:** At the time of writing, the endpoint `https://dev-api.adcopy.ai/challenge-proxy/meta` returned a 404. Mock data is used to demonstrate core functionality.

---

## Features

- Define simple or compound rules (AND / OR logic)  
- Trigger actions automatically based on API metrics  
- Real-time updates via **Server-Sent Events (SSE)**  
- View triggered actions with timestamps, campaigns, actions, and conditions  
- Easily extensible backend for new rules and actions  

---

## Getting Started

### Prerequisites

- Node.js **18+** recommended
- Git (optional, for cloning)

---

### Backend (Express + TypeScript)

**Path:** `backend/`

1. **Install dependencies**

```bash
cd backend
npm install
```
2. **Configure API constants**

Edit backend/src/config.ts:

```
META_PROXY_API_BASE_URL = "<YOUR_API_URL>"
META_PROXY_BEARER_TOKEN = "<YOUR_TOKEN>"
SAMPLE_CAMPAIGN_ID = "<OPTIONAL_CAMPAIGN_ID>"
```
3. **Run in development (hot reload)**
   

```
npm run dev
```
 Starts on: http://localhost:4000

  Health check: GET /health → { "status": "ok" }

  **API Endpoints:**

  - **GET /rules** → List all rules
  
  - **POST /rules** → Create a rule ({ condition: string, action: string })

  - **GET /actions** → List triggered actions

  - **GET /events** → SSE stream for real-time updates

  Background job: fetches campaign data every 10s, evaluates rules, logs triggered actions (each rule fires once per campaign)

4. **Build and run compiled code**
   
```
  npm run build
  npm start
```

### Frontend (React + Vite + TypeScript)

**Path:** frontend/

1. **Install dependencies**

```
cd frontend
npm install
```


2. **Run in development**

```
npm run dev
```

Opens at: http://localhost:5173

**UI Features:**

- Create simple or compound rules (AND/OR)

- View current rules

- See triggered actions in real-time (SSE)

- Auto-refresh without manual intervention

3. **Build and preview**

```
npm run build
npm run preview
```

> **Notes:** Backend must run before frontend for SSE and API calls to succeed. CORS is enabled for local development. NodeNext ESM: backend imports require .js extensions for local files (e.g., ./config.js).
