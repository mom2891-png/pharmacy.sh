import re, os

broken_files = [
    '심혈관질환_1 고혈압_고혈압 FACTSHEET.pdf',
    '내분비질환_25 당뇨병_당뇨병용제 급여기준.pdf',
    '심혈관질환_1. 고혈압_고혈압진료지침.pdf',
]

# 파일 실제 삭제
for f in broken_files:
    path = os.path.join('public', 'data', 'guidelines', f)
    if os.path.exists(path):
        os.remove(path)
        print(f'Deleted: {f}')
    else:
        print(f'Not found: {f}')

with open('data.js', 'r', encoding='utf-8') as fp:
    content = fp.read()

# URL 매핑: 파일명 -> 교체
for f in broken_files:
    url_in_data = 'public/data/guidelines/' + f
    # Remove the "url": "..." field for the broken file
    # Match the url field exactly
    content = content.replace(f'"url": "{url_in_data}"', '"url": ""')
    # Also handle escaped versions
    escaped = url_in_data.replace('.', '\\.').replace(' ', ' ')
    print(f'  Fixed url reference: {url_in_data}')

with open('data.js', 'w', encoding='utf-8') as fp:
    fp.write(content)

print('\nDone! Broken PDF entries cleared.')
