import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Tuple
import re

class WikipediaScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_article(self, url: str) -> Tuple[Dict, str]:
        """Scrape Wikipedia article and return structured data + raw HTML"""
        if not url.startswith("https://en.wikipedia.org/wiki/"):
            raise ValueError("Only English Wikipedia URLs are supported")
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            raw_html = response.text
            
            soup = BeautifulSoup(raw_html, 'html.parser')
            
            # Extract title
            title = soup.find('h1', {'id': 'firstHeading'}).text.strip()
            
            # Extract summary (first paragraph)
            content_div = soup.find('div', {'id': 'mw-content-text'})
            paragraphs = content_div.find_all('p', recursive=False)
            summary = ""
            for p in paragraphs:
                text = p.get_text().strip()
                if len(text) > 100:  # Get first substantial paragraph
                    summary = text
                    break
            
            # Extract sections
            sections = []
            for heading in soup.find_all(['h2', 'h3']):
                headline = heading.find('span', {'class': 'mw-headline'})
                if headline:
                    section_text = headline.get_text().strip()
                    if section_text and section_text not in ['References', 'External links', 'See also', 'Notes']:
                        sections.append(section_text)
            
            # Extract full article text for LLM
            article_text = self._extract_article_text(soup)
            
            # Extract key entities (simple extraction)
            key_entities = self._extract_entities(soup, article_text)
            
            data = {
                'title': title,
                'summary': summary[:500],  # Limit summary length
                'sections': sections[:15],  # Limit sections
                'article_text': article_text,
                'key_entities': key_entities
            }
            
            return data, raw_html
            
        except Exception as e:
            raise Exception(f"Failed to scrape Wikipedia article: {str(e)}")
    
    def _extract_article_text(self, soup: BeautifulSoup) -> str:
        """Extract clean article text for LLM processing"""
        content_div = soup.find('div', {'id': 'mw-content-text'})
        if not content_div:
            return ""
        
        # Remove unwanted elements
        for element in content_div.find_all(['table', 'script', 'style', 'sup', 'div.reflist']):
            element.decompose()
        
        # Get paragraphs
        paragraphs = content_div.find_all('p', recursive=False)
        text = '\n\n'.join([p.get_text().strip() for p in paragraphs if p.get_text().strip()])
        
        # Limit text size for LLM (max ~8000 words)
        words = text.split()
        if len(words) > 8000:
            text = ' '.join(words[:8000]) + '...'
        
        return text
    
    def _extract_entities(self, soup: BeautifulSoup, text: str) -> Dict[str, List[str]]:
        """Simple entity extraction from links and text"""
        people = set()
        organizations = set()
        locations = set()
        
        # Extract from links
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            title = link.get('title', '')
            
            if '/wiki/' in href and ':' not in href:
                # Simple heuristics
                if any(word in title.lower() for word in ['university', 'company', 'corporation', 'institute', 'organization']):
                    organizations.add(title)
                elif any(word in title.lower() for word in ['city', 'country', 'state', 'kingdom', 'empire']):
                    locations.add(title)
                elif title and len(title.split()) <= 3 and title[0].isupper():
                    people.add(title)
        
        return {
            'people': list(people)[:10],
            'organizations': list(organizations)[:10],
            'locations': list(locations)[:10]
        }