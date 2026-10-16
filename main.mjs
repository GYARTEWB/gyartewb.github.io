import {Vector} from "./modules/math.mjs";
import {Star, Dot, Surface, Block, Scene, Camera} from "./modules/scene.mjs";

const info = document.getElementById("info");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.height = 500;
var propX = window.innerWidth / window.innerHeight;
canvas.width = Math.round(canvas.height * propX);
let imageData = ctx.createImageData(canvas.width,canvas.height);
window.addEventListener("resize",(e) => {
    propX = window.innerWidth / window.innerHeight;
    canvas.width = Math.round(canvas.height * propX);
    imageData = ctx.createImageData(canvas.width,canvas.height);
});
let scene = new Scene();

let camera = new Camera(scene,1,Infinity);

let time = performance.now();
let deltaTime = 0;
for(let i = 0; i < 15000; i++)
   scene.elements.add(new Star());
//scene.elements.add(new Block(new Vector(0,2,0),new Vector(1,1,1)));
scene.elements.add(new Surface(new Vector(-0.5,2,-0.5),new Vector(1,1),new Vector(1,0,0),new Vector(0,0,1),new Vector(0,-1,0)));

class AnimationDot extends Dot {
    static list = new Set();
    static update(deltaTime) {
        this.list.forEach(dot=>{
            dot.angle = (dot.angle+deltaTime)%(Math.PI*2);
            dot.position.assign(
                dot.position.X,
                dot.position.Y,
                Math.tan(3*Math.sin(time*0.0005)*dot.angle+time*0.0001)+Math.sin(time*0.01+dot.angle*5)*0.5
            )
        })
    }
    constructor(angle) {
        super(new Vector(Math.cos(angle)*5,Math.sin(angle)*5,0),255,0,0);
        this.angle = angle;
        AnimationDot.list.add(this);
    }
}

for(let i = 0; i < 2*Math.PI; scene.elements.add(new AnimationDot(i+=0.00005)));


let rotationSpeed = new Vector(0,0);
let speed = new Vector(0,0,0);

var keys = {};

addEventListener("blur",(e)=>{
    keys = {};
})

addEventListener('keydown', (e) => {
    keys[e.key.toLocaleLowerCase()] = true;
});

addEventListener('keyup', (e) => {
    keys[e.key.toLocaleLowerCase()] = false;
});

let sensitivity = 2;
let mSpeed = 1;
function checkKeys() {
    rotationSpeed.assign(0,0);
    speed.assign(0,0,0);
    if(keys.arrowright) rotationSpeed.X+=1;
    if(keys.arrowleft) rotationSpeed.X-=1;
    if(keys.arrowup) rotationSpeed.Y+=1;
    if(keys.arrowdown) rotationSpeed.Y-=1;
    if(keys.w) speed.add(camera.N);
    if(keys.s) speed.subtract(camera.N);
    if(keys.d) speed.add(camera.X);
    if(keys.a) speed.subtract(camera.X);
    if(keys.e) speed.subtract(camera.Y);
    if(keys.c) speed.add(camera.Y);
    if(keys.i) camera.screenDistance*=1+deltaTime;
    if(keys.o) camera.screenDistance*=1-deltaTime;
    if(keys.r) camera.screenDistance=1;
    if(keys.shift) mSpeed = 10, sensitivity = 4; else mSpeed = 1, sensitivity = 2;
    speed.scale(mSpeed/(speed.magnitude||1));
    rotationSpeed.scale(sensitivity/(rotationSpeed.magnitude||1));
}

function compare(fn,fn2,times) {
    let t1=0,t2=0,time = performance.now();
    for(let i = 0; i < times; i++) {
        fn();
    }
    console.log("fn ",t1=performance.now()-time);
    time = performance.now();
    for(let i = 0; i < times; i++) {
        fn2();
    }
    console.log("fn2",t2=performance.now()-time);
    console.log(t1>t2?"fn2":"fn");
}

function game() {
    imageData.data.fill(0);
    deltaTime = (-time+(time=performance.now()))*0.001;
    checkKeys();
    info.textContent = Math.round(1/deltaTime);
    camera.position.add(speed.calc.scale(deltaTime));
    camera.rotation.add(rotationSpeed.calc.scale(deltaTime));
    AnimationDot.update(deltaTime);
    camera.update();
    camera.shoot(imageData);
    ctx.putImageData(imageData,0,0);
    requestAnimationFrame(game);
}
requestAnimationFrame(game);