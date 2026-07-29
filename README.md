# LocalPulse — Web Simulator & Developer Workspace

This directory contains the **Web Simulator & Developer Workspace** for the LocalPulse notice board project, coupled with an **Enterprise End-to-End (E2E) Test Automation Framework**.

---

## 📂 Project Directory Structure

```text
local_pulse_workspace/
├── .github/workflows/
│   └── selenium-e2e.yml     # CI/CD GitHub Actions Pipeline
├── config/
│   └── config.js            # Global Test Runner Settings & Variables
├── pages/                   # Page Object Model (POM) Layer
│   ├── basePage.js          # Core Selenium Web Driver Interactions
│   ├── loginPage.js         # Sign-in Gateway Elements
│   ├── dashboardPage.js     # Metrics Dashboard & Sidebar Navigation
│   └── noticePage.js        # Bulletin Feed & Form Handlers
├── tests/
│   ├── baseTest.js          # Mocha Setup/Teardown Hooks & Failure Listeners
│   └── e2e.spec.js          # 13 Production E2E Test Cases
├── utilities/
│   ├── driverFactory.js     # Headless/Headed Chrome, Edge, and Firefox Factory
│   ├── excelReportGenerator.js # Professional Styled ExcelJS Report Builder
│   ├── logger.js            # Winston logging and step tracers
│   ├── smartScanner.js      # Dynamic UI element scanner & crawler
│   └── run-tests.js         # Programmatic Mocha Runner
├── excel/
│   └── E2E_Report.xlsx      # Beautiful generated multi-sheet Excel spreadsheet
├── reports/
│   └── index.html           # Interactive HTML reports (Mochawesome)
├── logs/
│   └── combined.log         # Trace logging
└── README.md
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
*   **Node.js** (v18 or higher)
*   **Google Chrome** or another supported browser (Firefox/Edge) installed locally.

### 2. Install Dependencies
Change directory to the workspace root and run:
```bash
npm install
```

### 3. Launch the Application Server
Run the local Express backend (which hosts the portal at `http://localhost:3005`):
```bash
npm start
```

---

## 🧪 Running Automation Tests

### 1. Execute the Selenium Test Suite
To execute the complete E2E test cases (13 checks spanning authentication, form inputs, dynamic modals, theme toggles, search filtering, and admin purge operations):
```bash
npm test
```
*This command runs the tests headlessly, records trace logs to `logs/combined.log`, generates an interactive HTML report under `reports/`, and builds a styled Excel spreadsheet at `excel/E2E_Report.xlsx`.*

### 2. Run the Smart UI Scanner (Dynamic Form Discoverer)
To dynamically crawl the portal views, find validation rules, and extract form schema structure:
```bash
npm run test:scan
```
*This outputs a scanned schema file to `data/discovered_metadata.json`.*

---

## 📊 Test Report Artifacts

After every execution, the framework generates:
1.  **Excel Logbook (`excel/E2E_Report.xlsx`):**
    *   *Sheet 1 - Summary:* Executive pass rates, dates, durations.
    *   *Sheet 2 - Test Cases:* Full status list of executed scripts.
    *   *Sheet 3 - Failed Tests:* Diagnostics, URL states, screenshot paths.
    *   *Sheet 4 - Execution Logs:* Detailed step-by-step trace of interactions.
2.  **HTML Dashboard (`reports/index.html`):** Interactive graphical dashboard showing execution metrics.
3.  **Screenshots (`reports/failures/`):** Viewport states saved automatically upon test assertion failures.

---

## ⚙️ CI/CD Integration (GitHub Actions)
The workflow `.github/workflows/selenium-e2e.yml` automatically triggers on every `push` and `pull_request` to `master`/`main`. It starts the Express server, runs the crawler, runs all tests headlessly in Chrome, and publishes the Excel spreadsheet and HTML dashboards as build artifacts.
