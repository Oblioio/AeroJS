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
        
        texObj.loadTexture(callbackFn);
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
        var _nodes = [];
        for(var i=0; i<settings.nodes.length; i++){
            if(this.nodes.hasOwnProperty(settings.nodes[i])){
                _nodes.push(settings.nodes[i]);
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
