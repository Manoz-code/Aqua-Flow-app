````markdown
# AquaFlow Offline 💧

A simple offline-first water delivery management application built with **React, Vite, and Capacitor**.

AquaFlow is designed for small water delivery businesses that need to manage customers, deliveries, payments, revenue, and reports directly from an Android phone without depending on an internet connection or backend server.

---

## 📱 Features

### Dashboard

The Dashboard provides an overview of the business:

- Total customers
- Total deliveries
- Pending deliveries
- Total liters
- Total billed
- Total paid
- Outstanding amount
- Today's deliveries
- Today's revenue
- Current month's revenue
- Daily revenue history
- Monthly revenue history

Revenue history is calculated from stored delivery records, so previous days remain available.

---

### 👥 Customers

Customer management includes:

- Add customers
- Edit customers
- Delete customers
- Search customers
- Sort customers alphabetically
- Track customer delivery history
- Track billed amount
- Track paid amount
- Track outstanding balance
- Quick payment action
- Quick delivery action

Customer names and phone numbers are stored **exactly as entered by the user**.

For example:

```text
Name:
रमेश थापा

Phone:
९८४१२३४५६७
````

AquaFlow does not automatically convert or modify those values.

---

### 🚚 Deliveries

Delivery management includes:

* Create delivery
* Edit delivery
* Delete delivery
* Mark delivery as delivered
* Select customer using searchable CustomerPicker
* Enter water quantity
* Delivery price
* Extra charge
* Notes
* Delivery status
* Automatic total calculation
* Outstanding balance calculation

Common delivery presets include:

```text
1000 L → Rs. 900
2000 L → Rs. 1600
```

The price remains editable.

---

### 💰 Payments

Payment management includes:

* Record payment
* General payment
* Payment linked to a specific delivery
* Automatic remaining balance calculation
* Prevent payment exceeding the delivery balance
* Payment notes
* Payment history
* Delete payment
* Customer balance summary

Quick payment behavior:

```text
Customer Card
    ↓
Record Payment
    ↓
Customer automatically selected
    ↓
If one outstanding delivery:
    Delivery automatically selected
    Amount automatically filled
    ↓
Amount field focused
```

When opening a completely empty payment form:

```text
Record Payment
    ↓
Customer search opens
    ↓
Customer search gets focus
```

---

### 📊 Reports

Reports support:

* Date-range filtering
* Total deliveries
* Total liters
* Total billed
* Total paid
* Outstanding
* Payment count
* Customer summary
* Daily revenue history
* Monthly revenue history
* Yearly revenue history

Revenue history can be viewed as:

```text
Daily
Monthly
Yearly
```

---

## 🇳🇵 Nepali / Bikram Sambat Dates

AquaFlow uses the **Bikram Sambat (BS)** calendar for user-facing dates.

For example:

```text
Stored internally:
2026-08-18

Displayed:
२०८३-०५-०२
```

The application keeps the existing AD/ISO date internally so that sorting, filtering, and stored historical data remain reliable.

Nepali dates are used in:

* Dashboard
* Deliveries
* Payments
* Reports
* Date input fields
* Revenue history

Users can enter Nepali dates using Nepali or English digits.

Example:

```text
२०८३-०५-०२
```

or:

```text
2083-05-02
```

---

## 📦 Offline Storage

AquaFlow is designed to work without an internet connection.

Business data is stored locally on the device using browser storage.

The application does not require:

* PostgreSQL
* Express server
* API server
* Internet connection
* Cloud database

The main stored data includes:

* Customers
* Deliveries
* Payments
* Settings
* PIN/recovery information

---

## 🔐 Security

The application includes a local PIN screen.

Features include:

* 4-digit PIN
* Lock screen
* Change PIN
* Recovery code
* Local security settings

The application can be locked without deleting business data.

---

## 📱 Android

AquaFlow uses **Capacitor** to package the React application as an Android application.

The Android project is located at:

```text
android/
```

---

## 🧭 Mobile Navigation

AquaFlow includes mobile-specific navigation behavior.

### Sidebar

The sidebar can be opened with the hamburger button.

It closes when:

* A navigation item is selected
* The user taps outside the sidebar
* Android Back is pressed

### Android Back button priority

The Android Back button follows this order:

```text
Sidebar open
    ↓
Close sidebar

Delivery form open
    ↓
Close delivery form

Payment form open
    ↓
Close payment form

Otherwise
    ↓
Navigate to previous AquaFlow page
```

This prevents accidental navigation away from an open form.

---

## 🎨 Responsive Mobile UI

The interface includes dedicated mobile styling.

Mobile layouts use:

* Smaller cards
* Compact spacing
* Smaller icons
* Compact buttons
* Responsive forms
* Mobile sidebar drawer
* Touch-friendly controls

Responsive styles are located in:

```text
src/styles/responsive.css
```

---

## 🗂️ Project Structure

```text
AquaFlow-Offline/
│
├── android/
│
├── public/
│
├── src/
│   │
│   ├── components/
│   │   ├── CustomerPicker.jsx
│   │   ├── DashboardCard.jsx
│   │   ├── NepaliDateInput.jsx
│   │   ├── PinScreen.jsx
│   │   └── Sidebar.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Customers.jsx
│   │   ├── Deliveries.jsx
│   │   ├── Payments.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   │
│   ├── styles/
│   │   ├── cards.css
│   │   ├── dashboard.css
│   │   ├── deliveries.css
│   │   ├── forms.css
│   │   ├── index.css
│   │   ├── layout.css
│   │   ├── navigation.css
│   │   ├── picker.css
│   │   ├── pin.css
│   │   └── responsive.css
│   │
│   ├── utils/
│   │   ├── data.js
│   │   └── format.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── vite.config.js
├── capacitor.config.json
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Mobile

* Capacitor
* Android

### PWA

* vite-plugin-pwa
* Workbox

### Date

* `nepali-date-converter`

---

## 💻 Development Setup

Clone the repository:

```bash
git clone <repository-url>
cd AquaFlow-Offline
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The development server normally runs at:

```text
http://localhost:5173/
```

---

## 🏗️ Production Build

Create a production build:

```bash
npm run build
```

The generated files are placed in:

```text
dist/
```

---

## 🤖 Android Build

Sync the web application with Capacitor:

```bash
npx cap sync android
```

Build the debug APK:

```bash
cd android
./gradlew assembleDebug
```

The APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📲 Installing the APK with ADB

On Windows with Android platform tools:

```powershell
cd D:\platform-tools
.\adb.exe install -r "\\wsl$\Ubuntu-22.04\home\manoz\AquaFlow-Offline\android\app\build\outputs\apk\debug\app-debug.apk"
```

The `-r` option updates the existing application without intentionally clearing its existing app data.

---

## 🔄 Development Workflow

Recommended workflow:

```text
1. Edit React/CSS files
2. npm run build
3. Test in browser
4. Test responsive/mobile layout
5. npx cap sync android
6. Build APK
7. Install with adb
8. Test on Android
9. git status
10. git add .
11. git commit
12. git push
```

---

## 🧪 Testing Checklist

Before releasing a new APK, verify:

### Dashboard

* [ ] Today's revenue is correct
* [ ] Monthly revenue is correct
* [ ] Daily history is preserved
* [ ] Monthly history is preserved
* [ ] Customer balances are correct

### Customers

* [ ] Add customer
* [ ] Edit customer
* [ ] Delete customer
* [ ] Search customer
* [ ] Nepali names remain unchanged
* [ ] Nepali phone numbers remain unchanged

### Deliveries

* [ ] Add delivery
* [ ] Edit delivery
* [ ] Delete delivery
* [ ] Mark delivered
* [ ] Nepali delivery date
* [ ] Correct total calculation
* [ ] Correct outstanding amount

### Payments

* [ ] Record general payment
* [ ] Record delivery payment
* [ ] Auto-fill remaining balance
* [ ] Customer-card quick payment
* [ ] Amount field focus
* [ ] Customer search focus for empty form
* [ ] Payment history
* [ ] Nepali payment dates

### Reports

* [ ] From Date
* [ ] To Date
* [ ] Clear filter
* [ ] Daily history
* [ ] Monthly history
* [ ] Yearly history
* [ ] Customer summary

### Mobile

* [ ] Hamburger menu
* [ ] Outside-tap closes sidebar
* [ ] Android Back closes sidebar
* [ ] Android Back closes forms
* [ ] Android Back navigates correctly
* [ ] Cards fit phone screen
* [ ] Buttons are easy to tap

---

## 💾 Data Safety

AquaFlow is an offline application, so the device's local storage is important.

Before performing major application changes or reinstalling software, make sure a backup/export feature is available and tested.

Do not intentionally clear application storage unless you understand that this can remove locally stored business records.

---

## 📌 Current Application Philosophy

AquaFlow is intentionally designed to remain:

* Offline-first
* Simple
* Fast
* Mobile-friendly
* Easy to use
* Local-data focused
* Suitable for small water delivery businesses

The application should avoid unnecessary backend infrastructure while the offline workflow remains the primary requirement.

---

## 📄 License

This project is currently intended as a private/local business application.

Add an appropriate open-source license here if the project is later published for public reuse.

```
```
