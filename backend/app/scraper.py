import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException

def scrape_wikipedia_article(url: str):
    try:
        # 1. Fetch the page
        headers = {'User-Agent': 'WikiQuizGenerator/1.0 (Contact: your@email.com)'}
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not reach Wikipedia. Check the URL.")

        soup = BeautifulSoup(response.content, 'html.parser')

        # 2. Extract Title
        title = soup.find(id="firstHeading").text

        # 3. Extract main content (all <p> tags inside the bodyContent div)
        content_div = soup.find(id="bodyContent")
        # We filter out paragraphs that are empty or just whitespace
        paragraphs = content_div.find_all('p')
        full_text = " ".join([p.get_text().strip() for p in paragraphs if p.get_text().strip()])

        # 4. Optional Bonus: Return the raw HTML as requested in the 'Bonus' section
        raw_html = str(response.content)

        return {
            "title": title,
            "text": full_text[:5000], # Limit to 5000 chars to avoid LLM token limits
            "raw_html": raw_html
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")