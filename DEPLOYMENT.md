# CodeTime Navigator - Deployment Guide

## Prerequisites

- OpenAI API key (for GPT-4 analysis)
- Anthropic API key (for Claude analysis)
- GitHub account for repository access
- Render account (for backend deployment)
- Vercel account (for frontend deployment)

## Backend Deployment (Render)

1. **Connect Repository to Render:**
   - Go to [Render](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository
   - Set root directory to `backend`

2. **Configure Environment:**
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `ANTHROPIC_API_KEY`: Your Anthropic API key

3. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://your-app.onrender.com`)

## Frontend Deployment (Vercel)

1. **Update Next.js Configuration:**
   - Edit `frontend/next.config.js`
   - Replace `your-render-app.onrender.com` with your actual Render URL

2. **Deploy to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Deploy

## Local Development

### Backend Setup:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env file
uvicorn main:app --reload
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /analyze` - Start repository analysis
- `GET /analysis/{repo_id}` - Get analysis status/results
- `POST /query` - Query repository with natural language
- `GET /visualize/{repo_id}` - Get visualization data

## Demo Repositories

For testing and demonstration, try these repositories:
- https://github.com/facebook/react
- https://github.com/vercel/next.js
- https://github.com/microsoft/vscode
- https://github.com/nodejs/node

## Performance Notes

- Analysis time depends on repository size (1000+ commits may take 2-5 minutes)
- LLM API calls are cached to avoid re-processing
- SQLite database stores analysis results for quick retrieval
- Background processing allows multiple concurrent analyses

## Troubleshooting

1. **Analysis Fails:**
   - Check repository URL is public and accessible
   - Verify API keys are correctly set
   - Check Render logs for detailed error messages

2. **Frontend Connection Issues:**
   - Verify backend URL in next.config.js
   - Check CORS settings if deploying to different domains
   - Ensure API proxy is working correctly

3. **Performance Issues:**
   - Reduce max_commits parameter for large repositories
   - Check API rate limits for OpenAI/Anthropic
   - Monitor Render resource usage