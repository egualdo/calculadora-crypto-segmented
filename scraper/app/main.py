import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.services.bcv_scraper import BcvScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("main")

app = FastAPI(
    title="BCV Scraper Microservice",
    description="Python microservice to scrape and extract Dollar and Euro exchange rates from the BCV website.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
async def root():
    """
    Returns basic service details.
    """
    return {
        "service": "BCV Scraper Microservice",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "scrape_bcv": "/bcv"
        }
    }

@app.get("/health", tags=["General"])
async def health():
    """
    Health check endpoint for Kubernetes, Docker Compose, or status monitoring.
    """
    return {"status": "healthy"}

@app.get("/bcv", tags=["Scraper"])
async def scrape_bcv():
    """
    Executes the BCV scraping logic and returns the dollar and euro rates.
    """
    logger.info("Received request to scrape rates from BCV")
    rates = BcvScraper.get_rates()
    
    if rates is None:
        logger.error("Failed to scrape rates from BCV")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to scrape rates from BCV"
        )
        
    logger.info("Successfully scraped rates from BCV")
    return rates
