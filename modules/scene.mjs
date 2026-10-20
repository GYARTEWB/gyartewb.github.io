import {Vector} from "./math.mjs";
export {Star, Dot, Surface, Block, Scene, Camera};

var screenCoordinate = Vector.zero(2);
var O = Vector.zero(3);
var ON = 0;

class Star {
    position; brightnesss;
    constructor() {
        this.position = new Vector(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5);
        this.brightnesss = 255*(0.8661-this.position.magnitude); //255*(Math.ceil(10000*(0.5*3**0.5))/10000 - this.position.magnitude)
    }
    draw(camera) {
        ON = this.position.dot(camera.N);
        if(ON>0) {
            screenCoordinate.assign(
                camera.X.dot(this.position),
                camera.Y.dot(this.position)
            ).scale(camera.screenCoordinateScalar/ON).add(camera.middle);
            if(screenCoordinate.X>=0&&screenCoordinate.X<camera.wScalar && screenCoordinate.Y>=0&&screenCoordinate.Y<camera.hScalar) {
                let index = camera.wScalar*(screenCoordinate.Y|0)+(screenCoordinate.X|0);
                if(!isFinite(camera.depthBuffer.data[index])) {
                    index *= 4;
                    camera.imageData[index] = 255;
                    camera.imageData[index+1] = 255;
                    camera.imageData[index+2] = 255;
                    camera.imageData[index+3] = this.brightnesss;
                }
            }
        }
    }
}

class Dot {
    position; r;g;b;
    constructor(position=Vector.zero(3),r,g,b) {
        this.position = position;
        this.r = r;
        this.g = g;
        this.b = b;
    }
    draw(camera) {
        ON = O.assignVector(this.position).subtract(camera.position).dot(camera.N);
        if(ON>0) {
            screenCoordinate.assign(
                camera.X.dot(O),
                camera.Y.dot(O)
            ).scale(camera.screenCoordinateScalar/ON).add(camera.middle);
            if(screenCoordinate.X>=0&&screenCoordinate.X<camera.wScalar && screenCoordinate.Y>=0&&screenCoordinate.Y<camera.hScalar) {
                let index = camera.wScalar*(screenCoordinate.Y|0)+(screenCoordinate.X|0);
                let distance = O.selfDot;
                if(distance<camera.depthBuffer.data[index]) {
                    camera.depthBuffer.data[index] = distance;
                    index *= 4;
                    camera.imageData[index] = this.r;
                    camera.imageData[index+1] = this.g;
                    camera.imageData[index+2] = this.b;
                    camera.imageData[index+3] = 255*(camera.light/Math.sqrt(distance));
                }
            }
        }
    }
}

let bigvector2D = new Vector(2E4,2E4);

let walk = Vector.zero(2), step = Vector.zero(2);
function DDA(start,direction,steps,func=(walk)=>null) {
    walk.assignVector(start);
    step.assignVector(direction);
    let itterations = 0;
    if(Math.abs(direction.Y)>Math.abs(direction.X)) {
        step.assign(direction.X/direction.Y,1).scale(Math.sign(direction.Y));
        itterations = steps.Y;
    } else {
        step.assign(1,direction.Y/direction.X).scale(Math.sign(direction.X));
        itterations = steps.X;
    }
    for(let i = 0; i < itterations; i++) {
        func(walk.calc.floor());
        walk.add(step);
    }
}

class line2D {
    start;end;
    constructor(start=Vector.zero(2),direction=Vector.zero(2)) {
        this.start=start;
        this.direction=direction;
    }
}

let SO = [Vector.zero(3),Vector.zero(3),Vector.zero(3),Vector.zero(3)], //återanvänd vektorer!!!!
    SON = new Float64Array(4), //skitbra variabel namn! väldigt läsbart! kommer definitivt veta vad detta är om några veckor!
    SL = [new line2D,new line2D,new line2D,new line2D], //ska fan inte skapa nya line2D varje gång en yta ritas, man ska återanvända!
    SD = Vector.zero(2), //återanvänd!!!!!!
    L = Vector.zero(3),
    SV = Vector.zero(3),
    K = Vector.zero(3),
    index = 0,
    rgb = new Uint8ClampedArray(3);

class Surface {
    position; size; X; N; Y; corners; texture;
    constructor(position=Vector.zero(3),size=new Vector(1,1),X=new Vector(1,0,0),Y=new Vector(0,0,1),N=new Vector(0,1,0),texture=(x=0,y=0,rgb=[0,0,0])=>coolTexture(x,y,rgb)) {
        this.position = position;
        this.size = size;
        this.X = X;
        this.N = N;
        this.Y = Y;
        this.update();
        this.texture = texture;
    }
    update() { //för att beräkna var hörnen hamnar om värden ändras (kan avända en setter istället? dåligt att manuellt behöva updatera? få se längre fram hur skit koden blir)
        this.corners = [
            this.position.clone,
            this.position.clone.add(this.X.calc.scale(this.size.X)),
            this.position.clone.add(this.X.calc.scale(this.size.X)).add(this.Y.calc.scale(this.size.Y)),
            this.position.clone.add(this.Y.calc.scale(this.size.Y))
        ]
    }
    draw(camera) {
        SO[0].assignVector(this.corners[0]).subtract(camera.position);
        SON[0]=camera.N.dot(SO[0])
        SO[1].assignVector(this.corners[1]).subtract(camera.position);
        SON[1]=camera.N.dot(SO[1]);
        SO[2].assignVector(this.corners[2]).subtract(camera.position);
        SON[2]=camera.N.dot(SO[2]);
        SO[3].assignVector(this.corners[3]).subtract(camera.position);
        SON[3]=camera.N.dot(SO[3]);
        let lines = [];
        for(let i = 0, n = 1, start,end,dot; i < 4; i++, n = (i+1)%4) {
            if(SON[i]>0) { //om i är framför skärmen
                start = SO[i];
                end = SO[n];
                dot = SON[i];
            } else if(SON[n]>0) { //annars om n är framför skärmen
                start = SO[n];
                end = SO[i];
                dot = SON[n];
            } else continue //varken n eller i framför skärmen, ingen linje kan visas mellan de 2 punkterna på skärmen då
            SD.assign(
                start.dot(camera.X),
                start.dot(camera.Y)
            );
            L.assignVector(end).subtract(start);
            SL[i].start.assignVector(SD).scale(camera.screenCoordinateScalar/dot).add(camera.middle);
            SL[i].direction.assign(
                L.dot(camera.X),
                L.dot(camera.Y)
            ).scale(dot).subtract(SD.scale(L.dot(camera.N)));
            lines.push(SL[i]);
        }

        let minX = 0,
            maxX = 0,
            rangeX = [],
            distance = 0;
        L.assignVector(camera.position).subtract(this.position);
        for(let y = 0, ys = camera.yStart; y < camera.hScalar; y++, ys += camera.sUnit) {
            rangeX = [0,...lines.map(v=>
                v.start.X+v.direction.X*(y-v.start.Y)/v.direction.Y
            ),camera.wScalar].filter(v=>{
                v = (v-camera.middle.X)*camera.sUnit;
                SV.assignVector(camera.X).scale(v).add(camera.sN).add(camera.Y.calc.scale(ys));
                K.assignVector(this.N).scale(1/SV.dot(this.N));
                SD.assign(
                    L.dot(this.X.calc.subtract(K.calc.scale(SV.dot(this.X)))),
                    L.dot(this.Y.calc.subtract(K.scale(SV.dot(this.Y))))
                );
                return SD.X>=-0.0000000001&&SD.X<=this.size.X+0.0000000001 //floating point error skit
                    && SD.Y>=-0.0000000001&&SD.Y<=this.size.Y+0.0000000001
                    && K.assignVector(this.X).scale(SD.X).add(this.Y.calc.scale(SD.Y)).add(SO[0]).dot(camera.N) > 0; //punkten ska vara framför skärmen
            });
            if(rangeX.length) {
                minX = Math.min(...rangeX);
                if(minX<0) minX = 0;
                maxX = Math.max(...rangeX);
                if(maxX>camera.wScalar) maxX = camera.wScalar;
                for(let x = minX|0, xs = (x-camera.middle.X)*camera.sUnit; x < maxX; x++, xs += camera.sUnit) {
                    SV.assignVector(camera.X).scale(xs).add(camera.sN).add(camera.Y.calc.scale(ys));
                    K.assignVector(this.N).scale(1/SV.dot(this.N));
                    SD.assign(
                        L.dot(this.X.calc.subtract(K.calc.scale(SV.dot(this.X)))),
                        L.dot(this.Y.calc.subtract(K.scale(SV.dot(this.Y))))
                    );
                    distance = K.assignVector(this.X).scale(SD.X).add(this.Y.calc.scale(SD.Y)).add(SO[0]).selfDot;
                    index = y*camera.wScalar+x;
                    if(distance<camera.depthBuffer.data[index]) {
                        camera.depthBuffer.data[index] = distance;
                        index *= 4;
                        this.texture(SD.X,SD.Y,rgb)
                        camera.imageData[index] = rgb[0];
                        camera.imageData[index+1] = rgb[1];
                        camera.imageData[index+2] = rgb[2];
                        camera.imageData[index+3] = Math.floor(255*camera.light/Math.sqrt(distance));
                    }
                }
            }
        }

        /*for(let i = 0; i < lines.length; i++) {
            DDA(lines[i].start,lines[i].direction,bigvector2D,(walk)=>{
                if(walk.X>=0&&walk.X<camera.wScalar && walk.Y>=0&&walk.Y<camera.hScalar) {
                    index = 4*(walk.Y*camera.wScalar+walk.X);
                    camera.imageData[index] = 0;
                    camera.imageData[index+1] = 0;
                    camera.imageData[index+2] = 255;
                    camera.imageData[index+3] = 255;
                }
            });
            DDA(lines[i].start,lines[i].direction.calc.scale(-1),bigvector2D,(walk)=>{
                if(walk.X>=0&&walk.X<camera.wScalar && walk.Y>=0&&walk.Y<camera.hScalar) {
                    index = 4*(walk.Y*camera.wScalar+walk.X);
                    camera.imageData[index] = 255;
                    camera.imageData[index+1] = 0;
                    camera.imageData[index+2] = 0;
                    camera.imageData[index+3] = 255;
                }
            });
        }*/
    }
}

var time = 0;

function posMod(x,y) {
    return (x % y + y) % y
}

function coolTexture(x,y,rgb) {
    if(posMod(x+time*0.01+0.01*Math.sin(10*y+time),0.1)<0.01||posMod(y+time*0.01+0.01*Math.cos(10*x+time),0.1)<0.01) {
        rgb[0] = 255;
        rgb[1] = 0;
        rgb[2] = 0;
    } else {
        rgb[0] = 255;
        rgb[1] = 255;
        rgb[2] = 255;
    }
}

class Block {
    position; size; rotation; surfaces; #halfSize;
    constructor(position=Vector.zero(3),size=new Vector(2,4,1),rotation=Vector.zero(3)) {
        this.position = position;
        this.size = size;
        this.rotation = rotation;
        this.surfaces=[ //bra att OOP abstraktar bort dessa detaljer, OOP abstraktar bort detaljer även här!
            new Surface(new Vector(-0.5*this.size.X,-0.5*this.size.Y,0.5*this.size.Z).add(this.position),new Vector(this.size.X,this.size.Y),new Vector(1,0,0),new Vector(0,1,0),new Vector(0,0,1),coolTexture), //0 0 1
            new Surface(new Vector(-0.5*this.size.X,-0.5*this.size.Y,-0.5*this.size.Z).add(this.position),new Vector(this.size.X,this.size.Y),new Vector(1,0,0),new Vector(0,1,0),new Vector(0,0,-1),coolTexture), //0 0 -1
            new Surface(new Vector(-0.5*this.size.X,0.5*this.size.Y,-0.5*this.size.Z).add(this.position),new Vector(this.size.X,this.size.Z),new Vector(1,0,0),new Vector(0,0,1),new Vector(0,1,0),coolTexture), //0 1 0
            new Surface(new Vector(-0.5*this.size.X,-0.5*this.size.Y,-0.5*this.size.Z).add(this.position),new Vector(this.size.X,this.size.Z),new Vector(1,0,0),new Vector(0,0,1),new Vector(0,-1,0),coolTexture), //0 -1 0
            new Surface(new Vector(0.5*this.size.X,-0.5*this.size.Y,-0.5*this.size.Z).add(this.position),new Vector(this.size.Y,this.size.Z),new Vector(0,1,0),new Vector(0,0,1),new Vector(1,0,0),coolTexture), //1 0 0
            new Surface(new Vector(-0.5*this.size.X,-0.5*this.size.Y,-0.5*this.size.Z).add(this.position),new Vector(this.size.Y,this.size.Z),new Vector(0,1,0),new Vector(0,0,1),new Vector(-1,0,0),coolTexture)  //-1 0 0
        ];
    }
    draw(camera) {
        for(let i = 0; i < this.surfaces.length; this.surfaces[i++].draw(camera));
    }
}

class Scene {
    elements;
    constructor() {
        this.elements = new Set();
    }
}

class depthBuffer {
    width;height;data;
    constructor(width,height) {
        this.width = width;
        this.height = height;
        this.data = new Float32Array(width*height).fill(Infinity);
    }
    reset() {
        this.data.fill(Infinity);
    }
}

class Camera {
    maxYrotation=Math.PI*0.5;
    imageData; depthBuffer; middle; hScalar; wScalar; scene; position; rotation; screenCoordinateScalar; scalarRecip; screenDistance; X; N; Y; sN; light; yStart; sUnit;
    constructor(scene=new Scene(),screenDistance=1,light=100,position=Vector.zero(3),rotation=Vector.zero(2)) {
        this.middle = Vector.zero(2);
        this.scene = scene;
        this.position = position;
        this.rotation = rotation;
        this.screenDistance = screenDistance;
        this.X = Vector.zero(3);
        this.N = Vector.zero(3);
        this.Y = Vector.zero(3);
        this.sN = Vector.zero(3);
        this.light = light;
        this.depthBuffer = new depthBuffer(0,0);
        this.update();
    }
    update() {
        this.rotation.X %= Math.PI*2;
        if(this.rotation.Y>this.maxYrotation)
            this.rotation.Y=this.maxYrotation;
        else if(this.rotation.Y<-this.maxYrotation)
            this.rotation.Y=-this.maxYrotation;
        let cz = Math.cos(this.rotation.X), sz = Math.sin(this.rotation.X), cx = Math.cos(this.rotation.Y), sx = Math.sin(this.rotation.Y);
        this.X.assign(cz,-sz,0);
        this.N.assign(cx*sz,cx*cz,sx);
        this.Y.assign(sx*sz,sx*cz,-cx);
        this.sN.assignVector(this.N).scale(this.screenDistance);
    }
    shoot(imageData=new ImageData(0,0)) {
        time = performance.now()*0.01;
        if(imageData.width!=this.depthBuffer.width||imageData.height!=this.depthBuffer.height)
            this.depthBuffer = new depthBuffer(imageData.width,imageData.height);
        this.middle.assign(imageData.width>>1,imageData.height>>1);
        this.hScalar = imageData.height;
        this.wScalar = imageData.width;
        this.sUnit = 1/this.hScalar;
        this.yStart = -this.middle.Y*this.sUnit;
        this.screenCoordinateScalar = this.hScalar*this.screenDistance;
        this.scalarRecip = 1/this.hScalar;
        this.imageData = imageData.data;
        this.scene.elements.forEach(element=>element.draw(this));
        this.depthBuffer.reset();
    }
}