import sqlite3, json, os
p = os.path.join(os.getcwd(), 'backend', 'database.db')
conn = sqlite3.connect(p)
cur = conn.cursor()
cur.execute('SELECT id, fullName, email, isAdmin, isMain, createdAt FROM admins ORDER BY id DESC')
rows = cur.fetchall()
cols = [d[0] for d in cur.description]
print(json.dumps([dict(zip(cols, r)) for r in rows], default=str, indent=2))
conn.close()
