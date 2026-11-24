"""Builds a single-file rocket_flight_3d.html from index.html + css/ + js/ (run from the project root)."""
import re
h=open('index.html',encoding='utf-8').read()
h=re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">',lambda m:'<style>\n'+open(m.group(1),encoding='utf-8').read()+'</style>',h)
h=re.sub(r'<script src="(js/[^"]+)"></script>',lambda m:'<script>\n'+open(m.group(1),encoding='utf-8').read()+'</script>',h)
open('rocket_flight_3d.html','w',encoding='utf-8').write(h)
print('wrote rocket_flight_3d.html')
