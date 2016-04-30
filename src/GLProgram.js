

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
                clearBuffer: true,
                renderMode: "TRIANGLE_STRIP"
            };
        
        // add passed in settings
        for(var _set in _settings) this.settings[_set] = _settings[_set];

        this.drawToCanvas = false;
        this.clearBuffer = (String(this.settings.clearBuffer).toLowerCase() == "true")?true:false;
        
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
            if(!u_loc)continue; // uniform isn't in shader or isn't being used by shader
            
            u_val = uniObj.val || null;

            switch(uniObj.type){
                case "f":
                case "1f":
                    u_fn = Aero.GLUploaders.uniform1f;
                    if(!u_val)u_val = 0;
                    break;                    
                case "1fv":
                    u_fn = Aero.GLUploaders.uniform1fv;
                    if(!u_val)u_val = 0;
                    break;
                case "1i":
                    u_fn = Aero.GLUploaders.uniform1i;
                    if(!u_val)u_val = 0;
                    break;
                case "1iv":
                    u_fn = Aero.GLUploaders.uniform1iv;
                    if(!u_val)u_val = 0;
                    break;

                case "2f":
                    u_fn = Aero.GLUploaders.uniform2f;
                    if(!u_val)u_val = [0,0];
                    break;                    
                case "2fv":
                    u_fn = Aero.GLUploaders.uniform2fv;
                    if(!u_val)u_val = [0,0];
                    break;
                case "2i":
                    u_fn = Aero.GLUploaders.uniform2i;
                    if(!u_val)u_val = [0,0];
                    break;
                case "2iv":
                    u_fn = Aero.GLUploaders.uniform2iv;
                    if(!u_val)u_val = [0,0];
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
                    if(!u_val)u_val = 0;
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
