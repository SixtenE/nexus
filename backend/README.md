## run macOS
    
    cd backend
    pyenv local 3.13.5
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt 
    uvicorn main:app --reload
    open http://localhost:3000/data/stockholm

