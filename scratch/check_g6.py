
import sqlite3
conn = sqlite3.connect('public/data/db/pharmacy.db')
c = conn.cursor()
row = c.execute('SELECT id, title FROM guidelines WHERE id="g6"').fetchone()
print(row)
conn.close()
