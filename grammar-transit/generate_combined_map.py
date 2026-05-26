"""Generate the combined Grammar Transit Map — single Excalidraw file.

Topology
--------
  N  line  — horizontal backbone at y=500
  V  line  — vertical S7→S4, then 45° diagonal S4→S2→S1→S5
  T  line  — horizontal to S2, shared 45° diagonal S2→S1, horizontal to S6
  M  line  — straight shallow diagonal S8L→S9→S5→S8R (slope 0.6)
  D  spur  — vertical UP   from S3 (determiners)
  P  spur  — vertical DOWN from S6 (prepositions)

V and T share the S2→S1 diagonal, drawn as parallel colour stripes.
Each word-level station is a small hollow dot + a coded reference label
(e.g. N4, V7, M12) alternating above/below the line tube-map style.
Named interchange hubs (S1–S9) carry full station name labels.
"""

from __future__ import annotations
import json, random
from pathlib import Path

VAULT  = Path.home() / "Documents" / "Obsidian Vault"
OUTPUT = VAULT / "Excalidraw" / "Grammar Transit Map — Combined.excalidraw"
BG     = "#f5f0e8"
FONT   = 2   # Helvetica

LC = {
    "N": "#1971c2",
    "V": "#c92a2a",
    "M": "#e67700",
    "T": "#2b8a3e",
    "D": "#6741d9",
    "P": "#a61e4d",
}

def _n(): return random.randint(1, 2**31-1)
def _i(): return f"{random.randint(0, 16**8):08x}"


# ── Primitives ────────────────────────────────────────────────────────────────

def seg(x1,y1,x2,y2,color,w=5):
    dx,dy=x2-x1,y2-y1
    return {"type":"line","version":1,"versionNonce":_n(),"isDeleted":False,"id":_i(),
            "fillStyle":"solid","strokeWidth":w,"strokeStyle":"solid",
            "roughness":0,"opacity":100,"angle":0,
            "x":float(x1),"y":float(y1),"strokeColor":color,
            "backgroundColor":"transparent",
            "width":max(abs(dx),1.),"height":max(abs(dy),1.),
            "seed":_n(),"groupIds":[],"frameId":None,"roundness":None,
            "boundElements":None,"updated":1,"link":None,"locked":False,
            "startBinding":None,"endBinding":None,"lastCommittedPoint":None,
            "startArrowhead":None,"endArrowhead":None,
            "points":[[0.,0.],[float(dx),float(dy)]]}


def circ(cx,cy,r,stroke,fill=BG,sw=2):
    return {"type":"ellipse","version":1,"versionNonce":_n(),"isDeleted":False,"id":_i(),
            "fillStyle":"solid","strokeWidth":sw,"strokeStyle":"solid",
            "roughness":0,"opacity":100,"angle":0,
            "x":float(cx-r),"y":float(cy-r),"strokeColor":stroke,"backgroundColor":fill,
            "width":float(r*2),"height":float(r*2),
            "seed":_n(),"groupIds":[],"frameId":None,"roundness":None,
            "boundElements":None,"updated":1,"link":None,"locked":False}


def txt(cx,y,s,size=13,color="#1e1e1e",w=None):
    width = w or max(len(s)*size*0.58, 60.)
    h = float(size*1.6)
    return {"type":"text","version":1,"versionNonce":_n(),"isDeleted":False,"id":_i(),
            "fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid",
            "roughness":0,"opacity":100,"angle":0,
            "x":float(cx-width/2),"y":float(y),
            "strokeColor":color,"backgroundColor":"transparent",
            "width":width,"height":h,
            "seed":_n(),"groupIds":[],"frameId":None,"roundness":None,
            "boundElements":None,"updated":1,"link":None,"locked":False,
            "fontSize":size,"fontFamily":FONT,"text":s,
            "textAlign":"center","verticalAlign":"middle",
            "containerId":None,"originalText":s,"lineHeight":1.25}


# ── Composite helpers ─────────────────────────────────────────────────────────

def tcap(x,y,dx,dy,color,half=13):
    """Terminus cap perpendicular to direction (dx,dy) at point (x,y)."""
    mag=(dx*dx+dy*dy)**0.5 or 1
    px,py=-dy/mag,dx/mag
    return seg(x+px*half,y+py*half,x-px*half,y-py*half,color,w=5)


def labeled_dots(x1,y1,x2,y2,n,color,prefix,start=1,
                 r=5,ox=0,oy=0,perp_dist=15,force_side=None):
    """
    n evenly-spaced station dots with coded reference labels.
    Labels alternate sides of the line (perpendicular direction).
    force_side: +1 or -1 to lock all labels to one side (for shared segments).
    """
    out=[]
    dx,dy=x2-x1,y2-y1
    mag=(dx*dx+dy*dy)**0.5 or 1
    px,py=-dy/mag,dx/mag   # CCW perpendicular unit vector

    for i in range(1,n+1):
        t=i/(n+1)
        cx=x1+t*(x2-x1)+ox
        cy=y1+t*(y2-y1)+oy
        out.append(circ(cx,cy,r,color,BG,2))

        side = force_side if force_side else (1 if i%2==1 else -1)
        lx = cx + px*perp_dist*side
        ly = cy + py*perp_dist*side
        label = f"{prefix}{start+i-1}"
        out.append(txt(lx, ly-7, label, 9, color, w=30))

    return out


def hub(els,x,y,color,sid,name,lines,above=False):
    R=20
    els.append(circ(x,y,R,"#333333",BG,sw=3))
    els.append(circ(x,y,9,color,color,sw=0))
    if above:
        els.append(txt(x,y-R-22,sid,  10,"#aaaaaa",w=70))
        els.append(txt(x,y-R-6, name, 13,color,    w=230))
        els.append(txt(x,y+R+7, lines,10,"#999999", w=170))
    else:
        els.append(txt(x,y-R-13,sid,  10,"#aaaaaa",w=70))
        els.append(txt(x,y+R+6, name, 13,color,    w=230))
        els.append(txt(x,y+R+22,lines,10,"#999999", w=170))


# ── Build ─────────────────────────────────────────────────────────────────────

def build():
    els=[]

    S3  = (200,  500)
    S9  = (520,  500)
    S4  = (840,  500)
    S7  = (840,  175)
    S2  = (1000, 660)
    S1  = (1160, 820)
    S5  = (1320, 980)
    S6  = (1480, 820)
    S8L = (100,  248)
    S8R = (1640, 1172)

    G=22

    mdx,mdy=S8R[0]-S8L[0],S8R[1]-S8L[1]
    mm=(mdx*mdx+mdy*mdy)**0.5
    mu,mv=mdx/mm,mdy/mm
    mg_x,mg_y=G*mu,G*mv

    # ── Title ─────────────────────────────────────────────────────────────────
    els.append(txt(870,42, "GRAMMAR  TRANSIT  MAP",              28,"#222222",w=660))
    els.append(txt(870,78, "English Grammar as a Transit Network",14,"#aaaaaa",w=540))

    # ── N LINE ────────────────────────────────────────────────────────────────
    c=LC["N"]
    els.append(seg(70,500,S3[0]-G,500,c))
    els.append(seg(S3[0]+G,500,S9[0]-G,500,c))
    els.append(seg(S9[0]+G,500,S4[0]-G,500,c))
    els.append(seg(S4[0]+G,500,1010,500,c))
    els.append(tcap(70,500,1,0,c))
    els.append(tcap(1010,500,-1,0,c))
    # N1–N3  left segment
    els+=labeled_dots(70,500,S3[0]-G,500,          3,c,"N",start=1)
    # N4–N8  S3 → S9
    els+=labeled_dots(S3[0]+G,500,S9[0]-G,500,     5,c,"N",start=4)
    # N9–N13 S9 → S4
    els+=labeled_dots(S9[0]+G,500,S4[0]-G,500,     5,c,"N",start=9)
    # N14–N16 right tail
    els+=labeled_dots(S4[0]+G,500,990,500,          3,c,"N",start=14)

    # ── V LINE ────────────────────────────────────────────────────────────────
    c=LC["V"]
    els.append(seg(S7[0],S7[1]+G,S4[0],S4[1]-G,c))
    els.append(tcap(S7[0],S7[1],0,1,c))
    els.append(seg(S4[0]+G,S4[1]+G,S2[0]-G,S2[1]-G,c))
    els.append(seg(S2[0]+G-3,S2[1]+G-3,S1[0]-G-3,S1[1]-G-3,c))
    els.append(seg(S1[0]+G,S1[1]+G,S5[0]-G,S5[1]-G,c))
    # V1–V4  vertical S7→S4
    els+=labeled_dots(S7[0],S7[1]+G,S4[0],S4[1]-G,    4,c,"V",start=1)
    # V5–V7  diagonal S4→S2
    els+=labeled_dots(S4[0]+G,S4[1]+G,S2[0]-G,S2[1]-G,3,c,"V",start=5)
    # V8–V10 shared diagonal S2→S1 (V strand, force upper-left side)
    els+=labeled_dots(S2[0]+G,S2[1]+G,S1[0]-G,S1[1]-G,3,c,"V",start=8,
                      ox=-3,oy=-3,force_side=+1)
    # V11–V13 diagonal S1→S5
    els+=labeled_dots(S1[0]+G,S1[1]+G,S5[0]-G,S5[1]-G,3,c,"V",start=11)

    # ── T LINE ────────────────────────────────────────────────────────────────
    c=LC["T"]
    els.append(seg(70,660,S2[0]-G,660,c))
    els.append(tcap(70,660,1,0,c))
    els.append(seg(S2[0]+G+3,S2[1]+G+3,S1[0]-G+3,S1[1]-G+3,c))
    els.append(seg(S1[0]+G,S1[1],S6[0]-G,S6[1],c))
    els.append(seg(S6[0]+G,S6[1],1600,S6[1],c))
    els.append(tcap(1600,S6[1],-1,0,c))
    # T1–T8  left → S2
    els+=labeled_dots(70,660,S2[0]-G,660,               8,c,"T",start=1)
    # T9–T11 shared diagonal S2→S1 (T strand, force lower-right side)
    els+=labeled_dots(S2[0]+G,S2[1]+G,S1[0]-G,S1[1]-G,  3,c,"T",start=9,
                      ox=+3,oy=+3,force_side=-1)
    # T12–T18 S1 → S6
    els+=labeled_dots(S1[0]+G,S1[1],S6[0]-G,S6[1],      7,c,"T",start=12)

    # ── M LINE ────────────────────────────────────────────────────────────────
    c=LC["M"]
    els.append(seg(S8L[0],S8L[1],S9[0]-mg_x,S9[1]-mg_y,c))
    els.append(seg(S9[0]+mg_x,S9[1]+mg_y,S5[0]-mg_x,S5[1]-mg_y,c))
    els.append(seg(S5[0]+mg_x,S5[1]+mg_y,S8R[0],S8R[1],c))
    els.append(tcap(S8L[0],S8L[1], mu, mv,c))
    els.append(tcap(S8R[0],S8R[1],-mu,-mv,c))
    # M1–M4  S8L → S9
    els+=labeled_dots(S8L[0],S8L[1],S9[0]-mg_x,S9[1]-mg_y,    4,c,"M",start=1)
    # M5–M13 S9 → S5
    els+=labeled_dots(S9[0]+mg_x,S9[1]+mg_y,S5[0]-mg_x,S5[1]-mg_y,9,c,"M",start=5)
    # M14–M17 S5 → S8R
    els+=labeled_dots(S5[0]+mg_x,S5[1]+mg_y,S8R[0],S8R[1],    4,c,"M",start=14)

    # ── D SPUR ────────────────────────────────────────────────────────────────
    c=LC["D"]
    els.append(seg(S3[0],S3[1]-G,S3[0],295,c))
    els.append(tcap(S3[0],295,0,-1,c))
    # D1–D10 bottom→top (D1 nearest S3)
    els+=labeled_dots(S3[0],S3[1]-G,S3[0],315,10,c,"D",start=1)

    # ── P SPUR ────────────────────────────────────────────────────────────────
    c=LC["P"]
    els.append(seg(S6[0],S6[1]+G,S6[0],1045,c))
    els.append(tcap(S6[0],1045,0,1,c))
    # P1–P12 top→bottom (P1 nearest S6)
    els+=labeled_dots(S6[0],S6[1]+G,S6[0],1025,12,c,"P",start=1)

    # ── INTERCHANGE HUBS ──────────────────────────────────────────────────────
    hub(els,*S3, LC["N"],"S3", "The Gateway",        "N · D",  above=False)
    hub(els,*S9, LC["M"],"S9", "Colour Station",     "N · M",  above=False)
    hub(els,*S4, LC["V"],"S4", "Foundation",         "N · V",  above=False)
    hub(els,*S7, LC["V"],"S7", "The Fork",           "V",      above=False)
    hub(els,*S2, LC["V"],"S2", "Authority Junction", "V · T",  above=True)
    hub(els,*S1, LC["V"],"S1", "Engine Room",        "V · T",  above=True)
    hub(els,*S5, LC["V"],"S5", "Detail Engine",      "V · M",  above=True)
    hub(els,*S6, LC["T"],"S6", "The Clock",          "T · P",  above=True)
    hub(els,*S8L,LC["M"],"S8L","The Scale",          "M",      above=False)
    hub(els,*S8R,LC["M"],"S8R","The Peak",           "M",      above=True)

    # ── LINE IDENTITY LABELS ──────────────────────────────────────────────────
    els.append(txt(120, 546,"N  NOUN",        12,LC["N"],w=130))
    els.append(txt(782, 148,"V  VERB",        12,LC["V"],w=120))
    els.append(txt(260, 352,"M  MODIFIER",    12,LC["M"],w=148))
    els.append(txt(120, 706,"T  TIME",        12,LC["T"],w=120))
    els.append(txt(132, 456,"D  DETERMINER",  12,LC["D"],w=150))
    els.append(txt(1548,936,"P  PREPOSITION", 12,LC["P"],w=162))

    # ── Write ─────────────────────────────────────────────────────────────────
    data={"type":"excalidraw","version":2,"source":"https://excalidraw.com",
          "elements":els,
          "appState":{"gridSize":None,"viewBackgroundColor":BG},"files":{}}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding="utf-8")
    print(f"Written : {OUTPUT.name}")
    print(f"Elements: {len(els)}")

build()
