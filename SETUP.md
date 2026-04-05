# Workout Tracker — Setup Guide

## Requirements
- Node.js installed (download from https://nodejs.org if you don't have it)

## How to Run

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to this folder:
   ```
   cd "Body composition./workout-tracker"
   ```
3. Install dependencies (one time only):
   ```
   npm install
   ```
4. Start the app:
   ```
   npm run dev
   ```
5. Open your browser and go to: **http://localhost:5173**

## First Login
- Default PIN: **1234**
- Change it in Settings after logging in

## Adding AI Recommendations (Optional)
1. Go to Settings in the app
2. Paste your Claude API key (get it from console.anthropic.com)
3. After each workout, the AI will analyze your performance and recommend exact weights for next session

## How to Use
1. Open the app on your phone browser (use your computer's local IP: http://192.168.x.x:5173)
2. Hit **+** to start today's workout
3. For each exercise: enter weight → log sets → rate the difficulty
4. After finishing: see your next session targets automatically

## To Access on Phone
When running `npm run dev`, note your computer's local IP address.
On your phone (connected to same WiFi), go to: http://[YOUR_IP]:5173

Or run: `npm run dev -- --host` to expose it on your network automatically.
