from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.api.routes import router

app = FastAPI(
    title="PolyTest AI REST Platform",
    description="Intelligent Multi-Language Unit Test Generation & Subprocess Execution Service.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS so Web Dashboards or IDE extensions can easily query PolyTest AI APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include central routing
app.include_router(router)

@app.get("/", tags=["Root"])
def root_redirect():
    """Welcome portal landing page."""
    return {
        "app": "PolyTest AI REST Engine",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
        "paradigms": ["Static Analysis", "AI Generation", "Syntax Validation", "Subprocess Execution"]
    }

@app.get("/health", tags=["Root"])
def health_check():
    """Health and engine sanity check endpoint."""
    import sys
    import shutil
    return {
        "status": "healthy",
        "platform": sys.platform,
        "python_version": sys.version,
        "binaries_detected": {
            "node": shutil.which("node") is not None,
            "javac": shutil.which("javac") is not None,
            "g++": shutil.which("g++") is not None,
            "go": shutil.which("go") is not None,
            "dotnet": shutil.which("dotnet") is not None or shutil.which("csc") is not None
        }
    }
