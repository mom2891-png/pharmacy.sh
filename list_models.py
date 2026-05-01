import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from google import genai
client = genai.Client(api_key='AIzaSyATdMktBCEohBoZbQi2Gm_RDY5LkCxSTgE')
for m in client.models.list():
    if 'generateContent' in (m.supported_actions or []):
        print(m.name)
