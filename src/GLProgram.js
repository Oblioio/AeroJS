(function(window) {

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

}(window));
