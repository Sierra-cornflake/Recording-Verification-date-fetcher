import requests
from bs4 import BeautifulSoup

url = "https://www.snoco.org/RecordedDocuments/search/index?theme=.blue&section=searchCriteriaName&quickSearchSelection="
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')
verification_div = soup.find('div', id='cfnVerifiedThrough')

with open("verification_date.txt", "w") as f:
    if verification_div:
        raw_text = verification_div.get_text(strip=True)
        f.write(raw_text)
    else:
        f.write("Verification date not found.")
