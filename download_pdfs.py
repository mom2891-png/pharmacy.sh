import json
import os
import re
import requests
import gdown

def sanitize_filename(name):
    # 특수문자 및 이모지 치환 (영문, 한글, 숫자, 띄어쓰기, 하이픈, 언더바, 괄호 등만 허용)
    name = re.sub(r'[^a-zA-Z0-9가-힣\s\-_\[\]\(\)]', '', name)
    return name.strip()

def download_file(url, filepath):
    # 구글 드라이브 링크 처리
    if "drive.google.com" in url or "drive.usercontent.google.com" in url:
        try:
            # gdown으로 구글 드라이브 안전 다운로드
            gdown.download(url, filepath, quiet=True, format="pdf")
            if os.path.exists(filepath) and os.path.getsize(filepath) > 5000: # 최소 5KB 이상이어야 정상파일
                return True
        except:
            pass
            
    # 일반 URL 처리
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15, stream=True)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            
            # HTML(로그인 화면/오류 페이지)를 다운로드 받는 것 방지
            if "text/html" in content_type.lower() and "drive.google.com" not in url:
                print(f"FAILED (HTML returned instead of PDF): {url}")
                return False
                
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            if os.path.getsize(filepath) > 5000:
                return True
            else:
                os.remove(filepath)
                return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False
        
    return False

def main():
    target_dir = "public/data/guidelines"
    os.makedirs(target_dir, exist_ok=True)
    
    json_path = '../parsed_guidelines.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    success_count = 0
    fail_count = 0
    
    print(f"Beginning download of {len(data)} guidelines...")
    
    for i, g in enumerate(data):
        url = g.get('url')
        if not url or not url.startswith('http'):
            continue
            
        major = sanitize_filename(g.get('major', '대분류미상'))
        sub = sanitize_filename(g.get('sub', '중분류미상'))
        title = sanitize_filename(g.get('title', f'가이드라인_{i}'))
        
        filename = f"{major}_{sub}_{title}.pdf"
        filepath = os.path.join(target_dir, filename)
        
        # 다운로드 시도
        if os.path.exists(filepath) and os.path.getsize(filepath) > 5000:
            print(f"[{i+1}/{len(data)}] 이미 존재함: {filename}")
            g['url'] = f"data/guidelines/{filename}"
            success_count += 1
            continue
            
        print(f"[{i+1}/{len(data)}] 다운로드 중: {filename} <- {url}")
        success = download_file(url, filepath)
        
        if success:
            g['url'] = f"data/guidelines/{filename}"
            success_count += 1
            print(" -> 성공!")
        else:
            fail_count += 1
            print(" -> 실패 (기존 URL 유지)")
            
    print(f"\n모든 다운로드 작업 완료! 성공: {success_count}, 실패: {fail_count}")
    
    # JSON 파일 덮어쓰기
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
