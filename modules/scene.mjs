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

class Surface {
    static #O = [Vector.zero(3),Vector.zero(3),Vector.zero(3),Vector.zero(3)]; //vackert
    static #L = [Vector.zero(3),Vector.zero(3),Vector.zero(3),Vector.zero(3)];
    static #S = [Vector.zero(2),Vector.zero(2),Vector.zero(2),Vector.zero(2)];
    static #R = [Vector.zero(2),Vector.zero(2),Vector.zero(2),Vector.zero(2)];
    static #maxRects = [Vector.zero(2),Vector.zero(2),Vector.zero(2),Vector.zero(2)];
    static #D = Vector.zero(2);
    static #ON = new Float64Array(4); //slipper .fill(0), siffor är ju 64 bitars ändån
    position; size; X; N; Y; texture;
    constructor(position=Vector.zero(3),size=new Vector(1,1),X=new Vector(1,0,0),Y=new Vector(0,0,1),N=new Vector(0,1,0),texture=(x=0,y=0,rgb=[0,0,0])=>rgb.fill(255)) {
        this.position = position;
        this.size = size;
        this.X = X;
        this.N = N;
        this.Y = Y;
        this.texture = texture;
    }
    draw(camera) { //tänk hur ännu mera skit detta skulle se ut utan vector klassen
        Surface.#O[0].assignVector(this.position).subtract(camera.position); //P, P+X, P+X+Y, P+Y, manuell beskrivning av en rektangel i 3D relativt till kameran
        Surface.#L[0].assignVector(this.X).scale(this.size.X);
        Surface.#O[1].assignVector(Surface.#L[0]).add(this.position).subtract(camera.position);
        Surface.#L[1].assignVector(this.Y).scale(this.size.Y);
        Surface.#O[2].assignVector(Surface.#O[1]).add(Surface.#L[1]);
        Surface.#L[2].assignVector(this.X).scale(-this.size.X);
        Surface.#O[3].assignVector(Surface.#L[1]).add(this.position).subtract(camera.position);
        Surface.#L[3].assignVector(this.Y).scale(-this.size.Y);
        for(let i = 0; i < 4; i++) {
            Surface.#ON[i] = camera.N.dot(Surface.#O[i]);
            Surface.#S[i].assignVector(Surface.#D.assign(
                camera.X.dot(Surface.#O[i]),
                camera.Y.dot(Surface.#O[i])
            )).scale(camera.screenCoordinateScalar/Surface.#ON[i]).add(camera.middle);
            Surface.#R[i].assign(
                camera.X.dot(Surface.#L[i]),
                camera.Y.dot(Surface.#L[i])
            ).scale(Surface.#ON[i]).subtract(
                Surface.#D.scale(camera.N.dot(Surface.#L[i])) //gör inget om D ändras nu, så calc är onödigt
            );
        }
        if(Surface.#ON.every(v=>v<=0)) return;
        for(let i = 0, n = 1; i < 4; i++, n = (i+1)%4)
            Surface.#maxRects[i].assign( //OK, en vector med arrays som element, väldigt logiskt
                Surface.#S[i].X<Surface.#S[n].X?[Surface.#S[i].X,Surface.#S[n].X]:[Surface.#S[n].X,Surface.#S[i].X],
                Surface.#S[i].Y<Surface.#S[n].Y?[Surface.#S[i].Y,Surface.#S[n].Y]:[Surface.#S[n].Y,Surface.#S[i].Y]
            );
        let enumY = Surface.#S.map(v=>v.Y) //letletletlet
        let minY = Math.min(...enumY);
        if(minY<0) 
            minY = 0;
        let maxY = Math.max(...enumY);
        if(maxY>=camera.hScalar) 
            maxY = camera.hScalar;
        let minX = 0;
        let maxX = 0;
        let enumX = Array(4);
        let index = 0;
        let indexY = 0;
        for(let y = minY; y < maxY; y++) {
            enumX = [
                Surface.#S[0].X+Surface.#R[0].X*(y-Surface.#S[0].Y)/Surface.#R[0].Y, //detta är så skit, fy fan, jag måste snygga till denna kod någon gång
                Surface.#S[1].X+Surface.#R[1].X*(y-Surface.#S[1].Y)/Surface.#R[1].Y,
                Surface.#S[2].X+Surface.#R[2].X*(y-Surface.#S[2].Y)/Surface.#R[2].Y,
                Surface.#S[3].X+Surface.#R[3].X*(y-Surface.#S[3].Y)/Surface.#R[3].Y
            ].filter((v,i)=> //filtrera skiten
                v>=Surface.#maxRects[i].X[0]&&v<=Surface.#maxRects[i].X[1] && //kanske någon floating point skit kan ske här? titta här om skit sker
                y>=Surface.#maxRects[i].Y[0]&&y<=Surface.#maxRects[i].Y[1]
            );
            minX = Math.min(...enumX);
            if(minX<0)
                minX = 0;
            maxX = Math.max(...enumX);
            if(maxX>camera.wScalar)
                maxX = camera.wScalar;
            indexY = 4*camera.wScalar*(y|0);
            for(let x = minX; x < maxX; x++) {
                index = 4*(x|0)+indexY;
                camera.imageData.fill(255,index,index+4);
            }
        }
        for(let i = 0; i < 4; i++) {
            DDA(Surface.#S[i],Surface.#R[i],Surface.#R[i].calc.scale(10000/Surface.#R[i].magnitude).abs(),(walk)=>{if(walk.X>=0&&walk.X<camera.wScalar && walk.Y>=0&&walk.Y<camera.hScalar)
                index = (camera.wScalar*walk.Y+walk.X)*4;
                camera.imageData[index]=0;
                camera.imageData[index+1]=0;
                camera.imageData[index+2]=255;
                camera.imageData[index+3]=255;
            });
        }
    }
}

class Block {
    position; size; rotation; surfaces;
    constructor(position=Vector.zero(3),size=new Vector(2,4,1),rotation=Vector.zero(3)) {
        this.position = position;
        this.size = size;
        this.rotation = rotation;
        this.surfaces=[
            new Surface(), //0 0 1
            new Surface(), //0 0 -1
            new Surface(), //0 1 0
            new Surface(), //0 -1 0
            new Surface(), //1 0 0
            new Surface()  //-1 0 0
        ];
        this.update();
    }
    draw(camera) {
        for(let i = 0; i < this.surfaces.length; this.surfaces[i].draw(camera));
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
    imageData; depthBuffer; middle; hScalar; wScalar; scene; position; rotation; screenCoordinateScalar; screenDistance; X; N; Y; light;
    constructor(scene=new Scene(),screenDistance=1,light=100,position=Vector.zero(3),rotation=Vector.zero(2)) {
        this.middle = Vector.zero(2);
        this.scene = scene;
        this.position = position;
        this.rotation = rotation;
        this.screenDistance = screenDistance;
        this.X = Vector.zero(3);
        this.N = Vector.zero(3);
        this.Y = Vector.zero(3);
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
    }
    shoot(imageData=new ImageData(0,0)) {
        if(imageData.width!=this.depthBuffer.width||imageData.height!=this.depthBuffer.height)
            this.depthBuffer = new depthBuffer(imageData.width,imageData.height);
        this.middle.assign(imageData.width>>1,imageData.height>>1);
        this.hScalar = imageData.height;
        this.wScalar = imageData.width;
        this.screenCoordinateScalar = this.hScalar*this.screenDistance;
        this.imageData = imageData.data;
        this.scene.elements.forEach(element=>element.draw(this));
        this.depthBuffer.reset();
    }
}