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

    var GLProgram = function (_settings, _scene) {
        // console.log('GLProgram');
        
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        
        this.type = "GLProgram";
        this.inRenderList = false;

        this.scene = _scene;
        this.settings = _settings;

        this.gl =  this.scene.gl;
        this.drawToCanvas = false;
        this.clearBuffer = (String(_settings.clearBuffer).toLowerCase() == "true")?true:false;
        console.log('this.clearBuffer: '+this.clearBuffer );
        
        //shaders
        this.vShader = {
            path: this.settings["vertexShader"].replace('~/', this.scene.dirPath)
        }

        this.fShader = {
            path: this.settings["fragmentShader"].replace('~/', this.scene.dirPath)
        }
    }

    function init(callBackFn){

        var function_arr =  [
                // { fn: bind(loadJSON, this), vars: settingsJSON },
                { fn: bind(loadShader, this), vars: 'vShader' },
                { fn: bind(loadShader, this), vars: 'fShader' },
                // { fn: bind(loadTextures, this), vars: null },
                { fn: bind(createProgram, this), vars: null },
                { fn: bind(setupUniforms, this), vars: null },
                { fn: callBackFn, vars: null }
            ];

        this.arrayExecuter.execute(function_arr);

    }

    function loadShader(type){
        console.log('loadShader: '+this[type].path);
        
        Aero.utils.XHRLoader(this[type].path, bind(function (data){
                this[type].text = data;
                this.arrayExecuter.stepComplete();
            }, this) );
        
    }

    function createProgram(){
        console.log('createProgram');

        var gl = this.gl;

        //create fragment shader
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fShader.text);
        gl.compileShader(fragmentShader);
        if(!checkCompile.call(this, gl, "2d-fragment-shader", fragmentShader))return;
        this.fShader.obj = fragmentShader;

        //create vertex shader
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vShader.text);
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

        this.arrayExecuter.stepComplete();
    }

    function setupUniforms(){
        var gl = this.gl,
            uniformSettings = this.settings.uniforms,
            uniObj,
            u_loc,
            u_val,
            u_fn,
            u_apply;

        this.uniforms = [];
        this.inputs = {};
        // this.uniforms = {};
        // this.uniformsList = [];
        for(var u in uniformSettings){
            uniObj = uniformSettings[u];
            u_loc = gl.getUniformLocation(this.program, u);
            // console.log('u_loc: '+u+' | '+u_loc);
            u_val = uniObj.val;

            switch(uniObj.type){
                case "f":
                case "1f":
                    u_fn = Aero.GLUploaders.uniform1f;
                    break;
                // case "1fv":
                //     u_fn = Aero.GLUploaders.uniform1fv;
                //     break;
                // case "1i":
                //     u_fn = Aero.GLUploaders.uniform1i;
                //     break;
                // case "1iv":
                //     u_fn = Aero.GLUploaders.uniform1iv;
                //     break;

                case "2f":
                    u_fn = Aero.GLUploaders.uniform2f;
                    break;
                // case "2fv":
                //     u_fn = Aero.GLUploaders.uniform2fv;
                //     break;
                // case "2i":
                //     u_fn = Aero.GLUploaders.uniform2i;
                //     break;
                // case "2iv":
                //     u_fn = Aero.GLUploaders.uniform2iv;
                //     break;

                case "3f":
                    u_fn = Aero.GLUploaders.uniform3f;
                    break;
                case "3m":
                    u_fn = Aero.GLUploaders.uniformMatrix3fv;
                    break;
                    
                case "4f":
                    u_fn = Aero.GLUploaders.uniform4f;
                    break;
                case "4m":
                    u_fn = Aero.GLUploaders.uniformMatrix4fv;
                    break;
                    
                case "t":
                    u_fn = Aero.GLUploaders.uniform1i;
                    break;

                default:
                    console.log("uniform type: "+uniObj.type+" not yet setup");
                    u_fn = false;
            }

            this.inputs[u] = u_val;
            this.uniforms.push({
                id: u,
                type: uniObj.type,
                loc: u_loc,
                // val: u_val,
                fn: u_fn
            });

            // var u_settings = {
            //     id: u,
            //     type: uniObj.type,
            //     loc: u_loc,
            //     val: u_val,
            //     fn: u_fn
            // };
            // this.uniforms[u] = u_settings;
            // this.uniformsList.push(u);
        }

        this.arrayExecuter.stepComplete();
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

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    GLProgram.prototype.init = init;
    GLProgram.prototype.updateUniforms = updateUniforms;
    GLProgram.prototype.render = render;

    // add section to Aero namespace
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

    function bind(fn, scope){
        return function() {
            return fn.apply(scope, arguments);
        }
    }

}(window));

(function(window) {

    'use strict';

    
    var GLTexture = function (_settings, _scene) {
        var gl = _scene.gl,
            texture = gl.createTexture();
        
        // console.log('GLTexture');
        this.type = "texture";
        this.inRenderList = false;
        
        this.scene = _scene;
        this.settings = _settings;
        this.imgURL = (_settings.imgURL)?_settings.imgURL.replace('~/', this.scene.dirPath):null;
        this.texUnit = _settings.texUnit;
        console.log('GLTexture Init: '+this.texUnit);
                
        this.gl =  gl;
                    
        this.texture = texture;
        gl.activeTexture(gl["TEXTURE"+this.texUnit]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        //flip the Y coord
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    
    function loadTexture(callbackFN){
        this.onLoadComplete = (callbackFN)?callbackFN:null;    
        
        if(!this.imgURL){
            console.log('loadTexture ERROR: no image url');
            this.onLoadComplete();
            this.onLoadComplete = null;
        }
        
        console.log('loadTexture: '+this.imgURL);
        
        this.imgObj = new Image();
        
        this.imgObj.onload = bind(textureLoaded, this);
        
        this.imgObj.src = this.imgURL;
    }
    
    function textureLoaded(){
        var gl = this.gl,
            texture = this.texture;
        
        gl.activeTexture(gl["TEXTURE"+this.texUnit]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        //save image dimensions
        this.width = this.imgObj.width;
        this.height = this.imgObj.height;        
        
        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.imgObj);
        
        if (this.onLoadComplete){
            this.onLoadComplete();
            this.onLoadComplete = null;
        }
    }
        
    GLTexture.prototype.loadTexture = loadTexture;
    
    // add section to Aero namespace
    Aero.GLTexture = GLTexture;
    
    
    
/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////

UTILITY FUNCTIONS

*/ //////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
    function bind(fn, scope){
        return function() {
            return fn.apply(scope, arguments);
        }
    }
   
}(window));
(function(window) {

    'use strict';

    var GLUploaders = function (_settings, _scene) {

    }

    GLUploaders.prototype.uniform1f = function(gl, u_loc, u_val){
        gl.uniform1f(u_loc, u_val);
    };

    GLUploaders.prototype.uniform2f = function(gl, u_loc, u_val){
        gl.uniform2f(u_loc, u_val[0], u_val[1]);
    };

    GLUploaders.prototype.uniform3f = function(gl, u_loc, u_val){
        gl.uniform3f(u_loc, u_val[0], u_val[1], u_val[2]);
    };
    
    GLUploaders.prototype.uniform4f = function(gl, u_loc, u_val){
        gl.uniform4f(u_loc, u_val[0], u_val[1], u_val[2], u_val[3]);
    };

    GLUploaders.prototype.uniform1i = function(gl, u_loc, u_val){
        gl.uniform1i(u_loc, u_val);
    }

    GLUploaders.prototype.uniform2i = function(gl, u_loc, u_val){
        gl.uniform2i(u_loc, u_val);
    }

    GLUploaders.prototype.uniform3i = function(gl, u_loc, u_val){
        gl.uniform3i(u_loc, u_val);
    }
    
    GLUploaders.prototype.uniform4i = function(gl, u_loc, u_val){
        gl.uniform3i(u_loc, u_val);
    }

    GLUploaders.prototype.uniformMatrix2fv = function(gl, u_loc, u_val){
        gl.uniformMatrix2fv(u_loc, gl.FALSE, u_val);
    }

    GLUploaders.prototype.uniformMatrix3fv = function(gl, u_loc, u_val){
        gl.uniformMatrix3fv(u_loc, gl.FALSE, u_val);
    }

    GLUploaders.prototype.uniformMatrix4fv = function(gl, u_loc, u_val){
        gl.uniformMatrix4fv(u_loc, gl.FALSE, u_val);
    }

    // add section to Aero namespace
    Aero.GLUploaders = new GLUploaders();


}(window));

(function(window) {

    'use strict';
    
    var JSProgram = function (_settings, _scene) {
        // console.log('JSProgram');
        
        this.program = getObject(_settings.js);
        
        // load json object (not this version)
        // check if js object already exists
        // if not, attach script
        // wait for script to attach
        
        
        this.type = "JSProgram";
        this.inRenderList = false;
        
        this.scene = _scene;
        this.settings = _settings;
        
        this.gl =  this.scene.gl;
        this.drawToCanvas = false;
        this.outputs = [];
        
    }
    
    function init(){
        
        // var function_arr =  [
                // { fn: bind(loadJSON, this), vars: settingsJSON },
                // { fn: bind(loadTextures, this), vars: null },
                // { fn: bind(createProgram, this), vars: null },
                // { fn: bind(setupUniforms, this), vars: null }
            // ];
        
        // arrayExecuter.execute(function_arr);
        
    }
    
    JSProgram.prototype.init = init;
    
    // add section to Aero namespace
    Aero.JSProgram = JSProgram;
    
    
/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////

UTILITY FUNCTIONS

*/ //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    
    
    function bind(fn, scope){
        return function() {
            return fn.apply(scope, arguments);
        }
    }
    
    function getObject(str){
        var chain = str.split("."),
            obj = window[chain[0]],
            c;
            
        for(c=1; c<chain.length; c++){
            obj = obj[chain[c]];
        }
        return obj;
    }
   
}(window));
(function(window) {

    'use strict';

    var Scene = function (settingsJSON, parameters) {
        console.log('Scene');
        
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        this.stepComplete = bind(this.arrayExecuter.stepComplete, this.arrayExecuter);
        
        this.dirPath = (settingsJSON.indexOf("/") >= 0)?settingsJSON.substring(0, settingsJSON.lastIndexOf("/")+1):"";

        if(parameters && parameters.canvas){
            this.canvas = parameters.canvas;
        } else {
            this.canvas = document.createElement('canvas');
        }
        this.nodes = {};

        var function_arr =  [
                { fn: bind(loadJSON, this), vars: settingsJSON },
                { fn: bind(createTextures, this), vars: null },
                { fn: bind(createJSPrograms, this), vars: null },
                { fn: bind(createGLPrograms, this), vars: null },
                { fn: bind(createRenderList, this), vars: null },
                { fn: bind(createFrameBuffers, this), vars: null },
                { fn: bind(initVertexBuffers, this), vars: null },
                { fn: bind(drawNodes, this), vars: null }
            ];

        this.arrayExecuter.execute(function_arr);
    }

    function loadJSON(url){
        console.log('loadJSON');
        
        Aero.utils.XHRLoader(url, bind(JSONLoaded, this));
    }

    function JSONLoaded(data){
        console.log('JSONLoaded');
        var currObj;
        data = JSON.parse(data);
        this.data = data;

        //size the canvas
        this.canvas.width = data["output"]["dimensions"]["width"]
        this.canvas.height = data["output"]["dimensions"]["height"];
        // this.gl =  this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        var preserveDrawingBuffer = (data["output"]["preserveDrawingBuffer"] && String(data["output"]["preserveDrawingBuffer"]).toLowerCase() == "true")?true:false;
        this.gl =  this.canvas.getContext("webgl", {
           preserveDrawingBuffer: preserveDrawingBuffer
        }) || this.canvas.getContext("experimental-webgl", {
           preserveDrawingBuffer: preserveDrawingBuffer
        });

        // this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        // this.gl.clear();

        //setup GL parameters
        this.maxTextureUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.nextTexUnit = 0;

        this.arrayExecuter.stepComplete();
    }

    function nodeIsTaken(id){
        console.log('ERROR: cannot have more than one node with id "'+id+'"');
    }

    function getNextTexUnit(){
        var texUnit = this.nextTexUnit;
        if(texUnit >= this.maxTextureUnits)
            console.log("ERROR: TexUnit "+texUnit+" | Only "+this.maxTextureUnits+" are supported.");
        this.nextTexUnit++;
        return texUnit;
    }

    function createTextures(){
        console.log('/////////////////  createTextures  /////////////////');
        var textureData = this.data["textures"],
            function_arr =  [];

        this.createTexture = bind(createTexture, this);

        this.textures = {};
        for(var t in textureData){
            if(this.nodes.hasOwnProperty(t)){
                nodeIsTaken(t);
                return;
            }

            var texObj = this.createTexture(textureData[t]);
            this.textures[t] = texObj;
            this.nodes[t] = texObj;
            texObj.id = t;

            function_arr.push({ fn: bind(texObj.loadTexture, texObj), vars: [this.stepComplete] });
        }

        this.arrayExecuter.execute(function_arr);
    }

    function createTexture(textureData){
        return new Aero.GLTexture({
            imgURL: textureData,
            texUnit: this.getNextTexUnit()
        }, this);
    }

    function createJSPrograms(){
        console.log('/////////////////  createJSPrograms  /////////////////');
        // var programData = this.data["jsPrograms"] || this.data["JSPrograms"],
        var programData = this.data["jsPrograms"] || this.data["JSPrograms"],
            function_arr =  [],
            scriptsAttached = [],
            dependencies = [];

        this.createNextJSProgram = bind(createNextJSProgram, this);

        //programs
        this.JSPrograms = {};
        for(var p in programData){
            if(this.nodes.hasOwnProperty(p)){
                nodeIsTaken(p);
                return;
            }

            // if JSProgram does not exist, attach the script
            if (!Aero.JSPrograms[programData[p].id]){
                var jsPath = programData[p].js.replace('~/', this.dirPath);

                var tag = document.createElement('script');
                tag.type = 'text/javascript';
                tag.src = jsPath;
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(tag, s);
            }

            // check dependencies
            var s, d, exists;
            if(programData[p].dependencies && programData[p].dependencies.length){
                for(s=0; s<programData[p].dependencies.length; s++ ){
                    exists = false;
                    programData[p].dependencies[s] = programData[p].dependencies[s].replace('~/', this.dirPath);
                    for(d=0; d<dependencies.length; d++)
                        if(programData[p].dependencies[s] == dependencies[d])
                            exists = true;
                    if(!exists){
                        dependencies.push(programData[p].dependencies[s]);
                        function_arr.push({ fn: add_script, vars: [programData[p].dependencies[s], this.stepComplete] });
                    }
                }
            }

            this.JSPrograms[p] = {data: programData[p], obj:false};

            function_arr.push({ fn: this.createNextJSProgram, vars: String(''+p) });
        }

        this.arrayExecuter.execute(function_arr);
    }

    // pulled from https://software.intel.com/en-us/blogs/2010/05/22/dynamically-load-javascript-with-load-completion-notification
    function add_script(scriptURL, onloadCB) {
      var scriptEl    = document.createElement("script");
      scriptEl.type   = "text/javascript";
      scriptEl.src    = scriptURL;

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


    function createNextJSProgram(id){
        console.log('createNextJSProgram: '+id);

        if (!Aero.JSPrograms[this.JSPrograms[id].data.id]){
            // the JS Program has not been attached yet
            window.requestAnimationFrame(bind(function(){
                this.createNextJSProgram(id);
            }, this));
            return
        } else {
            var progObj = new Aero.JSPrograms[this.JSPrograms[id].data.id](this.JSPrograms[id].data, this);
            this.JSPrograms[id] = progObj;
            this.nodes[id] = progObj;
            progObj.id = id;
            progObj.type = "JSProgram";
            progObj.dependents = []; //this will contain nodes that rely on this node to run first
            if(progObj.init){
                progObj.init(this.stepComplete);
            } else {
                this.arrayExecuter.stepComplete();
            }
            if(!progObj.run)progObj.run = function(){};
        }

    }

    function createGLPrograms(){
        console.log('/////////////////  createGLPrograms  /////////////////');
        var programData = this.data["glPrograms"] || this.data["GLPrograms"],
            function_arr =  [];

        //programs
        this.GLPrograms = {};
        for(var p in programData){
            if(this.nodes.hasOwnProperty(p)){
                nodeIsTaken(p);
                return;
            }
            var progObj = new Aero.GLProgram(programData[p], this);
            this.GLPrograms[p] = progObj;
            this.nodes[p] = progObj;
            progObj.id = p;
            progObj.dependents = []; //this will contain nodes that rely on this node to run first
            function_arr.push({ fn: bind(progObj.init, progObj), vars: [this.stepComplete] });
        }

        this.arrayExecuter.execute(function_arr);
    }

    function createRenderList(){
        console.log('/////////////////  createRenderList  /////////////////');
        // figure out the render chains.
        // the idea is to track back from any canvas renders
        // the order doesn't have to be exact order, but all
        // dependencies must be figured out

        var connections = this.data["connections"],
            nodesToCheck = connectionSearch(connections, 'dest', 'canvas'), //initial connections to check
            connectedNodes = [],
            currConnection,
            currNode,
            sourceConnections,
            destConnections,
            connectedNode,
            connectedIndex,
            lowestIndex,
            highestIndex,
            s, d;

        // console.log('set the nodes to draw to canvas');
        //set the nodes to draw to canvas
        for(r=0; r<nodesToCheck.length; r++){
            connectedNode = getConnectedNode.call(this, nodesToCheck[r], 'source');
            connectedNode.drawToCanvas = true;
        }

        this.renderList = [];

        // Everytime I check a node I will add it to the render list
        // I check what dependencies it has, and what othe nodes depend on it
        // Check the index of all nodes that depends on this node and remember the lowest value
        // Check the index of all nodes it depends on and remember the highest value
        // place it on the render at the highest value that meets both requirements

        // finally add any nodes that depend on the current node to the beginning of the toCheck array

        // console.log('this will loop as long as there more connections to add');
        //this will loop as long as there more connections to add
        while(nodesToCheck.length){
            // console.log('loop begin: '+nodesToCheck.length);
            currConnection = nodesToCheck.shift(); //get first connection in list
            lowestIndex = highestIndex = false; //reset vars

            // console.log('currNode');
            // console.log(currConnection);
            currNode = getConnectedNode.call(this, currConnection, 'source');
            console.log('checking node: '+currNode.id);
            if(currNode.inRenderList)continue; // keeps a node from ever being added twice
            currNode.inRenderList = true;

            // connections where the current node is the source
            sourceConnections = connectionSearch(connections, 'source', currConnection['source']['id']);

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
            destConnections = connectionSearch(connections, 'dest', currConnection['source']['id']);

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

            console.log('adding: '+currNode.id+", highestIndex: "+highestIndex+", lowestIndex: "+lowestIndex);

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

        this.arrayExecuter.stepComplete();
    }

    function connectionSearch(connections, dir, id){
        // this loops through all connections and returns all that have the
        // specified ID in the specified direction.  dir is either source or dest

        // console.log("connectionSearch: "+dir+" : "+id);
        var results = [];
        for(var i=0; i<connections.length; i++){
            if(connections[i][dir]['id'].toLowerCase() == String(id).toLowerCase())results.push(connections[i]);
        }
        return results;
    }

    function getConnectedNode(connection, dir){
        var containerObj = false,
            nodeObj = false;

        containerObj = this.nodes;

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

    function createFrameBuffers(){
        console.log('/////////////////  createFrameBuffers  /////////////////');
        this.frameBuffers = [];

        var currBuffer,
            currNode,
            connectedNode,
            connectedIndex,
            r, o;

        // loop through frame buffers defined in JSON, if any
        // create buffer for each object and assign it to node

        if(this.data["frameBuffers"]){
            for(var r in this.data["frameBuffers"]){
                var buffObj = this.data["frameBuffers"][r];
                if(buffObj["nodes"] && buffObj["nodes"].length){
                    currBuffer = getNextFrameBuffer.call(this, 0);
                    currBuffer.holdForever = true;
                    for(o=0; o<buffObj["nodes"].length; o++){
                        currNode = this.nodes[buffObj["nodes"][o]];
                        if(!currNode){
                            console.log('Could not assign frame buffer "'+r+'" to node "'+buffObj["nodes"][o]+'" because it does not exist');
                            continue;
                        }
                        currNode.forcedBuffer = currBuffer;
                    }
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
            if( currNode.type == "texture") continue;
            if( currNode.type == "JSProgram" && !currNode.draws) continue;
            if( currNode.drawToCanvas) continue;
            if( !currNode.dependents || !currNode.dependents.length) continue;

            if(currNode.forcedBuffer){
                // buffer was assigned in JSON created above
                currBuffer = currNode.forcedBuffer;
                currNode.forcedBuffer = null; // no longer need it
            } else {
                currBuffer = getNextFrameBuffer.call(this, r);
            }
            
            currNode.outputs = currNode.outputs || {};
            currNode.outputs.texUnit = currBuffer.texUnit;
            
            // console.log(currNode.id+' draws to frame buffer: '+currBuffer.texUnit);

            for(o=0; o<currNode.dependents.length; o++){
                // getRenderListIndex(this.renderList, connectedNode);
                // connectedNode = this.GLPrograms[currNode.dependents[o].id];
                connectedNode = this.nodes[currNode.dependents[o].id];
                
                // if(connectedNode.type == "GLProgram")connectedNode.setUniform(currNode.dependents[o].var, currBuffer.texUnit); //set the texture unit index
                if(connectedNode.type == "GLProgram")
                    connectedNode.inputs[currNode.dependents[o].destVar] = currBuffer.texUnit; //set the texture unit index
                    
                connectedIndex = getRenderListIndex(this.renderList, connectedNode);
                currBuffer.holdIndex = Math.max(connectedIndex, currBuffer.holdIndex);
            }

            currNode.outputBuffer = currBuffer.index;
        }

        this.arrayExecuter.stepComplete();
    }

    function getNextFrameBuffer(r){

        // check if any current frame buffers are available
        // if one is available return it

        for(var b=0; b<this.frameBuffers.length; b++){
            // the buffer is available if the current index is greater than the holdIndex
            if(!this.frameBuffers[b].holdForever && this.frameBuffers[b].holdIndex < r){
                return this.frameBuffers[b];
            }
        }

        // if we got here then none were available
        // so we're gonna create a new one
        var bufferObject = createFrameBuffer.call(this);

        bufferObject.index = this.frameBuffers.length;
        bufferObject.holdIndex = 0;

        this.frameBuffers.push(bufferObject);

        return bufferObject;
    }

    function createFrameBuffer(){
        var gl = this.gl,
            rttFramebuffer,
            rttTexture,
            renderbuffer = gl.createRenderbuffer(),
            bufferWidth = this.canvas.width,
            bufferHeight = this.canvas.height,
            texUnit = this.getNextTexUnit();

        console.log('createFrameBuffer: texUnit '+texUnit);

        // create frame buffer
        rttFramebuffer = gl.createFramebuffer();
        gl.activeTexture(gl["TEXTURE"+texUnit]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

        // create texture
        rttTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        // gl.generateMipmap(gl.TEXTURE_2D);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // create depth buffer, not sure we need this actually
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, bufferWidth, bufferHeight);

        // attach texture and depth buffer to frame buffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        // unbind the texture and buffers
        // gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {
            frameBuffer: rttFramebuffer,
            texture: rttTexture,
            renderBuffer: renderbuffer,
            width: bufferWidth,
            height: bufferHeight,
            texUnit: texUnit
        }
    }

    function initVertexBuffers(){
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

        this.arrayExecuter.stepComplete();
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

    function createCustomVertexBuffer(data, attributes){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;

        // Create the buffer object
        var newBuffer = gl.createBuffer();
        if (!newBuffer) {
          console.log('Failed to create the buffer object');
          return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, newBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

        return {
            buffer: newBuffer,
            length: data.length,
            data: data,
            fsize: data.BYTES_PER_ELEMENT,
            attributes: attributes
        };
    }

    function updateCustomVertexBuffer(bufferObj){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;
        // bind buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.buffer);
        // buffer data (maybe should use glBufferSubData instead?);
        if(bufferObj.data.length > bufferObj.length){
            bufferObj.length = bufferObj.data.length;
            gl.bufferData(gl.ARRAY_BUFFER, bufferObj.data, gl.DYNAMIC_DRAW);
        } else {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, bufferObj.data);
        }
    }

    function useCustomVertexBuffer(bufferObj){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;

        // bind buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.buffer);

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

    function drawNodes(){

        var gl = this.gl,
            nodeObj,
            d;

        for(var p=0; p<this.renderList.length; p++){
            nodeObj = this.renderList[p];

            switch(nodeObj.type){
                case "GLProgram":
                    // console.log('program: '+nodeObj.id);
                    if(nodeObj.drawToCanvas){
                        // console.log(nodeObj.id+' draw to canvas!');
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    } else {
                        // console.log('bind buffer: '+nodeObj.outputBuffer);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[nodeObj.outputBuffer].frameBuffer);
                        if(nodeObj.clearBuffer)
                            gl.clear(gl.COLOR_BUFFER_BIT);
                    }

                    //attach program
                    gl.useProgram(nodeObj.program);
                    gl.program = nodeObj.program;

                    //update vertex attrib
                    if(!this.usingStandardVertexBuffer){
                        this.useStandardVertexBuffer(this);
                    }


                    //update uniforms
                    nodeObj.updateUniforms();

                    //draw
                    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw the rectangle

                    nodeObj.render();

                    break;
                case "JSProgram":;
                    if(nodeObj.draws){
                        if(!nodeObj.drawToCanvas){
                            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[nodeObj.outputBuffer].frameBuffer);
                            if(nodeObj.clearBuffer)
                                gl.clear(gl.COLOR_BUFFER_BIT);
                        } else {
                            // console.log(nodeObj.id+' draw to canvas!');
                            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        }
                    }
                    // run program
                    nodeObj.run();

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

        window.requestAnimationFrame(bind(drawNodes, this));
    }

    Scene.prototype.draw = drawNodes;
    Scene.prototype.getNextTexUnit = getNextTexUnit;
    Scene.prototype.useStandardVertexBuffer = useStandardVertexBuffer;
    Scene.prototype.useCustomVertexBuffer = useCustomVertexBuffer;
    Scene.prototype.createCustomVertexBuffer = createCustomVertexBuffer;
    Scene.prototype.updateCustomVertexBuffer = updateCustomVertexBuffer;



    // add section to Aero namespace
    Aero.Scene = Scene;

/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////

UTILITY FUNCTIONS

*/ //////////////////////////////////////////////////////////////////////////////////////////////////////////////


    function bind(fn, scope){
        return function() {
            return fn.apply(scope, arguments);
        }
    }

}(window));
