import pandas as pd, numpy as np, shapefile, json
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
F=pd.read_csv("features.csv",dtype={"cvegeo":str}); F["tend"]=F.tend/7.5*10
C=["nivel","efp","tend","vol"]
D=F[F.n>=5].dropna(subset=C).copy()
lo,hi=D[C].quantile(.01),D[C].quantile(.99)
sc=StandardScaler().fit(D[C].clip(lo,hi,axis=1))
km=KMeans(5,n_init=50,random_state=0).fit(sc.transform(D[C].clip(lo,hi,axis=1)))
NAMES={}
cen=pd.DataFrame(sc.inverse_transform(km.cluster_centers_),columns=C)
for i,c in cen.iterrows():
    if c.vol>9: NAMES[i]="Montaña rusa"
    elif c.tend>10: NAMES[i]="En ascenso"
    elif c.nivel>12: NAMES[i]="Siempre presente"
    elif c.efp>1: NAMES[i]="De elección grande"
    else: NAMES[i]="Bajando el ritmo"
print(NAMES)
Zall=sc.transform(F[C].fillna(0).clip(lo,hi,axis=1))
dist=np.linalg.norm(Zall[:,None,:]-km.cluster_centers_[None],axis=2)
F["arq_id"]=dist.argmin(1); F["arquetipo"]=F.arq_id.map(NAMES)
F.loc[(F.n<5)|F[C].isna().any(axis=1),"arquetipo"]="Historial corto"
F["tipicidad"]=np.where(F.arquetipo=="Historial corto",np.nan,1/(1+dist.min(1)))
# razón principal: rasgo con mayor |z| ponderado
zc=pd.DataFrame(Zall,columns=C)
F["rasgo"]=zc.abs().idxmax(axis=1)
r=shapefile.Reader('/mnt/user-data/uploads/ReVoto/conjunto_de_datos/00mun',encoding='latin1'); nm={x[0]:x[3] for x in r.records()}
re_=shapefile.Reader('/mnt/user-data/uploads/ReVoto/conjunto_de_datos/00ent',encoding='latin1'); ne={x[0]:x[2] for x in re_.records()}
F["municipio"]=F.cvegeo.map(nm); F["entidad"]=F.cvegeo.str[:2].map(ne)
S=F.groupby("arquetipo").agg(n=("mun","size"),nivel=("nivel","median"),efp=("efp","median"),tend=("tend","median"),vol=("vol","median"),pct24=("pct24","median"),pob=("pob","median"),ln24=("ln24","sum")).round(1)
S["ln_share"]=(S.ln24/S.ln24.sum()*100).round(1)
print(S)
ex={}
for i,nme in NAMES.items():
    d=F[(F.arq_id==i)&(F.arquetipo==nme)&(F.ln24>30000)].copy(); d["d"]=dist[d.index,i]
    ex[nme]=[f"{a}, {b}" for a,b in d.nsmallest(3,"d")[["municipio","entidad"]].values]
print(json.dumps(ex,ensure_ascii=False,indent=1))
print(F.rasgo.value_counts().to_dict())
F.round(3).to_csv("arquetipos_municipales.csv",index=False)
json.dump({"variables":C,"clip_lo":lo.round(4).tolist(),"clip_hi":hi.round(4).tolist(),"media":sc.mean_.round(4).tolist(),"escala":sc.scale_.round(4).tolist(),
  "centroides_z":km.cluster_centers_.round(4).tolist(),"nombres":[NAMES[i] for i in range(5)]},open("modelo_arquetipos.json","w"),ensure_ascii=False,indent=1)
