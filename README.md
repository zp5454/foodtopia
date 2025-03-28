# Foodtopia - Health & Nutrition Tracking App

A comprehensive health and nutrition companion that transforms wellness tracking into an engaging, intelligent experience.

## Features

- Food tracking with ingredient analysis
- Workout tracking with specialized metrics (including rowing workouts)
- Progress visualization and statistics
- Barcode scanning for food items
- FDA database integration
- Progressive Web App (PWA) functionality

## Deploying to GitHub Pages

### Step 1: Push to GitHub

1. Create a new repository on GitHub named `foodtopia`
2. Initialize Git in this repository (if not already done):
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Link to your GitHub repository:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/foodtopia.git
   git push -u origin main
   ```

### Step 2: Configure GitHub Pages

1. Go to your repository on GitHub
2. Navigate to Settings > Pages
3. For Source, select GitHub Actions
4. The workflow will automatically deploy your app when you push to the main branch

### Step 3: Access Your PWA

1. Once deployed, your app will be available at `https://YOUR_USERNAME.github.io/foodtopia/`
2. On iOS, open the site in Safari
3. Tap the Share button (the square with an arrow pointing up)
4. Scroll down and tap "Add to Home Screen"
5. Give your app a name and tap "Add"

Your Foodtopia app will now appear on your home screen like a native app!

## Development

### Running Locally

```
npm run dev
```

### Building for Production

```
npm run build
```

## Backend Connection

Note: When deployed to GitHub Pages, the app won't have access to the backend server. For a fully functional app with backend capabilities, consider deploying both the frontend and backend to a service like Render, Vercel, or Heroku.