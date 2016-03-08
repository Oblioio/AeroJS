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
        this.tex_type = (this.cube)?gl.TEXTURE_CUBE_MAP:gl.TEXTURE_2D;
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
        
        var sidesLoaded = 0;
        function sideloaded(){ 
            sidesLoaded++;
            if(sidesLoaded == 6)completeFn();
        };
        
        if(this.cube){
            this.srcObj = [];
            
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
        gl.bindTexture(this.tex_type, texture );
        
        //save image dimensions
        this.width = this.srcObj.width;
        this.height = this.srcObj.height;     
                
        //flip the Y coord
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.settings.flipY);
        
        // Set the parameters so we can render any size image.
        // gl.texParameteri(this.tex_type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(this.tex_type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(this.tex_type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(this.tex_type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(this.tex_type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(this.tex_type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        
        if(!this.cube){
            // Upload the image into the texture.
            gl.texImage2D(this.tex_type, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.srcObj);
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