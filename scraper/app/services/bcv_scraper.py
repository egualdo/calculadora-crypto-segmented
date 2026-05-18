import re
import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import urllib3

# Suppress insecure request warnings due to verify=False
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger("bcv_scraper")

class BcvScraper:
    BASE_URL = "https://www.bcv.org.ve/"
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    TIMEOUT = 10  # seconds

    @staticmethod
    def normalize_number(value: str) -> float | None:
        """
        Cleans and normalizes Venezuelan formatted numbers (e.g. '36.543,20' or ' 36,54320000 ')
        to a standard float.
        """
        if not value:
            return None
        
        # Remove whitespaces
        cleaned = re.sub(r"\s+", "", value)
        # Remove dots (thousands separators)
        cleaned = cleaned.replace(".", "")
        # Replace comma with dot (decimal separator)
        cleaned = cleaned.replace(",", ".")
        
        # Extract number sequence
        match = re.search(r"[\d\.\-]+", cleaned)
        if match:
            try:
                return float(match.group(0))
            except ValueError:
                return None
        return None

    @classmethod
    def extract_value_from_root(cls, element) -> float | None:
        """
        Extracts the rate value from a BeautifulSoup element, looking for a <strong> tag
        first, or falling back to a regex match on the raw text.
        """
        strong = element.find("strong")
        if strong:
            val_text = strong.get_text()
            return cls.normalize_number(val_text)
        
        raw_text = element.get_text()
        fallback_match = re.search(r"([\d\.]+,[\d]+)", raw_text)
        if fallback_match:
            return cls.normalize_number(fallback_match.group(1))
        
        return None

    @classmethod
    def find_value_by_keyword(cls, keyword: str, html: str) -> float | None:
        """
        Fallback search in the whole HTML source if elements weren't found.
        """
        # Pattern 1: keyword + up to 80 non-digit/non-hyphen characters + number
        pattern1 = re.compile(
            re.escape(keyword) + r"[^\d\-]{0,80}([\d\.,]+)",
            re.IGNORECASE | re.UNICODE
        )
        match1 = pattern1.search(html)
        if match1:
            val = cls.normalize_number(match1.group(1))
            if val is not None and val > 0:
                return val

        # Pattern 2: "1" + keyword/ISO + up to 20 non-digits + number
        pattern2 = re.compile(
            r"1\s*(?:" + re.escape(keyword) + r"|[A-Z]{3})[^\d]{0,20}([\d\.,]+)",
            re.IGNORECASE | re.UNICODE
        )
        match2 = pattern2.search(html)
        if match2:
            val = cls.normalize_number(match2.group(1))
            if val is not None and val > 0:
                return val
                
        return None

    @classmethod
    def get_rates(cls) -> dict | None:
        """
        Main method that fetches the BCV page, parses it, and returns the structured rates.
        """
        try:
            # Make the HTTP request, bypassing SSL/TLS certificate validation issues
            response = requests.get(
                cls.BASE_URL,
                headers=cls.HEADERS,
                timeout=cls.TIMEOUT,
                verify=False
            )
            
            if response.status_code != 200:
                logger.error(f"BCV fetch failed: {response.status_code}")
                return None

            html = response.text
            soup = BeautifulSoup(html, "html.parser")
            
            usd_val = None
            eur_val = None

            # Look for specific container elements
            # NestJS selector: [id*="recuadrotsmc"], .recuadrotsmc
            recuadro_elements = soup.select('[id*="recuadrotsmc"], .recuadrotsmc')
            
            for element in recuadro_elements:
                text = element.get_text()
                
                # Check for Dollar
                if usd_val is None and re.search(r"d[oó]lar|usd|dollar", text, re.IGNORECASE):
                    usd_val = cls.extract_value_from_root(element) or usd_val
                
                # Check for Euro
                if eur_val is None and re.search(r"euro|eur", text, re.IGNORECASE):
                    eur_val = cls.extract_value_from_root(element) or eur_val

            # Fallback search by keyword if values are still None
            if usd_val is None:
                usd_keywords = ["Dólar", "Dolar", "USD"]
                for keyword in usd_keywords:
                    val = cls.find_value_by_keyword(keyword, html)
                    if val is not None and val > 0:
                        usd_val = val
                        break

            if eur_val is None:
                eur_keywords = ["Euro", "EUR"]
                for keyword in eur_keywords:
                    val = cls.find_value_by_keyword(keyword, html)
                    if val is not None and val > 0:
                        eur_val = val
                        break

            rates = {}
            current_time = datetime.utcnow().isoformat() + "Z"

            if usd_val is not None:
                rates["official"] = {
                    "buy": usd_val,
                    "sell": usd_val,
                    "average": usd_val,
                    "name": "BCV Dólar Oficial",
                    "last_updated": current_time,
                    "source": "bcv.org.ve"
                }

            if eur_val is not None:
                rates["euro"] = {
                    "buy": eur_val,
                    "sell": eur_val,
                    "average": eur_val,
                    "name": "BCV Euro",
                    "last_updated": current_time,
                    "source": "bcv.org.ve"
                }

            if not rates:
                logger.warning("No rates could be scraped from BCV page.")
                return None

            return rates

        except Exception as e:
            logger.error(f"BCV scraping error: {str(e)}")
            return None
