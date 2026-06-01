# 📦 Inventory & Order Management System

A full-stack, production-ready Inventory and Order Management System built with **FastAPI**, **React**, and **PostgreSQL** — fully containerized with **Docker Compose** for seamless deployment.

---

## 🚀 Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| **Backend**  | Python 3.11, FastAPI, SQLAlchemy, Pydantic |
| **Frontend** | React 18, Axios, React Router     |
| **Database** | PostgreSQL 15 (Alpine)            |
| **DevOps**   | Docker, Docker Compose            |

---

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd EA

# 2. Copy the example environment file
cp .env.example .env

# 3. (Optional) Edit .env to customize credentials
#    nano .env

# 4. Build and start all services
docker-compose up --build -d

# 5. Verify all containers are running
docker-compose ps
```

The application will be available at:

| Service      | URL                                  |
| ------------ | ------------------------------------ |
| **Frontend** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:8000](http://localhost:8000) |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

---

## 📁 Project Structure

```
EA/
├── backend/                # FastAPI backend application
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── database.py     # Database connection & session
│   │   └── routers/        # API route handlers
│   │       ├── products.py
│   │       ├── customers.py
│   │       └── orders.py
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container config
├── frontend/               # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # Axios API service layer
│   │   ├── App.js          # Root component with routing
│   │   └── index.js        # React entry point
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container config
├── docker-compose.yml      # Multi-service orchestration
├── .env                    # Environment variables (local)
├── .env.example            # Environment variables template
└── README.md               # Project documentation
```

---

## 🔐 Environment Variables

| Variable            | Description                     | Default         |
| ------------------- | ------------------------------- | --------------- |
| `POSTGRES_USER`     | PostgreSQL superuser username   | `admin`         |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password   | `changeme`      |
| `POSTGRES_DB`       | PostgreSQL database name        | `inventory_db`  |
| `DB_USER`           | Backend database username       | `admin`         |
| `DB_PASSWORD`       | Backend database password       | `changeme`      |
| `DB_NAME`           | Backend database name           | `inventory_db`  |

> ⚠️ **Important:** Change the default passwords before deploying to production.

---

## 🛠️ Useful Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f backend

# Remove all data (including database volume)
docker-compose down -v
```

---

## 📖 API Documentation

Once the backend is running, interactive API documentation is available at:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
"# inventrack" 
