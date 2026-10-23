export {Vector,Matrix};
//Vector klassen ska användas på följande sätt:
//undvik att skapa nya vektorer så mycket som möjligt och återanvänd vektorer eftersom extra saker sker då man skapar en vektor
//det ska byggas upp ett system av vektorer som pratar med varandra, varje vektor anpassar sig till där den befinner i detta system
//calc ska bara användas i beräkningar och ska bara användas om det finns inget annat sätt, använd clone för att klona vektorer
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
class Vector {
    static #buildFunction = (name,...input) => eval(buildFunction(name,...input));
    static #calc = {};
    static #buildCalc(dimensions) {
        if(this.#calc[dimensions]) return this.#calc[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this.#calcVector."+e+"=this."+e+";";
        }
        return this.#calc[dimensions] = this.#buildFunction("calc"+dimensions,str+"return this.#calcVector;");
    }
    static #clone = {};
    static #buildClone(dimensions) {
        if(this.#clone[dimensions]) return this.#clone[dimensions];
        let e = namingConvention(0), str = "return new this.constructor(this."+e;
        for(let i = 1; i < dimensions; i++) {
            e = namingConvention(i);
            str += ",this."+e;
        }
        return this.#clone[dimensions] = this.#buildFunction("clone"+dimensions,str+");");
    }
    static #assignVector = {};
    static #buildAssignVector(dimensions) {
        if(this.#assignVector[dimensions]) return this.#assignVector[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"=v."+e+";";
        }
        return this.#assignVector[dimensions] = this.#buildFunction("assignVector"+dimensions,"v",str+"return this;");
    }
    static #assign = {};
    static #buildAssign(dimensions) {
        if(this.#assign[dimensions]) return this.#assign[dimensions];
        let e = "",  str = "", input = [];
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            input.push(e+"=0");
            str += "this."+e+"="+e+";";
        }
        return this.#assign[dimensions] = this.#buildFunction("assign"+dimensions,...input,str+"return this;");
    }
    static #dot = {};
    static #buildDot(dimensions) {
        if(this.#dot[dimensions]) return this.#dot[dimensions];
        let e = namingConvention(0), str = "return this."+e+"*v."+e;
        for(let i = 1; i < dimensions; i++) {
            e = namingConvention(i);
            str += "+this."+e+"*v."+e;
        }
        return this.#dot[dimensions] = this.#buildFunction("dot"+dimensions,"v",str+";");
    }
    static #magnitude = {};
    static #buildMagnitude(dimensions) {
        if(this.#magnitude[dimensions]) return this.#magnitude[dimensions];
        let e = namingConvention(0), str = "return Math.sqrt(this."+e+"*this."+e;
        for(let i = 1; i < dimensions; i++) {
            e = namingConvention(i);
            str += "+this."+e+"*this."+e;
        }
        return this.#magnitude[dimensions] = this.#buildFunction("magnitude"+dimensions,str+");");
    }
    static #selfDot = {};
    static #buildSelfDot(dimensions) {
        if(this.#selfDot[dimensions]) return this.#selfDot[dimensions];
        let e = namingConvention(0), str = "return this."+e+"*this."+e;
        for(let i = 1; i < dimensions; i++) {
            e = namingConvention(i);
            str += "+this."+e+"*this."+e;
        }
        return this.#selfDot[dimensions] = this.#buildFunction("selfDot"+dimensions,str+";");
    }
    static #add = {};
    static #buildAdd(dimensions) {
        if(this.#add[dimensions]) return this.#add[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"+=v."+e+";";
        }
        return this.#add[dimensions] = this.#buildFunction("add"+dimensions,"v",str+"return this;");
    }
    static #subtract = {};
    static #buildSubtract(dimensions) {
        if(this.#subtract[dimensions]) return this.#subtract[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"-=v."+e+";";
        }
        return this.#subtract[dimensions] = this.#buildFunction("subtract"+dimensions,"v",str+"return this;");
    }
    static #scale = {};
    static #buildScale(dimensions) {
        if(this.#scale[dimensions]) return this.#scale[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"*=s;";
        }
        return this.#scale[dimensions] = this.#buildFunction("scale"+dimensions,"s",str+"return this;");
    }
    static #floor = {}
    static #buildFloor(dimensions) {
        if(this.#floor[dimensions]) return this.#floor[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"=Math.floor(this."+e+");"
        }
        return this.#floor[dimensions] = this.#buildFunction("floor"+dimensions,str+"return this;");
    }
    static #round = {}
    static #buildRound(dimensions) {
        if(this.#round[dimensions]) return this.#round[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"=Math.round(this."+e+");"
        }
        return this.#round[dimensions] = this.#buildFunction("round"+dimensions,str+"return this;");
    }
    static #ceil = {}
    static #buildCeil(dimensions) {
        if(this.#ceil[dimensions]) return this.#ceil[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"=Math.ceil(this."+e+");"
        }
        return this.#ceil[dimensions] = this.#buildFunction("ceil"+dimensions,str+"return this;");
    }
    static #abs = {}
    static #buildAbs(dimensions) {
        if(this.#abs[dimensions]) return this.#abs[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"=Math.abs(this."+e+");"
        }
        return this.#abs[dimensions] = this.#buildFunction("abs"+dimensions,str+"return this;");
    }
    static #sign = {}
    static #buildSign(dimensions) {
        if(this.#sign[dimensions]) return this.#sign[dimensions];
        let e = "", str = "";
        for(let i = 0; i < dimensions; i++) {
            e = namingConvention(i);
            str += "this."+e+"=Math.sign(this."+e+");"
        }
        return this.#sign[dimensions] = this.#buildFunction("sign"+dimensions,str+"return this;");
    }
    #calcVector;
    get calc() { //prototype metoder lägger till en metod med samma namn till objektet, dessa prototype metoder skrivs då över och kallas bara en gång för varje vektor, varje vektor får då bara de metoder som kommer att användas med dem
        this.#calcVector = Vector.zero(this.#dimensions);
        Object.defineProperty(this,"calc",{get:Vector.#buildCalc(this.#dimensions)});
        return this.calc;
    }
    get clone() {
        Object.defineProperty(this,"clone",{get:Vector.#buildClone(this.#dimensions)});
        return this.clone;
    }
    #dimensions;
    get dimensions() {
        return this.#dimensions;
    }
    assignVector(vector) {
        this.assignVector = Vector.#buildAssignVector(this.#dimensions)
        return this.assignVector(vector);
    }
    assign(...elements) {
        this.assign = Vector.#buildAssign(this.#dimensions)
        return this.assign(...elements);
    }
    dot(vector) {
        this.dot = Vector.#buildDot(this.#dimensions)
        return this.dot(vector);
    }
    get selfDot() {
        Object.defineProperty(this,"selfDot",{get:Vector.#buildSelfDot(this.#dimensions)});
        return this.selfDot;
    }
    get magnitude() {
        Object.defineProperty(this,"magnitude",{get:Vector.#buildMagnitude(this.#dimensions)});
        return this.magnitude;
    }
    add(vector) {
        this.add = Vector.#buildAdd(this.#dimensions)
        return this.add(vector);
    }
    subtract(vector) {
        this.subtract = Vector.#buildSubtract(this.#dimensions)
        return this.subtract(vector);
    }
    scale(scalar) {
        this.scale = Vector.#buildScale(this.#dimensions)
        return this.scale(scalar);
    }
    floor() {
        this.floor = Vector.#buildFloor(this.#dimensions);
        return this.floor();
    }
    round() {
        this.round = Vector.#buildRound(this.#dimensions);
        return this.round();
    }
    ceil() {
        this.ceil = Vector.#buildCeil(this.#dimensions);
        return this.ceil();
    }
    abs() {
        this.abs = Vector.#buildAbs(this.#dimensions);
        return this.abs();
    }
    sign() {
        this.sign = Vector.#buildSign(this.#dimensions);
        return this.sign();
    }
    static zero(dimensions) {
        return new Vector(...new Float64Array(dimensions));
    }
    constructor(...elements) {
        for(let i = 0; i < elements.length; this[namingConvention(i)] = elements[i++]);
        this.#dimensions = elements.length;
    }
}

class Matrix {
    static #buildFunction = (name,...input) => eval(buildFunction(name,...input));
    static #namingConvention = (column,row) => namingConvention(column)+"_"+namingConvention(row);
    static #assign = {};
    static #buildAssign(rows,columns) {
        if(this.#assign[rows]?.[columns]) return this.#assign[rows][columns];
        let str = "", e = "", input = [];
        for(let c = 0; c < columns; c++) {
            for(let r = 0; r < rows; r++) {
                e = this.#namingConvention(c,r);
                input.push(e+"=0");
                str += "this."+e+"="+e+";";
            }
        }
        return (this.#assign[rows]??(this.#assign[rows]={}))[columns] = this.#buildFunction("assign"+rows+"_"+columns,...input,str+"return this;");
    }
    static #transform = {};
    static #buildTransform(rows,columns) {
        if(this.#transform[rows]?.[columns]) return this.#transform[rows][columns];
        let str = "";
        for(let r = 0; r < rows; r++) {
            str += "o."+namingConvention(r)+"=this."+Matrix.#namingConvention(0,r)+"*i."+namingConvention(0);
            for(let c = 1; c < columns; c++) {
                str += "+this."+Matrix.#namingConvention(c,r)+"*i."+namingConvention(c);
            }
            str += ";";
        }
        return (this.#transform[rows]??(this.#transform[rows]={}))[columns] = this.#buildFunction("transform"+rows+"_"+columns,"i","o=i.calc",str+"return o;");
    }
    assign(...elements) {
        this.assign = Matrix.#buildAssign(this.#rows,this.#columns);
        return this.assign(...elements);
    }
    transform(input,output=input.calc) {
        this.transform = Matrix.#buildTransform(this.#rows,this.#columns);
        return this.transform(input,output);
    }
    #rows;#columns;
    constructor(rows,columns,...elements) {
        for(let c = 0, s = 0; c < columns; c++) {
            for(let r = 0; r < rows; r++) {
                this[Matrix.#namingConvention(c,r)] = elements[s++]??0;
            }
        }
        this.#rows = rows;
        this.#columns = columns;
    }
}