export {Vector,Matrix};
/*
* Vector klassen ska användas på följande sätt:
    * undvik att skapa nya vektorer så mycket som möjligt och återanvänd vektorer eftersom extra saker sker då man skapar en vektor
    * det ska byggas upp ett system av vektorer som pratar med varandra, varje vektor anpassar sig till var den befinner i detta system
    * calc ska bara användas i beräkningar och ska bara användas om det finns inget annat sätt, använd clone för att klona vektorer
    * använd inte _calcVector!
* Matrix klassen ska användas på följande sätt:
    *samma som Vektor klassen!
*/

function namingConvention(index) { //räknar i bas 26
    return index<3?String.fromCharCode(88+index):index>25?namingConvention((index/26|0)-1)+namingConvention(index%26):String.fromCharCode(90-index);
}
function buildFunction(name,...input) {
    let inputs = input.slice(0,-1).toString();
    let code = input[input.length-1];
    code = "(function "+name+"("+inputs+"){"+code+"})";
    console.log(code);
    return code;
}

class VectorGroup {
    static groups = {};
    static get(dimensions,prototype) {
        return this.groups[dimensions]??(this.groups[dimensions]=new VectorGroup(dimensions,prototype));
    }
    constructor(dimensions,prototype) {
        Object.defineProperty(this,"dimensions",{value:dimensions});
        this.__proto__ = prototype;
    }
}
class Vector {
    static #buildFunction = (name,...input) => eval(buildFunction(name,...input));
    get _calcVector() {
       Object.defineProperty(this,"_calcVector",{value:Vector.zero(3)});
       return this._calcVector;
    }
    get calc() {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this._calcVector."+e+"=this."+e+";";
        }
        Object.defineProperty(this.__proto__,"calc",{get:Vector.#buildFunction("calc"+this.dimensions,code+"return this._calcVector;")});
        return this.calc;
    }
    get clone() {
        let e = namingConvention(0), code = "return new this.constructor(this."+e;
        for(let i = 1; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += ",this."+e;
        }
        Object.defineProperty(this.__proto__,"clone",{get:Vector.#buildFunction("clone"+this.dimensions,code+");")});
        return this.clone;
    }
    assignVector(vector) {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"=v."+e+";";
        }
        this.__proto__.assignVector = Vector.#buildFunction("assignVector"+this.dimensions,"v",code+"return this;");
        return this.assignVector(vector);
    }
    assign(...elements) {
        let e = "",  code = "", input = [];
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            input.push(e+"=0");
            code += "this."+e+"="+e+";";
        }
        this.__proto__.assign = Vector.#buildFunction("assign"+this.dimensions,...input,code+"return this;");
        return this.assign(...elements);
    }
    dot(vector) {
        let e = namingConvention(0), code = "return this."+e+"*v."+e;
        for(let i = 1; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "+this."+e+"*v."+e;
        }
        this.__proto__.dot = Vector.#buildFunction("dot"+this.dimensions,"v",code+";");
        return this.dot(vector);
    }
    get selfDot() {
        let e = namingConvention(0), code = "return this."+e+"*this."+e;
        for(let i = 1; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "+this."+e+"*this."+e;
        }
        Object.defineProperty(this.__proto__,"selfDot",{get:Vector.#buildFunction("selfDot"+this.dimensions,code+";")});
        return this.selfDot;
    }
    get magnitude() {
        let e = namingConvention(0), code = "return Math.sqrt(this."+e+"*this."+e;
        for(let i = 1; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "+this."+e+"*this."+e;
        }
        Object.defineProperty(this.__proto__,"magnitude",{get:Vector.#buildFunction("magnitude"+this.dimensions,code+");")});
        return this.magnitude;
    }
    add(vector) {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"+=v."+e+";";
        }
        this.__proto__.add = Vector.#buildFunction("add"+this.dimensions,"v",code+"return this;");
        return this.add(vector);
    }
    subtract(vector) {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"-=v."+e+";";
        }
        this.__proto__.subtract = Vector.#buildFunction("subtract"+this.dimensions,"v",code+"return this;");
        return this.subtract(vector);
    }
    scale(scalar) {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"*=s;";
        }
        this.__proto__.scale = Vector.#buildFunction("scale"+this.dimensions,"s",code+"return this;");
        return this.scale(scalar);
    }
    floor() {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"=Math.floor(this."+e+");"
        }
        this.__proto__.floor = Vector.#buildFunction("floor"+this.dimensions,code+"return this;");
        return this.floor();
    }
    round() {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"=Math.round(this."+e+");"
        }
        this.__proto__.round = Vector.#buildFunction("round"+this.dimensions,code+"return this;");
        return this.round();
    }
    ceil() {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"=Math.ceil(this."+e+");"
        }
        this.__proto__.ceil = Vector.#buildFunction("ceil"+this.dimensions,code+"return this;");
        return this.ceil();
    }
    abs() {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"=Math.abs(this."+e+");"
        }
        this.__proto__.abs = Vector.#buildFunction("abs"+this.dimensions,code+"return this;");
        return this.abs();
    }
    sign() {
        let e = "", code = "";
        for(let i = 0; i < this.dimensions; i++) {
            e = namingConvention(i);
            code += "this."+e+"=Math.sign(this."+e+");"
        }
        this.__proto__.sign = Vector.#buildFunction("sign"+this.dimensions,code+"return this;");
        return this.sign();
    }
    static zero(dimensions) {
        return new Vector(...new Float64Array(dimensions));
    }
    constructor(...elements) {
        for(let i = 0; i < elements.length; this[namingConvention(i)] = elements[i++]);
        this.__proto__ = VectorGroup.get(elements.length,this.__proto__);
    }
}

class SelfBuilder {
    constructor(builder=(THIS,property)=>{}) {
        this.__proto__ = new Proxy(this,{
            get:builder,
            set(target,property,value){return (Object.defineProperty(target,property,{value:value}),true)}
        })
    }
}

class MatrixGroup {
    static groups = {};
    static get(rows,columns,prototype) {
        let type = rows+"x"+columns;
        return this.groups[type]??(this.groups[type]=new MatrixGroup(type,rows,columns,prototype));
    }
    constructor(type,rows,columns,prototype) {
        Object.defineProperties(this,{
            type:{value:type},
            rows:{value:rows},
            columns:{value:columns}
        });
        this.__proto__ = prototype;
    }
}
class Matrix {
    static #buildFunction = (name,...input) => eval(buildFunction(name,...input));
    static #namingConvention = (column,row) => namingConvention(column)+"_"+namingConvention(row);
    assign(...elements) {
        let code = "", e = "", input = [];
        for(let c = 0; c < this.columns; c++) {
            for(let r = 0; r < this.rows; r++) {
                e = Matrix.#namingConvention(c,r);
                input.push(e+"=0");
                code += "this."+e+"="+e+";";
            }
        }
        this.__proto__.assign = Matrix.#buildFunction("assign"+this.type,...input,code+"return this;");
        return this.assign(...elements);
    }
    static transform = new SelfBuilder((THIS,property)=>{
        let cp = property.search("c");
        if(cp==-1)
            throw Error("UNDEFINED: "+property);
        let type = property.replace("t","").slice(0,cp-1);
        if(!(MatrixGroup.groups[type]))
            throw Error("UNDEFINED: "+property);
        let cs = property.slice(cp+1);
        let c = Number(cs);
        if((c|0)!=c||""+c!=cs)
            throw Error("UNDEFINED: "+property);
        let code = "";
        let [rows,columns] = type.split("x");
        for(let v = 0; v < c; v++) {
            for(let y = 0; y < rows; y++) {
                code += "o."+this.#namingConvention(v,y)+"=r."+this.#namingConvention(0,y)+"*l."+this.#namingConvention(v,0);
                for(let x = 1; x < columns; x++) {
                    code += "+r."+this.#namingConvention(x,y)+"*l."+this.#namingConvention(v,x);
                }
                code += ";";
            }
        }
        return THIS[property]=this.#buildFunction("transform"+property,"r","l","o",code+"return o;");
    });
    transformVector(input,output) {
        let code = "";
        for(let r = 0; r < this.rows; r++) {
            code += "o."+namingConvention(r)+"=this."+Matrix.#namingConvention(0,r)+"*i."+namingConvention(0);
            for(let c = 1; c < this.columns; c++) {
                code += "+this."+Matrix.#namingConvention(c,r)+"*i."+namingConvention(c);
            }
            code += ";";
        }
        this.__proto__.transformVector = Matrix.#buildFunction("transformVector"+this.type,"i","o=i.calc",code+"return o;");
        return this.transformVector(input,output);
    }
    add(matrix) {
        let code = "", e = "";
        for(let c = 0; c < this.columns; c++) {
            for(let r = 0; r < this.rows; r++) {
                e = Matrix.#namingConvention(c,r);
                code += "this."+e+"+=i."+e+";";
            }
        }
        this.__proto__.add = Matrix.#buildFunction("add"+this.type,"i",code+"return this;");
        return this.add(matrix);
    }
    scale(scalar) {
        let code = "";
        for(let c = 0; c < this.columns; c++) {
            for(let r = 0; r < this.rows; r++) {
                code += "this."+Matrix.#namingConvention(c,r)+"*=s;";
            }
        }
        this.__proto__.scale = Matrix.#buildFunction("scale"+this.type,"s",code+"return this;");
        return this.scale(scalar);
    }
    constructor(rows,columns,...elements) {
        for(let c = 0, s = 0; c < columns; c++) {
            for(let r = 0; r < rows; r++) {
                this[Matrix.#namingConvention(c,r)] = elements[s++];
            }
        }
        this.__proto__ = MatrixGroup.get(rows,columns,this.__proto__);
    }
}