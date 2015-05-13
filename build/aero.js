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

;define([
    'jquery',
    'FLOCK/app/GLUploaders',
    'FLOCK/utils/ArrayExecuter'
], function ($) {

    'use strict';

    var arrayExecuter = FLOCK.utils.ArrayExecuter;

    var GLProgram = function (_settings, _scene) {
        // console.log('GLProgram');

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

    function init(){

        var function_arr =  [
                // { fn: bind(loadJSON, this), vars: settingsJSON },
                { fn: bind(loadShader, this), vars: 'vShader' },
                { fn: bind(loadShader, this), vars: 'fShader' },
                // { fn: bind(loadTextures, this), vars: null },
                { fn: bind(createProgram, this), vars: null },
                { fn: bind(setupUniforms, this), vars: null }
            ];

        arrayExecuter.execute(function_arr);

    }

    function loadShader(type){
        console.log('loadShader: '+this[type].path);

        $.ajax({
            dataType: "text",
            url: this[type].path,
            success: bind(function (data){
                this[type].text = data;
                arrayExecuter.stepComplete();
            }, this)
        });
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

        arrayExecuter.stepComplete();
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
                    u_fn = FLOCK.app.GLUploaders.uniform1f;
                    break;
                // case "1fv":
                //     u_fn = FLOCK.app.GLUploaders.uniform1fv;
                //     break;
                // case "1i":
                //     u_fn = FLOCK.app.GLUploaders.uniform1i;
                //     break;
                // case "1iv":
                //     u_fn = FLOCK.app.GLUploaders.uniform1iv;
                //     break;

                case "2f":
                    u_fn = FLOCK.app.GLUploaders.uniform2f;
                    break;
                // case "2fv":
                //     u_fn = FLOCK.app.GLUploaders.uniform2fv;
                //     break;
                // case "2i":
                //     u_fn = FLOCK.app.GLUploaders.uniform2i;
                //     break;
                // case "2iv":
                //     u_fn = FLOCK.app.GLUploaders.uniform2iv;
                //     break;

                case "3f":
                    u_fn = FLOCK.app.GLUploaders.uniform3f;
                    break;
                case "3m":
                    u_fn = FLOCK.app.GLUploaders.uniformMatrix3fv;
                    break;
                    
                case "4f":
                    u_fn = FLOCK.app.GLUploaders.uniform4f;
                    break;
                case "4m":
                    u_fn = FLOCK.app.GLUploaders.uniformMatrix4fv;
                    break;
                    
                case "t":
                    u_fn = FLOCK.app.GLUploaders.uniform1i;
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

        arrayExecuter.stepComplete();
    }

    function updateUniforms(){

        var gl = this.gl,
            u = this.uniforms.length,
            uObj;

        while(u--){
            uObj = this.uniforms[u];
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

    // add section to FLOCK namespace
    FLOCK.app = FLOCK.app || {};
    FLOCK.app.GLProgram = GLProgram;



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

});

;define([
    'jquery',
    'FLOCK/app/GLUploaders',
    'FLOCK/utils/ArrayExecuter'
], function ($) {

    'use strict';

    var arrayExecuter = FLOCK.utils.ArrayExecuter;
    
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
        // arrayExecuter.stepComplete();
    }
        
    GLTexture.prototype.loadTexture = loadTexture;
    
    // add section to FLOCK namespace
    FLOCK.app = FLOCK.app || {};
    FLOCK.app.GLTexture = GLTexture;
    
    
    
/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////

UTILITY FUNCTIONS

*/ //////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
    function bind(fn, scope){
        return function() {
            return fn.apply(scope, arguments);
        }
    }
    
});
;define([
    'jquery'
], function ($) {

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

    // add section to FLOCK namespace
    FLOCK.app = FLOCK.app || {};
    FLOCK.app.GLUploaders = new GLUploaders();


});

;define([
    'jquery',
    'FLOCK/utils/ArrayExecuter'
], function ($) {

    'use strict';

    var arrayExecuter = FLOCK.utils.ArrayExecuter;
    
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
        
        var function_arr =  [
                // { fn: bind(loadJSON, this), vars: settingsJSON },
                // { fn: bind(loadTextures, this), vars: null },
                // { fn: bind(createProgram, this), vars: null },
                // { fn: bind(setupUniforms, this), vars: null }
            ];
        
        arrayExecuter.execute(function_arr);
        
    }
    
    JSProgram.prototype.init = init;
    
    // add section to FLOCK namespace
    FLOCK.app = FLOCK.app || {};
    FLOCK.app.JSProgram = JSProgram;
    
    
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
    
});
// UMD (Universal Module Definition) patterns for JavaScript modules that work everywhere.
// https://github.com/umdjs/umd/blob/master/amdWebGlobal.js

;(function (root, factory) {
    // Browser globals
    root.utils = root.utils || {};

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.utils.ArrayExecuter = factory());
        });
    } else {
        
        root.utils.ArrayExecuter = factory();
    }
}(window.FLOCK = window.FLOCK || {}, function () {

    /*
    --------------------------------------------------------------------------------------------------------------------
    arrayExecuter
    --------------------------------------------------------------------------------------------------------------------
    */  

    var task_arr = [],
        currTask = 0,
        arrayExecuter = {
            //Exectutes an array of functions
            //If this is called and another array is currently executing, then
            //the new set of functions will run before finishing the previous set
            execute: function (arr) {
                arr.reverse();

                for (var i = 0; i < arr.length; i++) {
                    if (arr[i]) {
                        task_arr.unshift(arr[i]);
                    }
                }

                this.runStep('');
            },
            tackOn: function (arr) {
                for (var i=0; i<arr.length; i++) {
                    task_arr.push(arr[i]);
                }
                
                // trace('///// arrayExecuter_tackOn: length: '+task_arr.length+' /////');
                
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

                if (task_arr.length == 0)return;
                
                var step = task_arr.shift();
                var funct = step.fn;

                step.scope = step.scope || this;
                step.vars = (step.vars !== undefined)?step.vars:[];
                
                if (typeof step.vars === "string" || typeof step.vars === "number") {
                    step.vars = [step.vars];
                }
                
                funct.apply(step.scope, step.vars);
            },
            stepComplete: function (args) {
                var that = this;
                // trace('///// arrayExecuter: stepComplete /////');

                if (task_arr.length > 0) {
                    // setTimeout(function(){
                    //     that.runStep();
                    // }, 60);
                    window.requestAnimationFrame(that.runStep);
                }
            },
            stepComplete_instant: function (args) {
                // trace('///// arrayExecuter: stepComplete_instant /////');

                if (task_arr.length > 0) {
                    this.runStep();
                }
            },
            clearArrayExecuter: function () {
                task_arr = [];
            }
        }


    return arrayExecuter;
}));