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