import urllib.request, json

queries = [
    ("bagh-o-bahar", "Bagh-o-Bahar", "Mir Amman"),
    ("diwan-e-ghalib", "Diwan-e-Ghalib", "Mirza Ghalib"),
    ("mirat-ul-uroos", "Mirat-ul-Uroos", "Deputy Nazir Ahmad"),
    ("taubat-un-nasuh", "Taubat-un-Nasuh", "Deputy Nazir Ahmad"),
    ("ibn-ul-waqt", "Ibn-ul-Waqt", "Deputy Nazir Ahmad"),
    ("umrao-jan-ada", "Umrao Jan Ada", "Mirza Hadi Ruswa"),
    ("fasana-e-azad", "Fasana-e-Azad", "Ratan Nath Sarshar"),
    ("bang-e-dra", "Bang-e-Dra", "Allama Iqbal"),
    ("bal-e-jibril", "Bal-e-Jibril", "Allama Iqbal"),
    ("zarb-e-kaleem", "Zarb-e-Kaleem", "Allama Iqbal"),
    ("musaddas-e-hali", "Musaddas-e-Hali", "Altaf Hussain Hali"),
    ("aab-e-hayat", "Aab-e-Hayat", "Muhammad Husain Azad"),
    ("nairang-e-khayal", "Nairang-e-Khayal", "Muhammad Husain Azad"),
    ("al-farooq", "Al-Farooq", "Shibli Nomani"),
    ("asar-us-sanadid", "Asar-us-Sanadid", "Sir Syed Ahmad Khan")
]

for slug, title, author in queries:
    url = f"https://archive.org/advancedsearch.php?q={slug}+language%3Aurd&fl[]=identifier,title,downloads,page_count&rows=1&output=json"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as r:
            res = json.loads(r.read())
            docs = res.get("response", {}).get("docs", [])
            if docs:
                print(f"{slug} => ID: {docs[0].get('identifier')} | Title: {docs[0].get('title')}")
            else:
                print(f"{slug} => NONE")
    except Exception as e:
        print(f"{slug} => ERR {e}")

