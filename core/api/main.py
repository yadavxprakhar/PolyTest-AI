import uvicorn

def start_server():
    """Launch the FastAPI REST API Server on localhost:8000."""
    print("🚀 Firing up PolyTest AI REST Server...")
    print("📖 Swagger Docs available at: http://127.0.0.1:8000/docs")
    print("-------------------------------------------------------")
    uvicorn.run("core.api.app:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    start_server()
