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