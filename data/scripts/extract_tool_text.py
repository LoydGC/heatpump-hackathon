import json,sys
d=json.load(open(sys.argv[1])); t=d[0]['text']
s,_=json.JSONDecoder().raw_decode(t)
open(sys.argv[2],'w').write(s)
