#!/bin/bash
# 🚀 GenAI Academy Hackathon: Final Deployment Script

echo "🏆 Preparing your Multi-Agent Project for Final Submission..."

# 1. GITHUB REPOSITORY (Manual step required for auth)
echo "--------------------------------------------------------"
echo "STEP 1: Push to your GitHub account"
echo "1. Go to https://github.com/new"
echo "2. Create a repository named 'gen-ai-acadmy-workforce'"
echo "3. Run the following commands in your terminal:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/gen-ai-acadmy-workforce.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo "--------------------------------------------------------"

# 2. GOOGLE CLOUD RUN DEPLOYMENT
echo "STEP 2: Deploying to Google Cloud Run..."
PROJECT_ID=$(gcloud config get-value project)
echo "Detected GCP Project ID: $PROJECT_ID"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ ERROR: No GCP Project configured. Run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

# Build and Push using Cloud Build (Track 1 requirement)
echo "Building container via Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/productivity-workforce .

# Deploy to Cloud Run (Track 1 requirement)
echo "Deploying to Cloud Run..."
gcloud run deploy productivity-workforce \
    --image gcr.io/$PROJECT_ID/productivity-workforce \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated

# 3. FINAL LINKS
echo "--------------------------------------------------------"
echo "✅ DEPLOYMENT COMPLETE!"
echo "Your Cloud Run URL is displayed above."
echo "Provide that URL and your GitHub link in the hackathon dashboard."
echo "--------------------------------------------------------"
