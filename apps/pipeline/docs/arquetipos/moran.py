import pandas as pd, numpy as np, shapefile
from shapely.geometry import shape
from shapely.strtree import STRtree
r=shapefile.Reader('/mnt/user-data/uploads/ReVoto/conjunto_de_datos/00mun',encoding='latin1')
geoms=[];keys=[]
for sr in r.iterShapeRecords():
    keys.append(sr.record[0]); geoms.append(shape(sr.shape.__geo_interface__).simplify(200).buffer(50))
tree=STRtree(geoms)
F=pd.read_csv("clusters.csv",dtype={"cvegeo":str})
F=F[F.pct24.notna()]
val=dict(zip(F.cvegeo,F.pct24))
idx={k:i for i,k in enumerate(keys)}
nb={}
for i,g in enumerate(geoms):
    nb[keys[i]]=[keys[j] for j in tree.query(g,predicate="intersects") if j!=i]
ks=[k for k in keys if k in val]
x=np.array([val[k] for k in ks]); z=x-x.mean()
pos={k:i for i,k in enumerate(ks)}
num=0;W=0;diff=[]
for k in ks:
    ns=[pos[n] for n in nb[k] if n in pos]
    if not ns: continue
    num+=z[pos[k]]*z[ns].sum(); W+=len(ns)
    diff.append(val[k]-np.mean([x[j] for j in ns]))
I=len(ks)/W*num/(z**2).sum()
print("Moran I 2024:",round(I,3),"n",len(ks),"vecinos medios",round(W/len(ks),2))
diff=np.array(diff); print("dif vs vecinos |p50| p90",round(np.median(abs(diff)),1),round(np.quantile(abs(diff),.9),1))
pd.Series({k:len(v) for k,v in nb.items()}).to_csv("n_vecinos.csv")
