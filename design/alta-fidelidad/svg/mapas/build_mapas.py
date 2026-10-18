"""Genera los SVG de mapas a partir del Marco Geoestadístico INEGI (00ent / 00mun).
Uso: python build_mapas.py [ruta/a/conjunto_de_datos]   (requiere: pip install pyshp shapely)
Los colores son de EJEMPLO (ruido aleatorio con semilla fija), no datos reales."""
import shapefile, math, random
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
import sys
D=(sys.argv[1] if len(sys.argv)>1 else '../../../../../conjunto_de_datos').rstrip('/')+'/'
PAL=['#fde3f0','#f9bcdb','#f08cc0','#e05aa6','#b8358f','#86297f','#5d1b6d']
def load(n):
    r=shapefile.Reader(D+n,encoding='latin1')
    f=[x[0] for x in r.fields[1:]]
    return [(dict(zip(f,rec.record)),shape(rec.shape.__geo_interface__)) for rec in r.iterShapeRecords()]
ent=load('00ent'); mun=load('00mun')

def val(c):
    x,y=c.x/1e5,c.y/1e5
    v=0.5+0.22*math.sin(x*0.9+1.3)+0.18*math.cos(y*1.1-0.4)+0.12*math.sin((x+y)*2.3)
    return v+random.uniform(-.16,.16)
def cls(v): return PAL[max(0,min(6,int(v*7)))]
def path(g,ox,oy,s,H):
    out=[]
    polys=[g] if g.geom_type=='Polygon' else list(g.geoms)
    for p in polys:
        for ring in [p.exterior]+list(p.interiors):
            pts=list(ring.coords)
            if len(pts)<4: continue
            out.append('M'+'L'.join(f'{(x-ox)*s:.1f},{H-(y-oy)*s:.1f}' for x,y in pts[:-1])+'Z')
    return ''.join(out)
def svg(items,W,H,tol,stroke,sw,pad=6,outline=None):
    u=unary_union([g for _,g in items]) if outline is None else outline
    minx,miny,maxx,maxy=u.bounds
    s=min((W-2*pad)/(maxx-minx),(H-2*pad)/(maxy-miny))
    ox=minx-(W-2*pad-(maxx-minx)*s)/2/s-pad/s; oy=miny-(H-2*pad-(maxy-miny)*s)/2/s-pad/s
    ps=[]
    for a,g in items:
        g2=g.simplify(tol,preserve_topology=True)
        if g2.is_empty: continue
        d=path(g2,ox,oy,s,H)
        if d: ps.append(f'<path d="{d}" fill="{cls(val(g.centroid))}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><g stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round">'+''.join(ps)+'</g></svg>'
random.seed(7)
open('mx-municipios-ejemplo.svg','w').write(svg(mun,700,520,4000,'#ffffff',0.25))
random.seed(11)
open('mx-entidades-ejemplo.svg','w').write(svg(ent,700,520,2500,'#ffffff',0.8))
jal=[m for m in mun if m[0].get('CVE_ENT')=='14']
random.seed(3)
open('jalisco-municipios-ejemplo.svg','w').write(svg(jal,600,620,500,'#ffffff',0.8))
# neutral (sin datos) versions
PAL[:]=['#efe8ed']*7
open('mx-entidades-vacio.svg','w').write(svg(ent,700,520,2500,'#ffffff',0.8))
