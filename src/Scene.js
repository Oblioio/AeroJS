(function(window) {

    'use strict';
    

    var Scene = function (settingsJSON, parameters) {
        console.log('Scene');
        
        if(parameters && parameters.canvas){
            this.canvas = parameters.canvas;
        } else {
            this.canvas = document.createElement('canvas');
        }
        
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        this.stepComplete = this.arrayExecuter.stepComplete.bind(this.arrayExecuter);
        this.renderer = new Aero.Renderer(this);
        this.io = new Aero.IO(this);
        
        this.onReady = (parameters && parameters.onReady)?parameters.onReady:null;
        
        this.nodes = {};

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
        
        // this.gl =  this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        var preserveDrawingBuffer = (this.data["settings"]["preserveDrawingBuffer"] && String(this.data["settings"]["preserveDrawingBuffer"]).toLowerCase() == "true")?true:false;
        this.gl =  this.canvas.getContext("webgl", {preserveDrawingBuffer: preserveDrawingBuffer}) 
                || this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: preserveDrawingBuffer});
        
        this.renderer.init();
        this.io.buildData(this.data, callbackFn);
        
        // this.arrayExecuter.stepComplete();
    }
    
    function initRenderer(callbackFn){
        this.renderer.update(callbackFn);
    }
    
    function initComplete(){
        // call initial render
        if(this.data["settings"]["autoRender"])this.renderer.start();
        
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
        
        texObj.loadTexture(callbackFn);
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
    
    function createGLProgram(id, obj, callbackFn){
        if(!this.checkNodeId(id))return;
                
        var progObj = new Aero.GLProgram(obj, this);
        
        // this.GLPrograms[id] = progObj;
        this.nodes[id] = progObj;
        progObj.id = id;
        progObj.dependents = []; //this will contain nodes that rely on this node to run first
        progObj.init(callbackFn);
    }
    
    
    // convenience functions
    
    Scene.prototype.render = function(){
        this.renderer.render();        
    }

    Scene.prototype.checkNodeId = checkNodeId;
    Scene.prototype.createTexture = createTexture;
    Scene.prototype.createJSProgram = createJSProgram;
    Scene.prototype.createGLProgram = createGLProgram;
    // Scene.prototype.useStandardVertexBuffer = useStandardVertexBuffer;
    // Scene.prototype.useCustomVertexBuffer = useCustomVertexBuffer;
    // Scene.prototype.createCustomVertexBuffer = createCustomVertexBuffer;
    // Scene.prototype.updateCustomVertexBuffer = updateCustomVertexBuffer;



    // add section to Aero namespace
    Aero.Scene = Scene;

}(window));
