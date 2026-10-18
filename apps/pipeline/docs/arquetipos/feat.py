import pandas as pd, numpy as np
m=pd.read_csv("panel_municipal.csv",dtype={"cvegeo":str})
m=m[m.pct.notna()&(m.ln>m.ns)]
m["nsr"]=m.ns/m.ln
nat=m.groupby("anio").apply(lambda d: d.sv.sum()/(d.ln.sum()-d.ns.sum())*100)
m["rel"]=m.pct-m.anio.map(nat)
PRES={2012,2018,2024}
m["pres"]=m.anio.isin(PRES).astype(int)
rows=[]
for (e,u),d in m.groupby(["edo","mun"]):
    d=d.sort_values("anio")
    n=len(d); hp=d.pres.sum(); hi=n-hp
    nivel=d.rel.mean()
    efp=(d[d.pres==1].rel.mean()-d[d.pres==0].rel.mean()) if hp and hi else np.nan
    t=(d.anio-2016.5)/7.5
    # rel ~ a + b*t + c*pres
    X=np.c_[np.ones(n),t,d.pres] if hp and hi else np.c_[np.ones(n),t]
    beta,res,*_=np.linalg.lstsq(X,d.rel.values,rcond=None)
    resid=d.rel.values-X@beta
    rows.append(dict(edo=e,mun=u,cvegeo=d.cvegeo.dropna().iloc[-1] if d.cvegeo.notna().any() else None,n=n,
        nivel=nivel,efp=efp,tend=beta[1] if n>=3 else np.nan,vol=resid.std(ddof=min(X.shape[1],n-1)) if n>X.shape[1] else np.nan,
        pct24=d[d.anio==2024].pct.mean(), pct_mean=d.pct.mean(), nsr=d.nsr.mean(),
        pob=d.pob_inegi.dropna().iloc[-1] if d.pob_inegi.notna().any() else np.nan,
        ln24=d[d.anio==2024].ln.mean()))
F=pd.DataFrame(rows); F.to_csv("features.csv",index=False)
print(F.n.value_counts().to_dict()); print(F[["nivel","efp","tend","vol"]].describe().round(2))
print(F[["nivel","efp","tend","vol"]].corr().round(2))
