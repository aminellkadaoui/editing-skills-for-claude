# Expressions used in the «Sheikh Name» MOGRT

Main comp is called `Sheikh Name` below; replace with yours. All points are comp coordinates
(precomps are 3840×2160 and untransformed, so their coordinates = main comp coordinates).

## CONTROL (null) — effects
Sliders: `Extra Width` 0 · `Pad Right` 186 · `Pad Left` 186 · `Pad Top` 65 · `Pad Bottom` 65 · `Text Y Fix` −19
Points (expressions):

**Text TL** / **Text BR** — visual bounds of the name (through the precomp, incl. Transform-effect offset)
```js
function bb(n){var L=thisComp.layer(n);var T=L.source.layer("MAIN TEXT");var r=T.sourceRectAtTime(time,false);var o=[0,0];
 try{var f=T.effect("Transform");var p=f(2);var e=p.numKeys?p.key(p.numKeys).value:p.value;o=[e[0]-f(1)[0],e[1]-f(1)[1]];}catch(err){}
 var a=L.toComp(T.toComp([r.left+o[0],r.top+o[1]]));var b=L.toComp(T.toComp([r.left+r.width+o[0],r.top+r.height+o[1]]));
 return [Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];}
var A=bb("Name");var fy=effect("Text Y Fix")(1);
[A[0],A[1]+fy]          // Text TL
// Text BR:  [A[2],A[3]+fy]
```
With an optional second row (`Role`), union the two boxes when the row is shown:
`var B=(effect("Show Role")(1)==1 && (""+thisComp.layer("ROLE TEXT").text.sourceText).replace(/\s/g,"")!="")?bb("Role"):A;`

**Box TL** / **Box BR** — the grid (right edge fixed, Extra Width only on the left)
```js
var t=effect("Text TL")(1);[t[0]-effect("Pad Left")(1)-effect("Extra Width")(1),t[1]-effect("Pad Top")(1)]
// Box BR:
var t=effect("Text BR")(1);[t[0]+effect("Pad Right")(1),t[1]+effect("Pad Bottom")(1)]
```

## Text
Inner text layer (in the style comp) reads the one input as a plain string (keeps its own style):
```js
""+comp("Sheikh Name").layer("NAME TEXT").text.sourceText
```
Other text layers of the style comp: `thisComp.layer("MAIN TEXT").text.sourceText`.

Precomp layer `Name` — anchor on the right edge, vertical middle of the text:
```js
var L=comp("Name Text").layer("MAIN TEXT");var r=L.sourceRectAtTime(time,false);L.toComp([r.left+r.width,r.top+r.height/2]);
```
Parent `Name` to CONTROL, turn **Collapse Transformations** on (long names are not clipped by the comp edge).

Mask that was drawn for one short word, kept animated but stretched to the text (mask path):
```js
var r=thisLayer.sourceRectAtTime(time,false);
var dL=r.left-(-320), dR=(r.left+r.width)-(-5);           // -320/-5 = rect of the original word
var k1=thisProperty.points(thisProperty.key(1).time), k2=thisProperty.points(thisProperty.key(thisProperty.numKeys).time), v=thisProperty.points(time);
var p=(k1[0][0]-v[0][0])/(k1[0][0]-k2[0][0]);
var out=[];for(var i=0;i<v.length;i++){var sh=(i==1||i==2)?(dR+(dL-dR)*p):dR;out.push([v[i][0]+sh,v[i][1]]);}
createPath(out,[],[],true)
```

## Box (shape in `Box Matte`, same on `Box Light Sweep`)
Rectangle Size — grid size × the user's open/close keyframes (ratio to the fully open key):
```js
var C=comp("Sheikh Name").layer("CONTROL");var tl=C.effect("Box TL")(1),br=C.effect("Box BR")(1);
var mx=[0,0];for(var k=1;k<=thisProperty.numKeys;k++){var v=thisProperty.key(k).value;mx=[Math.max(mx[0],v[0]),Math.max(mx[1],v[1])];}
[(br[0]-tl[0])*(mx[0]?value[0]/mx[0]:1),(br[1]-tl[1])*(mx[1]?value[1]/mx[1]:1)]
```
Layer Position — centre of the grid, keeps any keyframed offset:
```js
var C=comp("Sheikh Name").layer("CONTROL");var tl=C.effect("Box TL")(1),br=C.effect("Box BR")(1);
var r=sourceRectAtTime(time,false);var rc=[r.left+r.width/2,r.top+r.height/2];
var off=(thisProperty.numKeys>0)?value-thisProperty.key(1).value:[0,0];
[(tl[0]+br[0])/2-rc[0]+anchorPoint[0]+off[0],(tl[1]+br[1])/2-rc[1]+anchorPoint[1]+off[1]]
```
Shape-layer anchor in the centre of its shape:
```js
var r=sourceRectAtTime(time,false);[r.left+r.width/2,r.top+r.height/2]
```

## Things stuck to the box corners
```js
var C=comp("Sheikh Name").layer("CONTROL");var tl=C.effect("Box TL")(1),br=C.effect("Box BR")(1);var L=tl[0],T=tl[1],R=br[0],B=br[1];
[L+5,B-20]     // big diamond / its cut (bottom-left)
[R-17,T+26]    // small diamond / its cut (top-right)
[L-607,T-504]  // inner light green (layer position; offset measured from the original look)
```
Cuts live in `Box Matte` with blending mode **Silhouette Alpha** (`BlendingMode.SILHOUETE_ALPHA` — AE's spelling), scale 126 % of the diamond for the gap.

## Light sweeps
CC Light Sweep → Center (collapsed shape layers — effect points are in comp space):
```js
toComp(anchorPoint)
```

## Glass / inner light
`Glass`: adjustment solid, Gaussian Blur 45 (Repeat Edge Pixels on), Exposure −2.36, track matte = `Box Matte` (Alpha).
Inner light: comp-size solid, Gradient Ramp radial, Screen, matte = `Box Matte`:
```js
fromComp(thisComp.layer("BOX").toComp([x,y]))   // ramp start/end, x,y from the box corners
```
