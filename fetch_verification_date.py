import requests
from bs4 import BeautifulSoup

url = "https://www.snoco.org/RecordedDocuments/search/index?theme=.blue&section=searchCriteriaName&quickSearchSelection="
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

verification_div = soup.find('div', id='cfnVerifiedThrough')
if verification_div:
    raw_text = verification_div.get_text(strip=True)
    with open("verification_date.txt", "w") as f:
        f.write(raw_text)
else:
    with open("verification_date.txt", "w") as f:
        f.write("Verification date not found.")
