
npx create-next-app@latest voxguard-frontend
cd voxguard-frontend

--ensure you are on voxguard-frontend directory
npm run dev

user1, user1, 69d515e2f34eb98b2e9a70bc
user2, user2, 69d5166af34eb98b2e9a70bd

Open Chrome instance for debugging
open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-vscode-debug

http://localhost:3000/login

NEXT_PUBLIC_API_BASE_URL

1. In the voxguard-frontend root, create a file named .env.local.

2. Add the variable with your backend URL:
NEXT_PUBLIC_API_BASE_URL=http://localhost:9001

3. Save the file, then restart the dev server:
npm run dev

4. Use it in the app with:
process.env.NEXT_PUBLIC_API_BASE_URL

If needed, in VS Code Terminal on Mac:
cd /Users/albundy/dev/cpsc454_frontend/voxguard-frontend
touch .env.local

CORS issue
on the python backend running Uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


--Swagger documentation
http://localhost:9001/docs

