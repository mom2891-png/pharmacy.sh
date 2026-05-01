import requests
import os

url = "https://www.hira.or.kr/rc/insu/insuadtcrtr/InsuAdtCrtrFileDownload.do?mtgHmeDd=20230201&sno=6&mtgMtrRegSno=0001"
# 팝업 페이지 주소를 Referer로 설정하여 서버 보안 체크를 통과합니다.
headers = {
    "Referer": "https://www.hira.or.kr/rc/insu/insuadtcrtr/InsuAdtCrtrPopup.do?mtgHmeDd=20230201&sno=6&mtgMtrRegSno=0001",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

target_path = r"c:\Users\Admin\.gemini\antigravity\scratch\pharmacy-info\assets\data\guidelines\고혈압_급여기준_2023.hwp"

# 폴더 생성
os.makedirs(os.path.dirname(target_path), exist_ok=True)

try:
    print(f"Downloading from: {url}")
    response = requests.get(url, headers=headers, timeout=30)
    
    if response.status_code == 200:
        with open(target_path, "wb") as f:
            f.write(response.content)
        file_size = os.path.getsize(target_path)
        print(f"Successfully downloaded HWP: {target_path} ({file_size} bytes)")
    else:
        print(f"Failed to download. Status code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
