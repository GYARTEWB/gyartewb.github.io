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


let bigVector = new Vector(20000,20000);

class line2D {
    start;end;
    constructor(start=Vector.zero(2),direction=Vector.zero(2)) {
        this.start=start;
        this.direction=direction;
    }
}

let SO = [Vector.zero(3),Vector.zero(3),Vector.zero(3),Vector.zero(3)];

let SL = [new line2D,new line2D,new line2D,new line2D];

let SON = new Float64Array(4); //skitbra variabel namn!

class Surface {
    position; size; X; N; Y; corners; texture;
    constructor(position=Vector.zero(3),size=new Vector(1,1),X=new Vector(1,0,0),Y=new Vector(0,0,1),N=new Vector(0,1,0),texture=(x=0,y=0,rgb=[0,0,0])=>rgb.fill(255)) {
        this.position = position;
        this.size = size;
        this.X = X;
        this.N = N;
        this.Y = Y;
        this.corners = [
            this.position.clone,
            this.position.clone.add(this.X.calc.scale(this.size.X)),
            this.position.clone.add(this.X.calc.scale(this.size.X)).add(this.Y.calc.scale(this.size.Y)),
            this.position.clone.add(this.Y.calc.scale(this.size.Y))
        ]
        this.texture = texture;
    }
    draw(camera) {
        SO[0].assignVector(this.corners[0]).subtract(camera.position);
        SO[1].assignVector(this.corners[1]).subtract(camera.position);
        SO[2].assignVector(this.corners[2]).subtract(camera.position);
        SO[3].assignVector(this.corners[3]).subtract(camera.position);
        SON[0] = camera.N.dot(SO[0]);
        SON[1] = camera.N.dot(SO[1]);
        for(let i = 0, n = 1; i < 4; i++, n = (i+1)%4) {

        }
    }
}

class Block {
    position; size; rotation; surfaces;
    constructor(position=Vector.zero(3),size=new Vector(2,4,1),rotation=Vector.zero(3)) {
        this.position = position;
        this.size = size;
        this.rotation = rotation;
        this.surfaces=[ //bra att OOP abstraktar bort dessa detaljer, OOP abstraktar bort detaljer även här!
            new Surface(new Vector(-0.5,-0.5,0.5).scale(this.size.Z).add(this.position),new Vector(this.size.X,this.size.Y),new Vector(1,0,0),new Vector(0,1,0),new Vector(0,0,1)), //0 0 1
            new Surface(new Vector(-0.5,-0.5,-0.5).scale(this.size.Z).add(this.position),new Vector(this.size.X,this.size.Y),new Vector(1,0,0),new Vector(0,1,0),new Vector(0,0,-1)), //0 0 -1
            new Surface(new Vector(-0.5,0.5,-0.5).scale(this.size.Y).add(this.position),new Vector(this.size.X,this.size.Z),new Vector(1,0,0),new Vector(0,0,1),new Vector(0,1,0)), //0 1 0
            new Surface(new Vector(-0.5,-0.5,-0.5).scale(this.size.Y).add(this.position),new Vector(this.size.X,this.size.Z),new Vector(1,0,0),new Vector(0,0,1),new Vector(0,-1,0)), //0 -1 0
            new Surface(new Vector(0.5,-0.5,-0.5).scale(this.size.X).add(this.position),new Vector(this.size.Y,this.size.Z),new Vector(0,1,0),new Vector(0,0,1),new Vector(1,0,0)), //1 0 0
            new Surface(new Vector(-0.5,-0.5,-0.5).scale(this.size.X).add(this.position),new Vector(this.size.Y,this.size.Z),new Vector(0,1,0),new Vector(0,0,1),new Vector(-1,0,0))  //-1 0 0
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
    imageData; depthBuffer; middle; hScalar; wScalar; scene; position; rotation; screenCoordinateScalar; scalarRecip; screenDistance; X; N; Y; light;
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
        this.scalarRecip = 1/this.hScalar;
        this.imageData = imageData.data;
        this.scene.elements.forEach(element=>element.draw(this));
        this.depthBuffer.reset();
    }
}