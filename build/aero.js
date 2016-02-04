/**
* @author       Jonathan Hooker <jonathan@oblio.io>
* @copyright    2015 Oblio
* @license      MIT License
*
* @overview
*
* AeroJS - http://Oblio.io
*
* By Jonathan Hooker http://www.oblio.io @Oblioio
*
* Aero is an attempt to build a node based webGL framework with a focus 
* on quick experimentation.
*
*/

window.Aero = window.Aero || {};
Aero.utils = Aero.utils || {};

// JSProgram registration
Aero.JSPrograms = Aero.JSPrograms || {};
Aero.registerJSProgram = function(id, obj){
    console.log('Aero.registerJSProgram: '+id);
    console.log('Aero.registerJSProgram2: '+id);
    // var currPrograms = Aero.JSPrograms;
    Aero.JSPrograms[id] = obj;
}
;(function(window) {

    /*
    --------------------------------------------------------------------------------------------------------------------
    arrayExecuter
    --------------------------------------------------------------------------------------------------------------------
    */

    var ArrayExecuter = function (scope, id) {
        this.task_arr = [];
        this.defaultScope = scope || this;
        this.id = id || '';
        this.verbose = false;
    }

    ArrayExecuter.prototype = {
        //Exectutes an array of functions
        //If this is called and another array is currently executing, then
        //the new set of functions will run before finishing the previous set
        execute: function (arr) {
            if(this.verbose)console.log("ArrayExecuter | "+this.id+" | execute");
            this.addNext(arr);
            this.runStep('');
        },
        addNext: function (arr) {
            if(this.verbose)console.log("ArrayExecuter | "+this.id+" | addNext");
            if (typeof arr === 'function') {
                // add single function
                this.task_arr.unshift({fn: arr, vars: null});
            } else {
                // add elements from array
                arr.reverse();

                for (var i = 0; i < arr.length; i++) {
                    if (arr[i]) {
                        this.task_arr.unshift(arr[i]);
                    }
                }
            }
        },
        tackOn: function (arr) {
            if(this.verbose)console.log("ArrayExecuter | "+this.id+" | tackOn");
            for (var i=0; i<arr.length; i++) {
                this.task_arr.push(arr[i]);
            }

            this.runStep('');
        },
        runFunctionInScope: function (arr) {
            var obj = arr[0];
            var function_name = arr[1];
            var optionalVars = (arr.length >2)?arr[2]:null;

            if (arr.length >2) {
                obj[function_name](arr[2]);
            } else {
                obj[function_name]();
            }
        },
        runStep: function (args) {
            if(this.verbose)console.log("ArrayExecuter | "+this.id+" | runStep");

            if (this.task_arr.length == 0)return;

            var step = this.task_arr.shift();
            var funct = step.fn;

            step.scope = step.scope || this.defaultScope;
            step.vars = step.vars || [];

            if (typeof step.vars === "string") {
                step.vars = [step.vars];
            }
            
            step.vars.push(this.stepComplete.bind(this));
            
            funct.apply(step.scope, step.vars);

            nullObj(step);
        },
        stepComplete: function (args) {
            if(this.verbose)console.log("ArrayExecuter | "+this.id+" | stepComplete");

            if (this.task_arr.length > 0) {
                window.requestAnimationFrame(this.runStep.bind(this));
            }

        },
        stepComplete_instant: function (args) {
            if(this.verbose)console.log("ArrayExecuter | "+this.id+" | stepComplete_instant");

            if (this.task_arr.length > 0) {
                this.runStep();
            }
        },
        clearArrayExecuter: function () {
            if(this.verbose)console.log("ArrayExecuter | "+this.id+" | clearArrayExecuter");
            this.task_arr = [];
        },
        destroy: function () {
            for (var i = 0; i < this.task_arr.length; i++) {
                nullObj(this.task_arr[i]);
            };
            this.task_arr = [];
            this.defaultScope = null;
        }
    }

    function nullObj (obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = null;
            }
        }
        obj = null;
    }

    Aero.utils.ArrayExecuter = ArrayExecuter;
    
}(window));
(function(window) {

    var XHRLoader = function (url, callback) {
        var xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {

            if ( xhr.readyState == 4 ) {

                if ( xhr.status == 200 || xhr.status == 0 ) {

                    try {

                        callback( xhr.responseText );

                    } catch ( error ) {

                        console.error( error );

                    }

                } else {

                    console.error( "Couldn't load [" + url + "] [" + xhr.status + "]" );

                }

            } 
        };
        
        xhr.open( "GET", url, true );
        xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
        xhr.setRequestHeader( "Content-Type", "text/plain" );
        xhr.send( null );
    }

    Aero.utils.XHRLoader = XHRLoader;
    
}(window));
(function(window) {

    'use strict';
        
    function createRotateX(ang){
        return [
            1,              0,                0,               0,
            0,              Math.cos(ang),    Math.sin(ang),   0,
            0,              -Math.sin(ang),   Math.cos(ang),   0,
            0,              0,                0,               1
        ];
    }
    
    function rotateX(matA, ang){
        var _cos = Math.cos(ang),
            _sin = Math.sin(ang);
        
        return [
                matA[0], 
                matA[1], 
                matA[2], 
                matA[3],                
                matA[4]*_cos + matA[8]*_sin,
                matA[5]*_cos + matA[9]*_sin,
                matA[6]*_cos + matA[10]*_sin,
                matA[7]*_cos + matA[11]*_sin,                
                matA[4]*-_sin + matA[8]*_cos,
                matA[5]*-_sin + matA[9]*_cos,
                matA[6]*-_sin + matA[10]*_cos,
                matA[7]*-_sin + matA[11]*_cos,                
                matA[12],
                matA[13],
                matA[14],
                matA[15]
            ];        
    }
    
    function createRotateY(ang){
        return [
            Math.cos(ang),  0,    -Math.sin(ang),  0,
            0,              1,    0,               0,
            Math.sin(ang),  0,    Math.cos(ang),   0,
            0,              0,    0,               1
        ];        
    }
    
    function rotateY(matA, ang){        
        var _cos = Math.cos(ang),
            _sin = Math.sin(ang);
        
        return [
                matA[0]*_cos + matA[8]*-_sin, 
                matA[1]*_cos + matA[9]*-_sin,
                matA[2]*_cos + matA[10]*-_sin,
                matA[3]*_cos + matA[11]*-_sin,              
                matA[4],
                matA[5],
                matA[6],
                matA[7],
                matA[0]*_sin + matA[8]*_cos,            
                matA[1]*_sin + matA[9]*_cos,
                matA[2]*_sin + matA[10]*_cos,
                matA[3]*_sin + matA[11]*_cos,
                matA[12],
                matA[13],
                matA[14],
                matA[15]
            ];
    }
    
    function createRotateZ(ang){            
        return [
            Math.cos(ang),  Math.sin(ang),  0,  0,
            -Math.sin(ang), Math.cos(ang),  0,  0,
            0,              0,              1,  0,
            0,              0,              0,  1
        ];
    }
    
    function rotateZ(matA, ang){   
        var _cos = Math.cos(ang),
            _sin = Math.sin(ang);
        
        return [
                matA[0]*_cos+matA[4]*_sin, 
                matA[1]*_cos+matA[5]*_sin,
                matA[2]*_cos+matA[6]*_sin,
                matA[3]*_cos+matA[7]*_sin,
                matA[0]*-_sin+matA[4]*_cos,
                matA[1]*-_sin+matA[5]*_cos,
                matA[2]*-_sin+matA[6]*_cos,
                matA[3]*-_sin+matA[7]*_cos,
                matA[8],
                matA[9],
                matA[10],
                matA[11],
                matA[12],
                matA[13],
                matA[14],
                matA[15]
            ];        
    }

    function createScale(scale){
        return [
            scale, 0, 0, 0,
            0, scale, 0, 0,
            0, 0, scale, 0,
            0, 0, 0,     1
        ]
    }

    function scale (matA, s) {  
        return [
            matA[0]*s, matA[1]*s, matA[2]*s, matA[3]*s,
            matA[4]*s, matA[5]*s, matA[6]*s, matA[7]*s,
            matA[8]*s, matA[9]*s, matA[10]*s, matA[11]*s,
            matA[12], matA[13], matA[14], matA[15]
        ]
    }

    function createTranslation(xOff, yOff, zOff){
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            xOff, yOff, zOff, 1
        ]
    }
    
    function translate(matA, xOff, yOff, zOff){        
        return [
                matA[0], 
                matA[1], 
                matA[2],
                matA[3],           
                matA[4],
                matA[5],
                matA[6],
                matA[7],
                matA[8],
                matA[9],
                matA[10],
                matA[11],
                matA[0]*xOff+matA[4]*yOff+matA[8]*zOff+matA[12],
                matA[1]*xOff+matA[5]*yOff+matA[9]*zOff+matA[13],
                matA[2]*xOff+matA[6]*yOff+matA[10]*zOff+matA[14],
                matA[3]*xOff+matA[7]*yOff+matA[11]*zOff+matA[15]
            ];
    }

    function createProjection(near, far, fov, aspect){
        var top = near * Math.tan( fov * 0.5 ),
			bottom = - top,
			left = bottom * aspect,
			right = top * aspect,
			x = 2 * near / ( right - left ),
			y = 2 * near / ( top - bottom ),
			a = ( right + left ) / ( right - left ),
			b = ( top + bottom ) / ( top - bottom ),
			c = - ( far + near ) / ( far - near ),
			d = - 2 * far * near / ( far - near );

		var te = [];
		
		te[0] = x;	te[4] = 0;	te[8] = a;	    te[12] = 0;
		te[1] = 0;	te[5] = y;	te[9] = b;	    te[13] = 0;
		te[2] = 0;	te[6] = 0;	te[10] = c;	    te[14] = d;
		te[3] = 0;	te[7] = 0;	te[11] = - 1;	te[15] = 0;
		
		return te;
	}    

    function multiply (matA, matB){
        return [
                matA[0]*matB[0]+matA[4]*matB[1]+matA[8]*matB[2]+matA[12]*matB[3], 
                matA[1]*matB[0]+matA[5]*matB[1]+matA[9]*matB[2]+matA[13]*matB[3],
                matA[2]*matB[0]+matA[6]*matB[1]+matA[10]*matB[2]+matA[14]*matB[3],
                matA[3]*matB[0]+matA[7]*matB[1]+matA[11]*matB[2]+matA[15]*matB[3],
                matA[0]*matB[4]+matA[4]*matB[5]+matA[8]*matB[6]+matA[12]*matB[7],
                matA[1]*matB[4]+matA[5]*matB[5]+matA[9]*matB[6]+matA[13]*matB[7],
                matA[2]*matB[4]+matA[6]*matB[5]+matA[10]*matB[6]+matA[14]*matB[7],
                matA[3]*matB[4]+matA[7]*matB[5]+matA[11]*matB[6]+matA[15]*matB[7],
                matA[0]*matB[8]+matA[4]*matB[9]+matA[8]*matB[10]+matA[12]*matB[11],            
                matA[1]*matB[8]+matA[5]*matB[9]+matA[9]*matB[10]+matA[13]*matB[11],
                matA[2]*matB[8]+matA[6]*matB[9]+matA[10]*matB[10]+matA[14]*matB[11],
                matA[3]*matB[8]+matA[7]*matB[9]+matA[11]*matB[10]+matA[15]*matB[11],
                matA[0]*matB[12]+matA[4]*matB[13]+matA[8]*matB[14]+matA[12]*matB[15],
                matA[1]*matB[12]+matA[5]*matB[13]+matA[9]*matB[14]+matA[13]*matB[15],
                matA[2]*matB[12]+matA[6]*matB[13]+matA[10]*matB[14]+matA[14]*matB[15],
                matA[3]*matB[12]+matA[7]*matB[13]+matA[11]*matB[14]+matA[15]*matB[15]
            ];
    }
    
    function transpose(matA){
        return [
            matA[0], matA[4], matA[8], matA[12],
            matA[1], matA[5], matA[9], matA[13],
            matA[2], matA[6], matA[10], matA[14],
            matA[3], matA[7], matA[11], matA[15]
        ]
    }

    function inverse ( matA ) {
        // modded from THREE.js
		// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
		var te = [],
        	n11 = matA[0], n12 = matA[4], n13 = matA[8], n14 = matA[12],
        	n21 = matA[1], n22 = matA[5], n23 = matA[9], n24 = matA[13],
        	n31 = matA[2], n32 = matA[6], n33 = matA[10], n34 = matA[14],
        	n41 = matA[3], n42 = matA[7], n43 = matA[11], n44 = matA[15];

		te[0] = n23*n34*n42 - n24*n33*n42 + n24*n32*n43 - n22*n34*n43 - n23*n32*n44 + n22*n33*n44;
		te[4] = n14*n33*n42 - n13*n34*n42 - n14*n32*n43 + n12*n34*n43 + n13*n32*n44 - n12*n33*n44;
		te[8] = n13*n24*n42 - n14*n23*n42 + n14*n22*n43 - n12*n24*n43 - n13*n22*n44 + n12*n23*n44;
		te[12] = n14*n23*n32 - n13*n24*n32 - n14*n22*n33 + n12*n24*n33 + n13*n22*n34 - n12*n23*n34;
		te[1] = n24*n33*n41 - n23*n34*n41 - n24*n31*n43 + n21*n34*n43 + n23*n31*n44 - n21*n33*n44;
		te[5] = n13*n34*n41 - n14*n33*n41 + n14*n31*n43 - n11*n34*n43 - n13*n31*n44 + n11*n33*n44;
		te[9] = n14*n23*n41 - n13*n24*n41 - n14*n21*n43 + n11*n24*n43 + n13*n21*n44 - n11*n23*n44;
		te[13] = n13*n24*n31 - n14*n23*n31 + n14*n21*n33 - n11*n24*n33 - n13*n21*n34 + n11*n23*n34;
		te[2] = n22*n34*n41 - n24*n32*n41 + n24*n31*n42 - n21*n34*n42 - n22*n31*n44 + n21*n32*n44;
		te[6] = n14*n32*n41 - n12*n34*n41 - n14*n31*n42 + n11*n34*n42 + n12*n31*n44 - n11*n32*n44;
		te[10] = n12*n24*n41 - n14*n22*n41 + n14*n21*n42 - n11*n24*n42 - n12*n21*n44 + n11*n22*n44;
		te[14] = n14*n22*n31 - n12*n24*n31 - n14*n21*n32 + n11*n24*n32 + n12*n21*n34 - n11*n22*n34;
		te[3] = n23*n32*n41 - n22*n33*n41 - n23*n31*n42 + n21*n33*n42 + n22*n31*n43 - n21*n32*n43;
		te[7] = n12*n33*n41 - n13*n32*n41 + n13*n31*n42 - n11*n33*n42 - n12*n31*n43 + n11*n32*n43;
		te[11] = n13*n22*n41 - n12*n23*n41 - n13*n21*n42 + n11*n23*n42 + n12*n21*n43 - n11*n22*n43;
		te[15] = n12*n23*n31 - n13*n22*n31 + n13*n21*n32 - n11*n23*n32 - n12*n21*n33 + n11*n22*n33;

		var det = n11 * te[ 0 ] + n21 * te[ 4 ] + n31 * te[ 8 ] + n41 * te[ 12 ];

		if ( det == 0 ) {
			return [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
		}

        te = scale(te, 1 / det );

		return te;

	}

    function clone(matA){
        return [
            matA[0], matA[1], matA[2], matA[3],
            matA[4], matA[5], matA[6], matA[7],
            matA[8], matA[9], matA[10], matA[11],
            matA[12], matA[13], matA[14], matA[15]
        ]
    }
    
    // add section to Aero namespace
    Aero.Math = Aero.Math || {};
    Aero.Math.Matrix4 = {
    	"createRotateX": createRotateX,
    	"rotateX": rotateX,
        "createRotateY": createRotateY,
        "rotateY": rotateY,
        "createRotateZ": createRotateZ,
        "rotateZ": rotateZ,
    	"createScale": createScale,
    	"scale": scale,
    	"createTranslation": createTranslation,
    	"translate": translate,
    	"createProjection": createProjection,
    	"multiply": multiply,
    	"transpose": transpose,
    	"inverse": inverse,
    	"clone": clone
    };


}(window));

(function(window) {

    'use strict';


    // function calculateFaceNormal(ptA, ptB, ptC){
    //     // give me 3 points... i'll calculate the normal
    //     var vecA = vec_sub(ptC, ptB),
    //         vecB = vec_sub(ptA, ptB),
    //         cross = vec_cross(vecA, vecB);

    //     // return normalized cross product
    //     return vec_divide(cross, vec_length(cross));
    // }

    // function vec_sub(vecA, vecB){
    //     return [vecA[0]-vecB[0], vecA[1]-vecB[1], vecA[2]-vecB[2]];
    // }

    // function vec_cross(vecA, vecB){
    //     return [
    //                 vecA[1]*vecB[2] - vecA[2]*vecB[1],
    //                 vecA[2]*vecB[0] - vecA[0]*vecB[2],
    //                 vecA[0]*vecB[1] - vecA[1]*vecB[0]
    //             ];
    // }

    // function vec_divide(vecA, scalar){
    //     return [vecA[0]/scalar, vecA[1]/scalar, vecA[2]/scalar];
    // }

    // function vec_length(vecA){
    //     return Math.sqrt( vecA[0] * vecA[0] + vecA[1] * vecA[1] + vecA[2] * vecA[2] );
    // }
    
    
    function multiplyMat4(vec, mat){
        var w = mat[3] * vec[0] + mat[7] * vec[1] + mat[11] * vec[2] + mat[15];
        w = w || 1.0;
        
        return [ (mat[0] * vec[0] + mat[4] * vec[1] + mat[8] * vec[2] + mat[12]) / w,
            (mat[1] * vec[0] + mat[5] * vec[1] + mat[9] * vec[2] + mat[13]) / w,
            (mat[2] * vec[0] + mat[6] * vec[1] + mat[10] * vec[2] + mat[14]) / w ];
    }
    
    // add section to Aero namespace
    Aero.Math = Aero.Math || {};
    Aero.Math.Vector3 = {
    	multiplyMat4: multiplyMat4
    };


}(window));



(function(window) {

    'use strict';

    var GLProgram = function (_settings, _scene) {
        // console.log('GLProgram');
        
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        
        this.type = "GLProgram";
        this.inRenderList = false;

        this.scene = _scene;
        this.gl =  this.scene.gl;
        // default settings
        this.settings = {
                defines: [],
                constants: {},
                renderMode: "TRIANGLE_STRIP"
            };
        
        // add passed in settings
        for(var _set in _settings) this.settings[_set] = _settings[_set];

        this.drawToCanvas = false;
        this.clearBuffer = (String(_settings.clearBuffer).toLowerCase() == "true")?true:false;
        
        //shaders
        this.vShader = {
            path: this.settings["vertexShader"]
        }

        this.fShader = {
            path: this.settings["fragmentShader"]
        }
    }

    function init(callBackFn){

        var function_arr =  [
                { fn: loadShader, vars: 'vShader' },
                { fn: loadShader, vars: 'fShader' },
                { fn: compile },
                { fn: callBackFn }
            ];

        this.arrayExecuter.execute(function_arr);

    }

    function loadShader(type, callBackFn){
        console.log('loadShader: '+this[type].path);
        
        if(this.scene.data.library[this[type].path]){
            this[type].text = this.scene.data.library[this[type].path];
            callBackFn();
        } else {
            Aero.utils.XHRLoader(String(this[type].path).replace('~/', this.scene.dirPath), function (data){
                    this[type].text = data;
                    callBackFn();
                }.bind(this) );
        }
        
    }

    function compile(callBackFn){
        console.log('compile program');

        var gl = this.gl,
            defines = "",
            constants = "";     
        
        for(var i=0; i<this.settings.defines.length; i++){
            defines += "#define "+this.settings.defines[i]+"\n";
        }
        
        for(var c in this.settings.constants){
            constants += "const "+this.settings.constants[c].type+" "+c+" = "+this.settings.constants[c].value+";\n";
        }
        
        //create fragment shader
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, defines+constants+this.fShader.text);
        gl.compileShader(fragmentShader);
        if(!checkCompile.call(this, gl, "2d-fragment-shader", fragmentShader))return;
        this.fShader.obj = fragmentShader;

        //create vertex shader
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, defines+constants+this.vShader.text);
        gl.compileShader(vertexShader);
        if(!checkCompile.call(this, gl, "2d-vertex-shader", vertexShader))return;
        this.vShader.obj = vertexShader;

        //create shader program
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.log("Unable to initialize the shader program.");
        gl.useProgram(program);
        this.program = program;
        gl.program = program;

        setupUniforms.call(this, callBackFn);
        // if(callBackFn)callBackFn();
    }
    
    function checkDefine(defineVar){
        for(var i=0; i<this.settings.defines.length; i++){
            if(this.settings.defines[i] == defineVar)return i;
        }
        return -1;
    }
    
    function addDefine(defineVar){
        if(!defineVar || this.checkDefine(defineVar) >= 0)return; // var is null or already defined
        this.settings.defines.push(defineVar);
    }
    
    function removeDefine(defineVar){
        if(!defineVar)return; // var is null
        var defineIndex = this.checkDefine(defineVar);
        if(defineIndex < 0)return; // not defined
        this.settings.defines.splice(defineIndex, 1);
    }
    
    function setDefines(defineArr){
        if(!defineArr.constructor === Array)return; // var is not an array
        this.settings.defines = defineArr;
    }
    
    function setConstant(_name, _type, _value){
        if(_name == undefined || _type == undefined || _value == undefined)return; // need all 3 variables
        this.settings.constants[_name] = {type:_type, value:_value};
    }

    function setupUniforms(callBackFn){
        var gl = this.gl,
            uniformSettings = this.settings.uniforms,
            uniObj,
            u_loc,
            u_val,
            u_fn,
            u_apply;

        this.uniforms = [];
        this.inputs = this.inputs || {};
        
        for(var u in uniformSettings){
            uniObj = uniformSettings[u];
            u_loc = gl.getUniformLocation(this.program, u);
            // console.log('u_loc: '+u+' | '+u_loc);
            u_val = uniObj.val || null;

            switch(uniObj.type){
                case "f":
                case "1f":
                    u_fn = Aero.GLUploaders.uniform1f;
                    if(!u_val)u_val = 0;
                    break;                    
                case "1fv":
                    u_fn = Aero.GLUploaders.uniform1fv;
                    break;
                case "1i":
                    u_fn = Aero.GLUploaders.uniform1i;
                    break;
                case "1iv":
                    u_fn = Aero.GLUploaders.uniform1iv;
                    break;

                case "2f":
                    u_fn = Aero.GLUploaders.uniform2f;
                    if(!u_val)u_val = [0,0];
                    break;                    
                case "2fv":
                    u_fn = Aero.GLUploaders.uniform2fv;
                    break;
                case "2i":
                    u_fn = Aero.GLUploaders.uniform2i;
                    break;
                case "2iv":
                    u_fn = Aero.GLUploaders.uniform2iv;
                    break;

                case "3f":
                    u_fn = Aero.GLUploaders.uniform3f;
                    if(!u_val)u_val = [0,0,0];
                    break;
                case "3m":
                    u_fn = Aero.GLUploaders.uniformMatrix3fv;
                    if(!u_val)u_val = [
                        1,0,0,
                        0,1,0,
                        0,0,1];
                    break;
                    
                case "4f":
                    u_fn = Aero.GLUploaders.uniform4f;
                    if(!u_val)u_val = [0,0,0,0];
                    break;
                case "4m":
                    u_fn = Aero.GLUploaders.uniformMatrix4fv;
                    if(!u_val)u_val = [
                        1,0,0,0,
                        0,1,0,0,
                        0,0,1,0,
                        0,0,0,1];
                    break;
                    
                case "t":
                    u_fn = Aero.GLUploaders.uniform1i;
                    break;

                default:
                    console.log("uniform type: "+uniObj.type+" not yet setup");
                    u_fn = false;
            }

            this.inputs[u] = this.inputs[u] || u_val;
            this.uniforms.push({
                id: u,
                type: uniObj.type,
                loc: u_loc,
                fn: u_fn
            });
        }
        
        // if u_resolution is not in JSON, but is in the program, we'll add it and update on resize
        if(!this.inputs["u_resolution"]){
            u_loc = gl.getUniformLocation(this.program, "u_resolution");
            if(u_loc !== null){
                this.inputs["u_resolution"] = this.inputs["u_resolution"] || [1,1];
                this.uniforms.push({
                    id: "u_resolution",
                    type: "2f",
                    loc: u_loc,
                    fn: Aero.GLUploaders.uniform2f
                });
            }
        }

        if(callBackFn)callBackFn();
    }

    function updateUniforms(){

        var gl = this.gl,
            u = this.uniforms.length,
            uObj;
        
        
        while(u--){
            uObj = this.uniforms[u];
            
            // if(this.id == 'height' && u == 1)console.log('updateUniforms! '+uObj.loc);
            if(uObj.fn)uObj.fn(gl, uObj.loc, this.inputs[uObj.id]);
        }
    }

    function render(){
        var gl = this.gl;

        gl.useProgram(this.program);
        gl.program = this.program;

        this.updateUniforms();

        gl.drawArrays(gl[this.settings.renderMode], 0, 4);
    }
    
    function resize(w, h){
        if(this.inputs["u_resolution"] && this.inputs["u_resolution"].length == 2){
            this.inputs["u_resolution"] = [w,h];
        }
    }
    
    function destroy(){
        var gl = this.gl;
        
        gl.deleteShader(this.fShader.obj);
        gl.deleteShader(this.fShader.obj);
        this.fShader = null;
        this.vShader = null;
        
        this.program = null;
        this.inputs = null;
        this.uniforms = null;
        
        this.arrayExecuter.destroy();
        
        this.scene = null;
        this.gl =  null;
        this.arrayExecuter =  null;
    }

    GLProgram.prototype.init = init;
    GLProgram.prototype.compile = compile;
    GLProgram.prototype.checkDefine = checkDefine;
    GLProgram.prototype.addDefine = addDefine;
    GLProgram.prototype.removeDefine = removeDefine;
    GLProgram.prototype.setDefines = setDefines;
    GLProgram.prototype.setConstant = setConstant;
    
    GLProgram.prototype.updateUniforms = updateUniforms;
    
    GLProgram.prototype.render = render;
    GLProgram.prototype.resize = resize;
    GLProgram.prototype.destroy = destroy;

    // add section to Aero namespace
    Aero = Aero || {};
    Aero.GLProgram = GLProgram;


/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////

UTILITY FUNCTIONS

*/ //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function checkCompile(gl, id, shader){
        var compileStatus = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if(!compileStatus){
            console.log("Error compiling "+id+": " + this.gl.getShaderInfoLog(shader));
        }
        return compileStatus;
    }

}(window));

(function(window) {

    'use strict';

    
    var GLTexture = function (_settings, _scene) {
        var gl = _scene.gl;
        
        this.settings = {
            flipY: true,
            src: null
        }
        
        // console.log('GLTexture');
        this.type = "texture";
        this.inRenderList = false;
        
        this.scene = _scene;
        
        // add passed in settings
        for(var _set in _settings) this.settings[_set] = _settings[_set];
        
        this.src = (_settings.src)?_settings.src:null;
        this.cube = (_settings.src && _settings.src.constructor === Array )?true:false;
        this.type = (this.cube)?gl.TEXTURE_CUBE_MAP:gl.TEXTURE_2D;
        this.srcObj = (typeof this.src == "object")?this.src:null;
        this.texUnit = _settings.texUnit;
        
        console.log('GLTexture Init: '+this.texUnit);
                    
        this.texture =  gl.createTexture();        
    }
    
    function load(callbackFn){ 
        console.log(this);    
        if(!this.src){
            console.log('loadTexture ERROR: no image url');
            if(callbackFn)callbackFn();
        }
        
        // console.log('loadTexture: '+this.src);
        var completeFn = function(){
            // this.update(callbackFn);
            update.call(this, callbackFn);
        }.bind(this);
        
        if(this.cube){
            this.srcObj = [];
            var sidesLoaded = 0;
            function sideloaded(){ 
                sidesLoaded++;
                if(sidesLoaded == 6)completeFn();
            };
            for(var i=0; i<6; i++){
                var imgObj = new Image();
                imgObj.onload = sideloaded.bind(this);
                imgObj.src = this.src[i].replace('~/', this.scene.dirPath);
                this.srcObj.push(imgObj);
            }
        } else if(this.srcObj){ // was passed an object, not src string
            completeFn();
        } else {
            this.srcObj = new Image();        
            this.srcObj.onload = completeFn;
            this.srcObj.src = this.src.replace('~/', this.scene.dirPath);
        }
    }
    
    function isPow2( num ){
        return num !== 0 && (num & (num - 1)) === 0;
    }
        
    function update(callbackFn){
        var gl = this.scene.gl,
            texture = this.texture;
        
        gl.activeTexture(gl["TEXTURE"+this.texUnit]);
        gl.bindTexture(this.type, texture );
        
        //save image dimensions
        this.width = this.srcObj.width;
        this.height = this.srcObj.height;     
                
        //flip the Y coord
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.settings.flipY);
        
        // Set the parameters so we can render any size image.
        // gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(this.type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(this.type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        
        if(!this.cube){
            // Upload the image into the texture.
            gl.texImage2D(this.type, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.srcObj);
        } else {            
            for(var i=0; i<6; i++){
                gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.srcObj[i]);
            }
        }
        
        if (callbackFn)callbackFn();
    }
    
    function destroy(){
        
        var gl = this.scene.gl,
            texture = this.texture;
            
        gl.deleteTexture(texture);
        
        this.srcObj = null;
        this.texture = null;
        this.scene = null;
        this.settings = null;
        this.src = null;
        this.texUnit = null;
    }
        
    GLTexture.prototype.load = load;
    GLTexture.prototype.update = update;
    GLTexture.prototype.destroy = destroy;
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.GLTexture = GLTexture;
    
   
}(window));
(function(window) {
    
    'use strict';
    
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.GLUploaders = {
        uniform1f: function(gl, u_loc, u_val){
            gl.uniform1f(u_loc, u_val);
        },
        uniform1fv: function(gl, u_loc, u_val){
            gl.uniform1fv.apply(gl, [gl, u_loc].concat( u_val ));
        },
        uniform2f: function(gl, u_loc, u_val){
            gl.uniform2f(u_loc, u_val[0], u_val[1]);
        },
        uniform2fv: function(gl, u_loc, u_val){
            gl.uniform2fv.apply(gl, [gl, u_loc].concat( u_val ));
        },        
        uniform3f: function(gl, u_loc, u_val){
            gl.uniform3f(u_loc, u_val[0], u_val[1], u_val[2]);
        },
        uniform3fv: function(gl, u_loc, u_val){
            gl.uniform3fv.apply(gl, [gl, u_loc].concat( u_val ));
        },    
        uniform4f: function(gl, u_loc, u_val){
            gl.uniform4f(u_loc, u_val[0], u_val[1], u_val[2], u_val[3]);
        },
        uniform4fv: function(gl, u_loc, u_val){
            gl.uniform4fv.apply(gl, [gl, u_loc].concat( u_val ));
        },
        
        uniform1i: function(gl, u_loc, u_val){
            gl.uniform1i(u_loc, u_val);
        },
        uniform1iv: function(gl, u_loc, u_val){
            gl.uniform2iv.apply(gl, [gl, u_loc].concat( u_val ));
        },        
        uniform2i: function(gl, u_loc, u_val){
            gl.uniform2i(u_loc, u_val[0], u_val[1]);
        },
        uniform2iv: function(gl, u_loc, u_val){
            gl.uniform2iv.apply(gl, [gl, u_loc].concat( u_val ));
        },        
        uniform3i: function(gl, u_loc, u_val){
            gl.uniform3i(u_loc, u_val[0], u_val[1], u_val[2])
        },        
        uniform3iv: function(gl, u_loc, u_val){
            gl.uniform3iv.apply(gl, [gl, u_loc].concat( u_val ));
        },        
        uniform4i: function(gl, u_loc, u_val){
            gl.uniform4i(u_loc, u_val[0], u_val[1], u_val[2], u_val[3]);
        },
        uniform4iv: function(gl, u_loc, u_val){
            gl.uniform4iv.apply(gl, [gl, u_loc].concat( u_val ));
        },
        
        uniformMatrix2fv: function(gl, u_loc, u_val){
            gl.uniformMatrix2fv(u_loc, gl.FALSE, u_val);
        },
        uniformMatrix3fv: function(gl, u_loc, u_val){
            gl.uniformMatrix3fv(u_loc, gl.FALSE, u_val);
        },
        uniformMatrix4fv: function(gl, u_loc, u_val){
            gl.uniformMatrix4fv(u_loc, gl.FALSE, u_val);
        }
    }


}(window));

(function(window) {

    'use strict';


    function Renderer(_scene){
        this.scene = _scene;
        this.frameBuffers = [];
    }
    
    // not run until data and canvas are in place
    function init(){        
        this.gl = this.scene.gl;
        
        //setup initial vars
        this.maxTextureUnits = this.scene.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.nextTexUnit = 0;
        this.autoRender = false;   
                
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
    }
    
    function update(callBackFn){
        
        var function_arr =  [
                // { fn: createRenderList },
                // { fn: assignFrameBuffers },
                { fn: initVertexBuffers },
                { fn: callBackFn }
            ];
        
        this.arrayExecuter.execute(function_arr);
    }
    
    function setSize(w, h){
        console.log('setSize: '+w+', '+h);
        //size the canvas
        this.scene.canvas.width = w;
        this.scene.canvas.height = h;
        
        this.gl.viewport(0, 0, Number(w), Number(h));
        var nodes = this.scene.nodes;
        for(var node in nodes){
            if(nodes[node].resize)nodes[node].resize(w, h);
        }
        var gl = this.gl;
                
        // need to resize frame buffers
        for(var i=0; i<this.frameBuffers.length; i++){
            console.log(this.frameBuffers[i].size);
            if(this.frameBuffers[i].size !== "auto")continue; // only resize those that are autosized
            // console.log('resize buffer '+i);
            this.frameBuffers[i].width = w;
            this.frameBuffers[i].height = h;
            
            // size texture
            gl.activeTexture(gl["TEXTURE"+this.frameBuffers[i].texUnit]);
            gl.bindTexture(gl.TEXTURE_2D, this.frameBuffers[i].texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            // gl.bindTexture(gl.TEXTURE_2D, null);

            // size depth buffer
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.frameBuffers[i].renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        this.scene.needsUpdate = true;
    }
        
    function createRenderList(callBackFn){
        console.log('/////////////////  createRenderList  /////////////////');
        
        // first we reset all the nodes to default settings
        
        
        // figure out the render chains.
        // the idea is to track back from any canvas renders
        // the order doesn't have to be exact order, but all
        // dependencies must be figured out
        
        var connections = this.scene.connections,
            nodesToCheck = this.scene.connectionSearch('dest', 'canvas'), //initial connections to check are those that draw to canvas
            connectedNodes = [],
            currConnection,
            currNode,
            sourceConnections,
            destConnections,
            connectedNode,
            connectedIndex,
            lowestIndex,
            highestIndex,
            s, d, r;

        // console.log('initial nodes to check: '+nodesToCheck.length);
        
        // clear render list
        this.renderList = [];
        // reset all nodes
        for(currNode in this.scene.nodes){
            this.scene.nodes[currNode].inRenderList = false;
            this.scene.nodes[currNode].dependents = []
        }
        
        // setup the nodes that draw to canvas
        for(r=0; r<nodesToCheck.length; r++){
            connectedNode = getConnectedNode.call(this, nodesToCheck[r], 'source');
            connectedNode.drawToCanvas = true;
        }

        // Everytime I check a node I will add it to the render list
        // I check what dependencies it has, and what other nodes depend on it
        
        // To determine where in the render list it should go we need to:
        // Check the index of all nodes that depends on this node and remember the lowest value
        // Check the index of all nodes it depends on and remember the highest value
        // place it on the render at the highest value that meets both requirements

        // finally add any nodes that depend on the current node to the beginning of the toCheck array

        //this will loop as long as there more connections to add
        while(nodesToCheck.length){
            // console.log('loop begin: '+nodesToCheck.length);
            currConnection = nodesToCheck.shift(); //get first connection in list
            lowestIndex = highestIndex = false; //reset vars

            // console.log('currNode');
            // console.log(currConnection);
            currNode = getConnectedNode.call(this, currConnection, 'source');
            // console.log('checking node: '+currNode.id);
            // console.log(currNode.inRenderList);
            if(currNode.inRenderList)continue; // keeps a node from ever being added twice
            currNode.inRenderList = true;

            // connections where the current node is the source
            sourceConnections = this.scene.connectionSearch('source', currConnection['source']['id']);

            // console.log('source connections');
            for(s=0; s<sourceConnections.length; s++){

                connectedNode = getConnectedNode.call(this, sourceConnections[s], 'dest');
                if(!connectedNode)continue;
                // console.log(connectedNode);
                if(currNode.type == "texture"){
                    // connectedNode.setUniform(sourceConnections[s]['dest']['var'], currNode.texUnit);
                    connectedNode.inputs[sourceConnections[s]['dest']['var']] = currNode.texUnit;
                }
                if(currNode.type == "GLProgram"){
                    currNode.dependents.push({
                        id: connectedNode.id, 
                        destVar: sourceConnections[s]['dest']['var']
                    });
                }
                if(currNode.type == "JSProgram"){
                    console.log('add output to JSProgram');
                    currNode.dependents.push({
                        obj: connectedNode,
                        id: connectedNode.id,
                        sourceVar: sourceConnections[s]['source']['var'],
                        destVar: sourceConnections[s]['dest']['var']
                    });
                }

                // determine highestIndex this should be placed into render list
                // must be before any nodes in the sourceConnections array
                connectedIndex = getRenderListIndex(this.renderList, connectedNode);
                if(sourceConnections[s]["feedback"] && String(sourceConnections[s]["feedback"]).toLowerCase() == "true")continue;
                if(connectedIndex !== false){
                    highestIndex = (highestIndex !== false)?Math.min(connectedIndex, highestIndex):connectedIndex;
                }
            }

            // connections where the current node is the dest
            destConnections = this.scene.connectionSearch('dest', currConnection['source']['id']);

            // console.log('dest connections');
            for(d=0; d<destConnections.length; d++){

                connectedNode = getConnectedNode.call(this, destConnections[d], 'source');
                if(!connectedNode)continue;
                if(!connectedNode.inRenderList) nodesToCheck.unshift(destConnections[d]); //add to beginning of list
                // determine lowestIndex this should be placed into render list
                // must be after any nodes in the destConnections array
                connectedIndex = getRenderListIndex(this.renderList, connectedNode);
                if(destConnections[d]["feedback"] && String(destConnections[d]["feedback"]).toLowerCase() == "true")continue;
                if(connectedIndex !== false){
                    lowestIndex = (lowestIndex !== false)?Math.max(connectedIndex, lowestIndex):connectedIndex;
                }
            }

            // console.log('adding: '+currNode.id+", highestIndex: "+highestIndex+", lowestIndex: "+lowestIndex);

            if(lowestIndex !== false && highestIndex !== false && lowestIndex >= highestIndex){
                // console.log('createRenderList: connection error! lowestIndex is greater than highestIndex');
                console.log('createRenderList: FEEDBACK LOOP! lowestIndex is greater than highestIndex');

                return;
            } else if(highestIndex !== false){
                //place before highestIndex
                this.renderList.splice(highestIndex, 0, currNode);
            } else if(lowestIndex !== false){
                //place after lowestIndex
                this.renderList.splice(lowestIndex+1, 0, currNode);
            } else {
                //place at end of array
                this.renderList.push(currNode);
            }
        }

        // for debug purposes this will output the render order
        var renderOrderStr = "RENDER ORDER: ";
        for(var r=0; r<this.renderList.length; r++){
            renderOrderStr += this.renderList[r].id+" > ";
        }
        console.log(renderOrderStr);

        // callBackFn();
        
        assignFrameBuffers.call(this, callBackFn);
    }

    function getConnectedNode(connection, dir){
        var containerObj = false,
            nodeObj = false;

        containerObj = this.scene.nodes;

        if(!containerObj){
            console.log('getConnectedNode: node type '+connection[dir]['type']+' returned no results');
            return false;
        }

        nodeObj = containerObj[connection[dir]['id']];

        if(!nodeObj){
            console.log('getConnectedNode: node id "'+connection[dir]['id']+'" returned no results');
            return false;
        }

        return nodeObj;
    }

    function getRenderListIndex(renderList, node){
        for(var r=0; r<renderList.length; r++){
            if(renderList[r] === node)return r;
        }

        return false;
    }
    
    function createTexture(textureData){
        textureData = textureData || {};
        textureData.texUnit = this.getNextTexUnit();
        return new Aero.GLTexture(textureData, this.scene);
    }
    
    function assignFrameBuffers(callBackFn){
        console.log('/////////////////  assignFrameBuffers  /////////////////');
        
        // reset current frame buffers
        for(var i=0; i<this.frameBuffers.length; i++){
            this.frameBuffers[i].holdForever = false;
            this.frameBuffers[i].holdIndex = -1;
        }

        var currBuffer,
            currNode,
            connectedNode,
            connectedIndex,
            r, o;

        // loop through frame buffers defined in JSON, if any
        // create buffer for each object and assign it to node

        for(var i=0; i<this.scene.renderTargets.length; i++){
            var buffObj = this.scene.renderTargets[i];
            if(buffObj["nodes"].length){
                currBuffer = this.frameBuffers[i] || getNextFrameBuffer.call(this, 0, this.scene.renderTargets[i]);
                currBuffer.holdForever = true;
                for(o=0; o<buffObj["nodes"].length; o++){
                    currNode = this.scene.nodes[buffObj["nodes"][o]];
                    if(!currNode){
                        console.log('Could not assign frame buffer "'+r+'" to node "'+buffObj["nodes"][o]+'" because it does not exist');
                        continue;
                    }
                    currNode.forcedBuffer = currBuffer;
                }
            }
        }


        // create + assign framebuffers
        // if node needs a frame buffer is needed then we assign
        // a buffer to render to, and we'll also assign the buffer
        // to the dest program to pull in

        for(r=0; r<this.renderList.length; r++){
            currNode = this.renderList[r];

            // if any of these then the node doesn't need a frame buffer
            if( currNode.type == "texture" ) continue;
            if( currNode.type == "JSProgram" && !currNode.draws ) continue;
            if( currNode.drawToCanvas ) continue;
            if( !currNode.dependents || !currNode.dependents.length ) continue;

            if(currNode.forcedBuffer){
                // buffer was assigned in JSON created above
                currBuffer = currNode.forcedBuffer;
                currNode.forcedBuffer = null; // no longer need it
            } else {
                currBuffer = getNextFrameBuffer.call(this, r);
            }
            
            currNode.outputs = currNode.outputs || {};
            currNode.outputs.texUnit = currBuffer.texUnit;
            
            console.log(currNode.id+' draws to frame buffer: '+currBuffer.texUnit);

            for(o=0; o<currNode.dependents.length; o++){
                // getRenderListIndex(this.renderList, connectedNode);
                // connectedNode = this.GLPrograms[currNode.dependents[o].id];
                connectedNode = this.scene.nodes[currNode.dependents[o].id];
                
                // if(connectedNode.type == "GLProgram")connectedNode.setUniform(currNode.dependents[o].var, currBuffer.texUnit); //set the texture unit index
                if(connectedNode.type == "GLProgram"){
                    // console.log('setting '+connectedNode.id+' '+currNode.dependents[o].destVar+' to '+currBuffer.texUnit);
                    connectedNode.inputs[currNode.dependents[o].destVar] = currBuffer.texUnit; //set the texture unit index
                }
                
                
                connectedIndex = getRenderListIndex(this.renderList, connectedNode);
                currBuffer.holdIndex = Math.max(connectedIndex, currBuffer.holdIndex);
                // console.log('framebuffer connectedIndex: '+connectedIndex);
                // console.log('framebuffer holdIndex: '+currBuffer.holdIndex);
            }

            currNode.outputBuffer = currBuffer.index;
        }

        callBackFn();
    }

    function getNextFrameBuffer(r, customSettings){

        // check if any current frame buffers are available
        // if one is available return it
        if(!customSettings){
            for(var b=0; b<this.frameBuffers.length; b++){
                // the buffer is available if the current index is greater than the holdIndex
                if(!this.frameBuffers[b].holdForever && this.frameBuffers[b].holdIndex < r){
                    return this.frameBuffers[b];
                }
            }
        }

        // if we got here then none were available
        // so we're gonna create a new one
        
        // var bufferObject = createFrameBuffer.call(this);

        // bufferObject.index = this.frameBuffers.length;
        // bufferObject.holdIndex = 0;

        // this.frameBuffers.push(bufferObject);

        // return bufferObject;
        
        return createFrameBuffer.call(this, customSettings || {});
    }

    function createFrameBuffer(settings){
        var gl = this.gl,
            rttFramebuffer = gl.createFramebuffer(),
            rttTexture = gl.createTexture(),
            renderbuffer = gl.createRenderbuffer(),
            size = (settings.size)?"custom":"auto",
            bufferWidth = (settings.size && settings.size.width)?settings.size.width:this.scene.canvas.width,
            bufferHeight = (settings.size && settings.size.height)?settings.size.height:this.scene.canvas.height,
            isPowTwo = (
                        (( bufferWidth & ( bufferWidth - 1 ) ) === 0 && bufferWidth !== 0) && 
                        (( bufferHeight & ( bufferHeight - 1 ) ) === 0 && bufferHeight !== 0)
                    ) ? true:false,
            mipmap = (settings.mipmap && isPowTwo)?settings.mipmap:false,
            texUnit = this.getNextTexUnit();

        console.log('createFrameBuffer: texUnit '+texUnit+' size: '+bufferWidth+', '+bufferHeight);        
        console.log("isPowTwo: "+isPowTwo);
        
        // frame buffer
        gl.activeTexture(gl["TEXTURE"+texUnit]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

        // texture
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, (mipmap)?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        if(isPowTwo)gl.generateMipmap(gl.TEXTURE_2D);

        // depth buffer, not sure we need this actually
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, bufferWidth, bufferHeight);

        // attach texture and depth buffer to frame buffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        // unbind the texture and buffers
        // gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // return {
        //     size: size,
        //     frameBuffer: rttFramebuffer,
        //     texture: rttTexture,
        //     renderBuffer: renderbuffer,
        //     width: bufferWidth,
        //     height: bufferHeight,
        //     texUnit: texUnit
        // }
        
        var bufferObject = {
            size: size,
            mipmap: mipmap,
            frameBuffer: rttFramebuffer,
            texture: rttTexture,
            renderBuffer: renderbuffer,
            width: bufferWidth,
            height: bufferHeight,
            texUnit: texUnit,
            index: this.frameBuffers.length,
            holdIndex: 0
        }
        
        this.frameBuffers.push(bufferObject);
        
        return bufferObject;
    }

    function getNextTexUnit(){
        var texUnit = this.nextTexUnit;
        if(texUnit >= this.maxTextureUnits)
            console.log("ERROR: TexUnit "+texUnit+" | Only "+this.maxTextureUnits+" are supported.");
        this.nextTexUnit++;
        return texUnit;
    }
    
    function initVertexBuffers(callBackFn){
        console.log('initVertexBuffers');
        var gl = this.gl;

        var verticesTexCoords = new Float32Array([
          // Vertex coordinates, texture coordinate
          -1,  1,   0.0, 1.0,
          -1, -1,   0.0, 0.0,
           1,  1,   1.0, 1.0,
           1, -1,   1.0, 0.0
        ]);
        var n = 4; // The number of vertices

        // Create the buffer object
        var vertexTexCoordBuffer = gl.createBuffer();
        if (!vertexTexCoordBuffer) {
          console.log('Failed to create the buffer object');
          return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

        this.standardVertexBuffer = {
            buffer: vertexTexCoordBuffer,
            array: verticesTexCoords,
            fsize: verticesTexCoords.BYTES_PER_ELEMENT
        };

        this.usingStandardVertexBuffer = false;

        callBackFn();
    }

    function useStandardVertexBuffer(){
        var gl = this.gl;
        this.usingStandardVertexBuffer = true;

        // bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.standardVertexBuffer.buffer);

        // setup attributes
        setupAttribute(gl, 'a_Position', this.standardVertexBuffer.fsize, 2, 4, 0);
        setupAttribute(gl, 'a_TexCoord', this.standardVertexBuffer.fsize, 2, 4, 2);

    }

    function setupAttribute(gl, id, FSIZE, num, stride, start){
        // Get the storage location of attribute
        var a_location = gl.getAttribLocation(gl.program, id);
        if (a_location < 0) {
          console.log('Failed to get the attribute storage location of '+id);
          return false;
        }
        gl.vertexAttribPointer(a_location, num, gl.FLOAT, false, FSIZE * stride, FSIZE * start);
        gl.enableVertexAttribArray(a_location);

        return true;
    }

    function createCustomBuffer(data, attributes){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;

        // Create the buffer object
        var newBuffer = gl.createBuffer();
        if (!newBuffer) {
          console.log('Failed to create the buffer object');
          return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(data.type || gl.ARRAY_BUFFER, newBuffer);
        gl.bufferData(data.type || gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

        return {
            buffer: newBuffer,
            type: data.type || gl.ARRAY_BUFFER,
            length: data.length,
            data: data,
            fsize: data.BYTES_PER_ELEMENT,
            attributes: attributes
        };
    }

    function updateCustomBuffer(bufferObj){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;
        // bind buffer
        gl.bindBuffer(bufferObj.type, bufferObj.buffer);
        // buffer data (maybe should use glBufferSubData instead?);
        if(bufferObj.data.length > bufferObj.length){
            bufferObj.length = bufferObj.data.length;
            gl.bufferData(bufferObj.type, bufferObj.data, gl.DYNAMIC_DRAW);
        } else {
            gl.bufferSubData(bufferObj.type, 0, bufferObj.data);
        }
    }

    function useCustomBuffer(bufferObj){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;

        // bind buffer
        gl.bindBuffer(bufferObj.type, bufferObj.buffer);

        // setup attributes
        var numAtr = bufferObj.attributes.length;
        while(numAtr--){
            setupAttribute(gl,
                bufferObj.attributes[numAtr].id,
                bufferObj.fsize,
                bufferObj.attributes[numAtr].num,
                bufferObj.attributes[numAtr].stride,
                bufferObj.attributes[numAtr].start
              );
        }
    }
    
    
    
    
    function start(){
        if(this.autoRender)return;
        this.autoRender = true;
        this.render();
    }
    
    function pause(){
        this.autoRender = false;        
    }
    
    function render(){
        var gl = this.gl,
            nodeObj, bufferObj,
            d,
            canvasW = Number(this.scene.canvas.width),
            canvasH = Number(this.scene.canvas.height);
            
        if(!this.gl)return;
        
        if(this.scene.needsUpdate){
            this.scene.needsUpdate = false;
            createRenderList.call(this, function(){
                console.log('render list callback');
                render.call(this);
            }.bind(this));
            return;
        }
        
        for(var p=0; p<this.renderList.length; p++){
            nodeObj = this.renderList[p];

            switch(nodeObj.type){
                case "GLProgram":
                
                    //attach program
                    gl.useProgram(nodeObj.program);
                    gl.program = nodeObj.program;
                    

                    //update vertex attrib
                    if(!this.usingStandardVertexBuffer){
                        this.useStandardVertexBuffer(this);
                    }

                    //update uniforms
                    nodeObj.updateUniforms();
                    
                    // console.log('program: '+nodeObj.id);
                    if(nodeObj.drawToCanvas){
                        // console.log(nodeObj.id+' draw to canvas!');
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.viewport(0, 0, canvasW, canvasH);
                        
                        //draw
                        nodeObj.render();
                        
                    } else {
                        bufferObj = this.frameBuffers[nodeObj.outputBuffer];
                        // console.log('bind buffer: '+nodeObj.outputBuffer);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, bufferObj.frameBuffer);
                        gl.viewport(0, 0, bufferObj.width, bufferObj.height);
                        
                        if(nodeObj.clearBuffer){
                            gl.clear(gl.COLOR_BUFFER_BIT);
                        }                        
                        
                        //draw
                        nodeObj.render();
                        if(bufferObj.mipmap){
                            gl.activeTexture(gl["TEXTURE"+bufferObj.texUnit]);
                            // gl.bindTexture(gl.TEXTURE_2D, bufferObj.texture);
                            gl.generateMipmap(gl.TEXTURE_2D);
                        }
                    }



                    break;
                case "JSProgram":
                    if(nodeObj.draws){
                        if(!nodeObj.drawToCanvas){
                            bufferObj = this.frameBuffers[nodeObj.outputBuffer];
                            gl.bindFramebuffer(gl.FRAMEBUFFER, bufferObj.frameBuffer);
                            gl.viewport(0, 0, bufferObj.width, bufferObj.height);
                            
                            if(nodeObj.clearBuffer){
                                gl.clear(gl.COLOR_BUFFER_BIT);
                            }
                            
                            // run program
                            nodeObj.run();
                            
                            if(bufferObj.mipmap){
                                gl.activeTexture(gl["TEXTURE"+bufferObj.texUnit]);
                                // gl.bindTexture(gl.TEXTURE_2D, bufferObj.texture);
                                gl.generateMipmap(gl.TEXTURE_2D);
                            }
                            
                        } else {
                            
                            // console.log(nodeObj.id+' draw to canvas!');
                            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                            gl.viewport(0, 0, canvasW, canvasH);
                            
                            // run program
                            nodeObj.run();
                        }
                    } else {
                        nodeObj.run();
                    }

                    // update dependents
                    d = nodeObj.dependents.length;
                    // if(d>0)console.log('update dependents');
                    while(d--){
                        // if(nodeObj.dependents[d].id="passthrough3")console.log(nodeObj.outputs[nodeObj.dependents[d].sourceVar]);
                        nodeObj.dependents[d].obj.inputs[nodeObj.dependents[d].destVar] = nodeObj.outputs[nodeObj.dependents[d].sourceVar];
                    }

                    break;
                case "texture":
                    break;
            }
        }

        if(this.autoRender)window.requestAnimationFrame(render.bind(this));
    }
    
    function destroy(){
        
        var gl = this.scene.gl,
            numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        
        // delete all texture units
        for (var unit = 0; unit < numTextureUnits; ++unit) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                
        for(var b=0; b<this.frameBuffers.length; b++){            
            gl.deleteRenderbuffer(this.frameBuffers[b].renderBuffer);
            gl.deleteFramebuffer(this.frameBuffers[b].frameBuffer);
            gl.deleteTexture(this.frameBuffers[b].texture);
            
            this.frameBuffers[b] = null;
        }
        
        this.arrayExecuter.destroy();
        
        this.scene = null;
        this.gl = null;
        this.arrayExecuter = null;
        this.renderList = null;
        this.frameBuffers = null;
    }
    
    Renderer.prototype.init = init;
    Renderer.prototype.update = update;
    Renderer.prototype.setSize = setSize;
    Renderer.prototype.start = start;
    Renderer.prototype.pause = pause;
    Renderer.prototype.render = render;
    
    Renderer.prototype.createTexture = createTexture;    
    
    Renderer.prototype.getNextTexUnit = getNextTexUnit;
    Renderer.prototype.useStandardVertexBuffer = useStandardVertexBuffer;
    Renderer.prototype.useCustomBuffer = useCustomBuffer;
    Renderer.prototype.createCustomBuffer = createCustomBuffer;
    Renderer.prototype.updateCustomBuffer = updateCustomBuffer;
    
    Renderer.prototype.destroy = destroy;
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.Renderer = Renderer;

}(window));

(function(window) {

    'use strict';


    function IO(_scene){
        this.scene = _scene;
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        this.dependencies = [];
    }
    
    function loadData(settingsJSON, callBackFn){
        console.log('AERO: loadData');
        if(typeof settingsJSON == "string"){     
            // settingsJSON is external path   
            Aero.utils.XHRLoader(settingsJSON, function(data){                     
                this.scene.dirPath = (settingsJSON.indexOf("/") >= 0)?settingsJSON.substring(0, settingsJSON.lastIndexOf("/")+1):"";
                this.scene.data = JSON.parse(data);
                callBackFn();
            }.bind(this));
            
        } else {
            // settingsJSON is obj
            this.scene.dirPath = "";
            this.scene.data = settingsJSON;
            callBackFn();
        }
    }
    
    function buildData(jsonObj, callBackFn){
        console.log('AERO: buildData');
                
        var function_arr =  [
                { fn: createTextures, vars: [jsonObj["textures"]] },
                { fn: createJSPrograms, vars: [jsonObj["jsPrograms"] || jsonObj["JSPrograms"]] },
                { fn: createGLPrograms, vars: [jsonObj["glPrograms"] || jsonObj["GLPrograms"]] },
                { fn: createRenderTargets, vars: [jsonObj["renderTargets"] || jsonObj["Connections"]] },
                { fn: createConnections, vars: [jsonObj["connections"] || jsonObj["Connections"]] },
                { fn: callBackFn}
            ];
            
        this.arrayExecuter.execute(function_arr);
    }
    
    function createTextures(textureData, callBackFn){
        console.log('/////////////////  createTextures  /////////////////');
        var function_arr = [];
        
        for(var id in textureData){
            function_arr.push({fn: this.scene.createTexture, scope:this.scene, vars:[id, textureData[id]] });
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    function createJSPrograms(programData, callBackFn){
        console.log('/////////////////  createJSPrograms  /////////////////');
        var function_arr = [];
        
        for(var id in programData){
            function_arr.push({fn: this.scene.createJSProgram, scope:this.scene, vars:[id, programData[id]] });
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    // returns true if already loaded
    function checkDependency(_file){
        for(var d=0; d<this.dependencies.length; d++)
                if(_file == this.dependencies[d])
                    return true;
        return false;
    }
    
    function loadDependencies(_files, callBackFn){
        var function_arr = [],
            exists, s, d;
            
        for( s=0; s<_files.length; s++ ){
            if( !this.checkDependency(_files[s]) ){                
                this.dependencies.push(_files[s]);
                console.log(_files[s]);
                if(this.scene.data.library[_files[s]]){
                    write_script(this.scene.data.library[_files[s]]);
                } else {
                    function_arr.push({ fn: add_script, vars: [_files[s]] });
                }
            }
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    function write_script(_script_){
        var scriptEl    = document.createElement("script");
        scriptEl.type   = "text/javascript";
        // scriptEl.src    = scriptURL.replace('~/', this.scene.dirPath);

        // console.log('add_script: '+scriptURL);
        
        scriptEl.innerHTML = _script_;
        
        document.getElementsByTagName("head")[0].appendChild(scriptEl);
    }
    
    // pulled from https://software.intel.com/en-us/blogs/2010/05/22/dynamically-load-javascript-with-load-completion-notification
    function add_script(scriptURL, onloadCB) {
      var scriptEl    = document.createElement("script");
      scriptEl.type   = "text/javascript";
      scriptEl.src    = scriptURL.replace('~/', this.scene.dirPath);
      
      console.log('add_script: '+scriptURL);
      
      var scriptLoaded = function() {
        console.log('add script: loaded')
        onloadCB(scriptURL);
      }

      if(typeof(scriptEl.addEventListener) != 'undefined') {
        /* The FF, Chrome, Safari, Opera way */
        scriptEl.addEventListener('load',scriptLoaded,false);
      }

      else {
        var handleIeState = function() {
          if(scriptEl.readyState == 'loaded'){
            scriptLoaded(scriptURL);
          }
        }
        var ret = scriptEl.attachEvent('onreadystatechange',handleIeState);
      }

      document.getElementsByTagName("head")[0].appendChild(scriptEl);
    }
    
    function createGLPrograms(programData, callBackFn){
        console.log('/////////////////  createGLPrograms  /////////////////');
        var function_arr = [];
        
        for(var id in programData){
            function_arr.push({fn: this.scene.createGLProgram, scope:this.scene, vars:[id, programData[id]] });
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    function createConnections(connectionData, callBackFn){
        for(var i=0; i<connectionData.length; i++){
            this.scene.createConnection(
                    connectionData[i].source.id,
                    connectionData[i].source.var || null,
                    connectionData[i].dest.id,
                    connectionData[i].dest.var || null,
                    connectionData[i].feedback || null
                );
        }
        if(callBackFn)callBackFn();
    }
    
    function createRenderTargets(targetData, callBackFn){
        // for(var i=0; i<targetData.length; i++){
        for(var i in targetData){
            this.scene.createRenderTarget(
                    i,
                    targetData[i]
                );
        }
        if(callBackFn)callBackFn();        
    }
    
    function destroy(){        
        this.arrayExecuter.destroy();
        
        this.scene = null;
        this.arrayExecuter = null;
        this.dependencies = null;
    }
    
    IO.prototype.loadData = loadData;
    IO.prototype.checkDependency = checkDependency;
    IO.prototype.loadDependencies = loadDependencies;
    IO.prototype.buildData = buildData;
    
    IO.prototype.destroy = destroy;
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.IO = IO;

}(window));

(function(window) {

    'use strict';
    

    var Scene = function (settingsJSON, parameters) {
        console.log('Scene');
        console.log(settingsJSON);
        
        if(parameters && parameters.canvas){
            this.canvas = parameters.canvas;
        } else {
            this.canvas = document.createElement('canvas');
        }
        
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        this.renderer = new Aero.Renderer(this);
        this.io = new Aero.IO(this);
        this.ready = false;
        
        this.onReady = (parameters && parameters.onReady)?parameters.onReady:null;
        
        this.nodes = {};
        this.connections = [];
        this.renderTargets = [];
        // this variable specifies whether the render list needs to be updated
        // set to true whenever there are changes in node connections
        this.needsUpdate = false; 
        
        this._idCount = 0;

        var function_arr =  [
                { fn: this.io.loadData, scope:this.io, vars: [settingsJSON] },
                { fn: dataReady },
                { fn: initRenderer },
                { fn: initComplete }
            ];
        
        this.arrayExecuter.execute(function_arr);
    }
    
    function dataReady(callbackFn){
        console.log('dataReady');
        var data = this.data;
        
        if(data["settings"]["dirPath"])this.dirPath = data["settings"]["dirPath"];
        this.data.library = this.data.library || {};
        
        // this.gl =  this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        var preserveDrawingBuffer = (this.data["settings"]["preserveDrawingBuffer"] && String(this.data["settings"]["preserveDrawingBuffer"]).toLowerCase() == "true")?true:false;
        this.gl =  this.canvas.getContext("webgl", {preserveDrawingBuffer: preserveDrawingBuffer}) 
                || this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: preserveDrawingBuffer});
        
        this.renderer.init();
        this.io.buildData(this.data, callbackFn);
        
    }
    
    function initRenderer(callbackFn){
        this.renderer.update(callbackFn);
    }
    
    function initComplete(){
        
        // set initial size        
        this.renderer.setSize(this.data["settings"]["dimensions"]["width"], this.data["settings"]["dimensions"]["height"]);
        
        // call initial render
        if(this.data["settings"]["autoRender"])this.renderer.start();
        
        this.ready = true;
        if(this.onReady)this.onReady();
    }
    
    function checkNodeId(id){
        if(this.nodes.hasOwnProperty(id)){
            console.log('ERROR: cannot have more than one node with id "'+id+'"');
            return false;
        }
        return true
    }
    
    function createTexture(id, textureData, callbackFn){
        if(!this.checkNodeId(id))return;
        
        var texObj = this.renderer.createTexture(textureData);
        
        // this.textures[id] = texObj;
        this.nodes[id] = texObj;
        texObj.id = id;
        
        texObj.load(callbackFn);
    }
        
    function deleteTexture(id){
        
    }
    
    function createJSProgram(id, obj, callbackFn){
        if(!this.checkNodeId(id))return;
        
        // if dependencies then load them first
        if(obj.dependencies && obj.dependencies.length){
            var filesToLoad = false;            
            for(var s=0; s<obj.dependencies.length; s++ )
                if( !this.io.checkDependency(obj.dependencies[s]) )
                    filesToLoad = true;
                
            if(filesToLoad){
                this.io.loadDependencies(obj.dependencies, function(){
                    this.createJSProgram(id, obj, callbackFn);
                }.bind(this));
                return;
            }
        }
            
        var progObj = new Aero.JSPrograms[obj.id](obj, this);
        
        // this.JSPrograms[id] = progObj;
        this.nodes[id] = progObj;
        progObj.id = id;
        progObj.type = "JSProgram";
        progObj.dependents = []; //this will contain nodes that rely on this node to run first
        if(progObj.init){
            progObj.init(callbackFn);
        } else {
            callbackFn();
        }
        if(!progObj.run)progObj.run = function(){};
        
    }    
    
    function deleteJSProgram(id){
        
    }
    
    function createGLProgram(id, obj, callbackFn){
        if(!this.checkNodeId(id))return;
                
        var progObj = new Aero.GLProgram(obj, this);
        
        // this.GLPrograms[id] = progObj;
        this.nodes[id] = progObj;
        progObj.id = id;
        progObj.dependents = []; //this will contain nodes that rely on this node to run first
        progObj.init(callbackFn);
    }
    
    function deleteGLProgram(id){
        
    }
    
    function createRenderTarget(id, settings){
        var sNodes = settings.nodes || [],
            _nodes = [];
        for(var i=0; i<sNodes.length; i++){
            if(this.nodes.hasOwnProperty(sNodes[i])){
                _nodes.push(sNodes[i]);
            }
        }
        this.renderTargets.push({
            "id": id,
            "size": settings.size || false,
            "mipmap": settings.mipmap,
            "nodes": _nodes
        })
    }
    
    function createConnection(sourceId, sourceVar, destId, destVar, feedback){
        // confirm the connection is valid
        if(!sourceId || !destId)return; // no id passed
        if(!this.nodes.hasOwnProperty(sourceId))return; // source doesn't exist
        if(!this.nodes.hasOwnProperty(destId) && String(destId).toLowerCase() != 'canvas')return; // dest doesn't exist
        
        // add to connections list
        this.connections.push({
            "id": this._idCount++,
            "feedback": feedback || false,
            "source": 
                {
                    "id": sourceId,
                    "var": sourceVar
                },
            "dest": 
                {
                    "id": destId,
                    "var": destVar
                }
        });
        
        this.needsUpdate = true;
    }
    
    function _returnConnectionIndex(connectionId){        
        for(var i=0; i<this.connections.length; i++)
            if(this.connections[i]['id'] == connectionId)
                return i;
        return -1;
    }
    
    function updateConnection(connectionId, dir, newId, newVar){
        var index = _returnConnectionIndex.call(this, connectionId);
        if(index >= 0){
            if(this.nodes.hasOwnProperty(newId) || String(newId).toLowerCase() == 'canvas' && dir == "source"){
                var connection = this.connections[index];
                connection[dir].id = newId;
                connection[dir].var = newVar || null;
                this.needsUpdate = true;
            }
        }
    }
    
    function deleteConnection(connectionId){
        var index = _returnConnectionIndex.call(this, connectionId);
        if(index >= 0){
            this.connections.splice(index, 1);
            this.needsUpdate = true;
        }
    }
    
    function connectionSearch(dir, id, connections){
        // this loops through all connections and returns all that have the
        // specified ID in the specified direction.  dir is either "source" or "dest"
        
        var results = [],
            connections = connections || this.connections; // you can pass a list of connections if you want
        for(var i=0; i<connections.length; i++){
            if(connections[i][dir]['id'].toLowerCase() == String(id).toLowerCase())results.push(connections[i]);
        }
        return results;
    }

    
    function destroy(){
        // need to destroy all nodes.
        for(var node in this.nodes){
            if(this.nodes[node].destroy)this.nodes[node].destroy();
        }
        
        this.nodes = null;
        
        this.arrayExecuter.destroy();
        this.renderer.destroy();
        this.io.destroy();
        
        this.arrayExecuter = null;
        this.renderer = null;
        this.io = null;
        
        this.onReady = null;
        this.canvas = null;
        this.data = null;
        
        this.gl = null;
    }
    

    Scene.prototype.checkNodeId = checkNodeId;
    Scene.prototype.createTexture = createTexture;
    Scene.prototype.createJSProgram = createJSProgram;
    Scene.prototype.createGLProgram = createGLProgram;  
    Scene.prototype.createRenderTarget = createRenderTarget;
    Scene.prototype.createConnection = createConnection;  
    Scene.prototype.updateConnection = updateConnection;  
    Scene.prototype.connectionSearch = connectionSearch;
    Scene.prototype.destroy = destroy;
    
    // convenience functions
    
    Scene.prototype.render = function(){
        this.renderer.render();
    }


    // add section to Aero namespace
    Aero = Aero || {};
    Aero.Scene = Scene;

}(window));
