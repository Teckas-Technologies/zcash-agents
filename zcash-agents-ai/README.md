# :rocket: Zcash Agents AI
A **FastAPI-powered** agent API for blockchain transactions. This API allows developers to create blockchain agents dynamically using **smart contract ABIs** and interact with them via chat-based commands.
---
## :open_file_folder: Project Structure
```
zcash-agents/zcash-agents-ai/
│── app/
│   │── __init__.py
│   │── main.py       # Main FastAPI entry point
│   │── config.py     # Loads environment variables from .env
│   │── routes/
│   │   │── __init__.py
│   │   │── agents.py # API for agent creation
│   │   │── chat.py   # API for chat interactions
│   │── utils/
│   │   │── __init__.py
│   │   │── web3_utils.py  # Web3 helper functions
│   │   │── openai_utils.py # OpenAI helper functions
│── .env           # Stores API keys (DO NOT COMMIT)
│── .gitignore     # Ignore venv, .env, etc.
│── requirements.txt # List of dependencies
│── README.md      # Documentation
│── start.sh       # Startup script for deployment
│── Dockerfile     # Docker configuration
```
---
## :white_check_mark: **1. Setup Virtual Environment (`venv`)
:one: **Navigate to the project directory:**
```bash
cd ~/zcash-agents/zcash-agents-ai/
```
:two: **Create and activate a virtual environment:**
```bash
python -m venv venv  # Create venv
source venv/bin/activate  # Activate venv (Mac/Linux)
venv\Scripts\Activate  # (Windows PowerShell)
```
:three: **Install dependencies:**
```bash
pip install -r requirements.txt
```
:four: **Save installed packages:**
```bash
pip freeze > requirements.txt
```
---
## :rocket: **2. Running FastAPI Locally**
:one: **Ensure `.env` file exists with API keys:**
```
INFURA_API_KEY=your_infura_api_key
OPENAI_API_KEY=your_openai_api_key
```
:two: **Run the FastAPI server using Uvicorn:**
```bash
uvicorn app.main:app --reload
```
:pushpin: **Open in Browser:**
- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **Redoc UI:** `http://127.0.0.1:8000/redoc`
---
## :hammer_and_wrench: **3. Running FastAPI with Gunicorn (Production Mode)**
:one: **Install Gunicorn:**
```bash
pip install gunicorn
```
:two: **Run with Gunicorn & Uvicorn Workers:**
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```
:pushpin: This starts **4 workers** for handling requests efficiently.
---
## :whale: **4. Running FastAPI with Docker**
:one: **Create a `Dockerfile`:**
```dockerfile
FROM python:3.10
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
:two: **Build the Docker image:**
```bash
docker build -t blockchain-agent-api .
```
:three: **Run the Docker container:**
```bash
docker run -p 8000:8000 blockchain-agent-api
```
---
## :earth_africa: **5. Deploying on a Linux Server (AWS/GCP/DO)**
:one: **Ensure Python is installed** (Python 3.10+ recommended)
```bash
sudo apt update && sudo apt install python3 python3-venv -y
```
:two: **Clone the repository & set up venv**
```bash
git clone https://github.com/your-repo/blockchain-agent-api.git
cd blockchain-agent-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
:three: **Run FastAPI with Gunicorn (daemon mode)**
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 app.main:app --daemon
```
:four: **Enable Firewall (if required)**
```bash
sudo ufw allow 8000/tcp
```
Now access the API at `http://server-ip:8000` :rocket:
---
## :rocket: **6. Deploy with Docker on a Server**
:one: **Install Docker (if not installed)**
```bash
sudo apt update && sudo apt install docker.io -y
```
:two: **Run FastAPI inside Docker:**
```bash
docker build -t blockchain-agent-api .
docker run -d -p 8000:8000 blockchain-agent-api
```
:white_check_mark: Your API is now running inside a **Docker container** and accessible from anywhere!
---
## :trophy: **Done! Your Zcash Agent API is Ready!** :dart:
- Use `venv` for local development.
- Use `Gunicorn` for **high-performance production** deployment.
- Use **Docker** for **containerized deployment** on any cloud.
:rocket: **Now your FastAPI project is production-ready and can be deployed anywhere!** :rocket: