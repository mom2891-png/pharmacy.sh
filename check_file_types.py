import requests

urls = [
    {"id": "g132", "url": "https://www.kdca.go.kr/filepath/boardDownload.es?bid=0019&list_no=721869&seq=1"},
    {"id": "g131", "url": "https://www.kdca.go.kr/filepath/boardDownload.es?bid=0019&list_no=727442&seq=1"},
    {"id": "g129", "url": "https://www.kdca.go.kr/filepath/boardDownload.es?bid=0019&list_no=714161&seq=1"},
    {"id": "g133", "url": "https://www.kdca.go.kr/filepath/boardDownload.es?bid=0019&list_no=138138&seq=236"},
    {"id": "g177", "url": "https://www.researchgate.net/profile/Seockhoon_Chung/publication/340273873_bulmyeonjeung_imsangjinlyojichim_bulmyeonjeung-ui_jindangwa_chilyo_Korean_Clinical_Practice_Guideline_for_Management_of_Insomnia_in_Adults/data/5e81daaca6fdcc139c143c4d/hangugpan-bulmyeonjeung-imsangjinlyojichim-2019.pdf"}
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

for item in urls:
    try:
        response = requests.head(item['url'], headers=headers, allow_redirects=True, timeout=10)
        content_type = response.headers.get('Content-Type', 'Unknown')
        content_disposition = response.headers.get('Content-Disposition', '')
        print(f"ID: {item['id']} | Type: {content_type} | Info: {content_disposition}")
    except Exception as e:
        print(f"ID: {item['id']} | Error: {e}")
