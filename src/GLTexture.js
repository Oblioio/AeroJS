(function(window) {

    'use strict';

    
    var GLTexture = function (_settings, _scene) {
        var gl = _scene.gl;
        
        // console.log('GLTexture');
        this.type = "texture";
        this.inRenderList = false;
        
        this.scene = _scene;
        this.settings = _settings;
        this.src = (_settings.src)?_settings.src:null;
        this.cube = (_settings.src && _settings.src.constructor === Array )?true:false;
        this.type = (this.cube)?gl.TEXTURE_CUBE_MAP:gl.TEXTURE_2D;
        this.srcObj = (typeof this.src == "object")?this.src:null;
        this.texUnit = _settings.texUnit;
        
        console.log('GLTexture Init: '+this.texUnit);
                    
        this.texture =  gl.createTexture();        
    }
    
    function loadTexture(callbackFN){
        this.onLoadComplete = (callbackFN)?callbackFN:null;    
        
        if(!this.src){
            console.log('loadTexture ERROR: no image url');
            if(this.onLoadComplete)this.onLoadComplete();
            this.onLoadComplete = null;
        }
        
        console.log('loadTexture: '+this.src);
        
        if(this.srcObj){ // was passed an object, not src string
            textureLoaded.call(this);
        } else if(!this.cube){
            this.srcObj = new Image();        
            this.srcObj.onload = textureLoaded.bind(this);        
            this.srcObj.src = this.src.replace('~/', this.scene.dirPath);
        } else {
            this.srcObj = [];
            var sidesLoaded = 0;
            function sideloaded(){ 
                sidesLoaded++;
                if(sidesLoaded == 6)textureLoaded.call(this);
            };
            for(var i=0; i<6; i++){
                var imgObj = new Image();
                imgObj.onload = sideloaded.bind(this);
                imgObj.src = this.src[i].replace('~/', this.scene.dirPath);
                this.srcObj.push(imgObj);
            }
        }
    }
    
    function isPow2( num ){
        return num !== 0 && (num & (num - 1)) === 0;
    }
        
    function textureLoaded(){
        var gl = this.scene.gl,
            texture = this.texture;
        
        gl.activeTexture(gl["TEXTURE"+this.texUnit]);
        gl.bindTexture(this.type, texture );
        
        //save image dimensions
        this.width = this.srcObj.width;
        this.height = this.srcObj.height;     
                
        //flip the Y coord
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
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
        
        if (this.onLoadComplete){
            this.onLoadComplete();
            this.onLoadComplete = null;
        }
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
        
    GLTexture.prototype.loadTexture = loadTexture;
    GLTexture.prototype.destroy = destroy;
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.GLTexture = GLTexture;
    
   
}(window));