(function(window) {

    'use strict';


    function Renderer(_scene){
        this.scene = _scene;
        this.frameBuffers = [];
    }
    
    // not run until data and canvas are in place
    function init(){        
        this.gl = this.scene.gl;
        
        //setup initial vars
        this.maxTextureUnits = this.scene.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.nextTexUnit = 0;
        this.autoRender = false;   
                
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
    }
    
    function update(callBackFn){
        
        var function_arr =  [
                // { fn: createRenderList },
                // { fn: assignFrameBuffers },
                { fn: initVertexBuffers },
                { fn: callBackFn }
            ];
        
        this.arrayExecuter.execute(function_arr);
    }
    
    function setSize(w, h){
        console.log('setSize: '+w+', '+h);
        //size the canvas
        this.scene.canvas.width = w;
        this.scene.canvas.height = h;
        
        this.gl.viewport(0, 0, Number(w), Number(h));
        var nodes = this.scene.nodes;
        for(var node in nodes){
            if(nodes[node].resize)nodes[node].resize(w, h);
        }
        var gl = this.gl;
                
        // need to resize frame buffers
        for(var i=0; i<this.frameBuffers.length; i++){
            console.log(this.frameBuffers[i].size);
            if(this.frameBuffers[i].size !== "auto")continue; // only resize those that are autosized
            // console.log('resize buffer '+i);
            this.frameBuffers[i].width = w;
            this.frameBuffers[i].height = h;
            
            // size texture
            gl.activeTexture(gl["TEXTURE"+this.frameBuffers[i].texUnit]);
            gl.bindTexture(gl.TEXTURE_2D, this.frameBuffers[i].texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            // gl.bindTexture(gl.TEXTURE_2D, null);

            // size depth buffer
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.frameBuffers[i].renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        this.scene.needsUpdate = true;
    }
        
    function createRenderList(callBackFn){
        console.log('/////////////////  createRenderList  /////////////////');
        
        // first we reset all the nodes to default settings
        
        
        // figure out the render chains.
        // the idea is to track back from any canvas renders
        // the order doesn't have to be exact order, but all
        // dependencies must be figured out
        
        var connections = this.scene.connections,
            nodesToCheck = this.scene.connectionSearch('dest', 'canvas'), //initial connections to check are those that draw to canvas
            connectedNodes = [],
            currConnection,
            currNode,
            sourceConnections,
            destConnections,
            connectedNode,
            connectedIndex,
            lowestIndex,
            highestIndex,
            s, d, r;

        // console.log('initial nodes to check: '+nodesToCheck.length);
        
        // clear render list
        this.renderList = [];
        // reset all nodes
        for(currNode in this.scene.nodes){
            this.scene.nodes[currNode].inRenderList = false;
            this.scene.nodes[currNode].dependents = []
        }
        
        // setup the nodes that draw to canvas
        for(r=0; r<nodesToCheck.length; r++){
            connectedNode = getConnectedNode.call(this, nodesToCheck[r], 'source');
            connectedNode.drawToCanvas = true;
        }

        // Everytime I check a node I will add it to the render list
        // I check what dependencies it has, and what other nodes depend on it
        
        // To determine where in the render list it should go we need to:
        // Check the index of all nodes that depends on this node and remember the lowest value
        // Check the index of all nodes it depends on and remember the highest value
        // place it on the render at the highest value that meets both requirements

        // finally add any nodes that depend on the current node to the beginning of the toCheck array

        //this will loop as long as there more connections to add
        while(nodesToCheck.length){
            // console.log('loop begin: '+nodesToCheck.length);
            currConnection = nodesToCheck.shift(); //get first connection in list
            lowestIndex = highestIndex = false; //reset vars

            // console.log('currNode');
            // console.log(currConnection);
            currNode = getConnectedNode.call(this, currConnection, 'source');
            // console.log('checking node: '+currNode.id);
            // console.log(currNode.inRenderList);
            if(currNode.inRenderList)continue; // keeps a node from ever being added twice
            currNode.inRenderList = true;

            // connections where the current node is the source
            sourceConnections = this.scene.connectionSearch('source', currConnection['source']['id']);

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
            destConnections = this.scene.connectionSearch('dest', currConnection['source']['id']);

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

            // console.log('adding: '+currNode.id+", highestIndex: "+highestIndex+", lowestIndex: "+lowestIndex);

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

        // callBackFn();
        
        assignFrameBuffers.call(this, callBackFn);
    }

    function getConnectedNode(connection, dir){
        var containerObj = false,
            nodeObj = false;

        containerObj = this.scene.nodes;

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
    
    function createTexture(textureData){
        textureData = textureData || {};
        textureData.texUnit = this.getNextTexUnit();
        return new Aero.GLTexture(textureData, this.scene);
    }
    
    function assignFrameBuffers(callBackFn){
        console.log('/////////////////  assignFrameBuffers  /////////////////');
        
        // reset current frame buffers
        for(var i=0; i<this.frameBuffers.length; i++){
            this.frameBuffers[i].holdForever = false;
            this.frameBuffers[i].holdIndex = -1;
        }

        var currBuffer,
            currNode,
            connectedNode,
            connectedIndex,
            r, o;

        // loop through frame buffers defined in JSON, if any
        // create buffer for each object and assign it to node

        for(var i=0; i<this.scene.renderTargets.length; i++){
            var buffObj = this.scene.renderTargets[i];
            if(buffObj["nodes"].length){
                currBuffer = this.frameBuffers[i] || getNextFrameBuffer.call(this, 0, this.scene.renderTargets[i]);
                currBuffer.holdForever = true;
                for(o=0; o<buffObj["nodes"].length; o++){
                    currNode = this.scene.nodes[buffObj["nodes"][o]];
                    if(!currNode){
                        console.log('Could not assign frame buffer "'+r+'" to node "'+buffObj["nodes"][o]+'" because it does not exist');
                        continue;
                    }
                    currNode.forcedBuffer = currBuffer;
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
            if( currNode.type == "texture" ) continue;
            if( currNode.type == "JSProgram" && !currNode.draws ) continue;
            if( currNode.drawToCanvas ) continue;
            if( !currNode.dependents || !currNode.dependents.length ) continue;

            if(currNode.forcedBuffer){
                // buffer was assigned in JSON created above
                currBuffer = currNode.forcedBuffer;
                currNode.forcedBuffer = null; // no longer need it
            } else {
                currBuffer = getNextFrameBuffer.call(this, r);
            }
            
            currNode.outputs = currNode.outputs || {};
            currNode.outputs.texUnit = currBuffer.texUnit;
            
            console.log(currNode.id+' draws to frame buffer: '+currBuffer.texUnit);

            for(o=0; o<currNode.dependents.length; o++){
                // getRenderListIndex(this.renderList, connectedNode);
                // connectedNode = this.GLPrograms[currNode.dependents[o].id];
                connectedNode = this.scene.nodes[currNode.dependents[o].id];
                
                // if(connectedNode.type == "GLProgram")connectedNode.setUniform(currNode.dependents[o].var, currBuffer.texUnit); //set the texture unit index
                if(connectedNode.type == "GLProgram"){
                    // console.log('setting '+connectedNode.id+' '+currNode.dependents[o].destVar+' to '+currBuffer.texUnit);
                    connectedNode.inputs[currNode.dependents[o].destVar] = currBuffer.texUnit; //set the texture unit index
                }
                
                
                connectedIndex = getRenderListIndex(this.renderList, connectedNode);
                currBuffer.holdIndex = Math.max(connectedIndex, currBuffer.holdIndex);
                // console.log('framebuffer connectedIndex: '+connectedIndex);
                // console.log('framebuffer holdIndex: '+currBuffer.holdIndex);
            }

            currNode.outputBuffer = currBuffer.index;
        }

        callBackFn();
    }

    function getNextFrameBuffer(r, customSettings){

        // check if any current frame buffers are available
        // if one is available return it
        if(!customSettings){
            for(var b=0; b<this.frameBuffers.length; b++){
                // the buffer is available if the current index is greater than the holdIndex
                if(!this.frameBuffers[b].holdForever && this.frameBuffers[b].holdIndex < r){
                    return this.frameBuffers[b];
                }
            }
        }

        // if we got here then none were available
        // so we're gonna create a new one
        
        // var bufferObject = createFrameBuffer.call(this);

        // bufferObject.index = this.frameBuffers.length;
        // bufferObject.holdIndex = 0;

        // this.frameBuffers.push(bufferObject);

        // return bufferObject;
        
        return createFrameBuffer.call(this, customSettings || {});
    }

    function createFrameBuffer(settings){
        var gl = this.gl,
            rttFramebuffer = gl.createFramebuffer(),
            rttTexture = gl.createTexture(),
            renderbuffer = gl.createRenderbuffer(),
            size = (settings.size)?"custom":"auto",
            bufferWidth = (settings.size && settings.size.width)?settings.size.width:this.scene.canvas.width,
            bufferHeight = (settings.size && settings.size.height)?settings.size.height:this.scene.canvas.height,
            isPowTwo = (
                        (( bufferWidth & ( bufferWidth - 1 ) ) === 0 && bufferWidth !== 0) && 
                        (( bufferHeight & ( bufferHeight - 1 ) ) === 0 && bufferHeight !== 0)
                    ) ? true:false,
            mipmap = (settings.mipmap && isPowTwo)?settings.mipmap:false,
            texUnit = this.getNextTexUnit();

        console.log('createFrameBuffer: texUnit '+texUnit+' size: '+bufferWidth+', '+bufferHeight);        
        console.log("isPowTwo: "+isPowTwo);
        
        // frame buffer
        gl.activeTexture(gl["TEXTURE"+texUnit]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

        // texture
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, (mipmap)?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        if(isPowTwo)gl.generateMipmap(gl.TEXTURE_2D);

        // depth buffer, not sure we need this actually
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, bufferWidth, bufferHeight);

        // attach texture and depth buffer to frame buffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        // unbind the texture and buffers
        // gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // return {
        //     size: size,
        //     frameBuffer: rttFramebuffer,
        //     texture: rttTexture,
        //     renderBuffer: renderbuffer,
        //     width: bufferWidth,
        //     height: bufferHeight,
        //     texUnit: texUnit
        // }
        
        var bufferObject = {
            size: size,
            mipmap: mipmap,
            frameBuffer: rttFramebuffer,
            texture: rttTexture,
            renderBuffer: renderbuffer,
            width: bufferWidth,
            height: bufferHeight,
            texUnit: texUnit,
            index: this.frameBuffers.length,
            holdIndex: 0
        }
        
        this.frameBuffers.push(bufferObject);
        
        return bufferObject;
    }

    function getNextTexUnit(){
        var texUnit = this.nextTexUnit;
        if(texUnit >= this.maxTextureUnits)
            console.log("ERROR: TexUnit "+texUnit+" | Only "+this.maxTextureUnits+" are supported.");
        this.nextTexUnit++;
        return texUnit;
    }
    
    function initVertexBuffers(callBackFn){
        console.log('initVertexBuffers');
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

        callBackFn();
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

    function createCustomBuffer(data, attributes){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;

        // Create the buffer object
        var newBuffer = gl.createBuffer();
        if (!newBuffer) {
          console.log('Failed to create the buffer object');
          return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(data.type || gl.ARRAY_BUFFER, newBuffer);
        gl.bufferData(data.type || gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

        return {
            buffer: newBuffer,
            type: data.type || gl.ARRAY_BUFFER,
            length: data.length,
            data: data,
            fsize: data.BYTES_PER_ELEMENT,
            attributes: attributes
        };
    }

    function updateCustomBuffer(bufferObj){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;
        // bind buffer
        gl.bindBuffer(bufferObj.type, bufferObj.buffer);
        // buffer data (maybe should use glBufferSubData instead?);
        if(bufferObj.data.length > bufferObj.length){
            bufferObj.length = bufferObj.data.length;
            gl.bufferData(bufferObj.type, bufferObj.data, gl.DYNAMIC_DRAW);
        } else {
            gl.bufferSubData(bufferObj.type, 0, bufferObj.data);
        }
    }

    function useCustomBuffer(bufferObj){
        var gl = this.gl;
        this.usingStandardVertexBuffer = false;

        // bind buffer
        gl.bindBuffer(bufferObj.type, bufferObj.buffer);

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
    
    
    
    
    function start(){
        if(this.autoRender)return;
        this.autoRender = true;
        this.render();
    }
    
    function pause(){
        this.autoRender = false;        
    }
    
    function render(){
        var gl = this.gl,
            nodeObj, bufferObj,
            d,
            canvasW = Number(this.scene.canvas.width),
            canvasH = Number(this.scene.canvas.height);
            
        if(!this.gl)return;
        
        if(this.scene.needsUpdate){
            this.scene.needsUpdate = false;
            createRenderList.call(this, function(){
                console.log('render list callback');
                render.call(this);
            }.bind(this));
            return;
        }
        
        for(var p=0; p<this.renderList.length; p++){
            nodeObj = this.renderList[p];

            switch(nodeObj.type){
                case "GLProgram":
                
                    //attach program
                    gl.useProgram(nodeObj.program);
                    gl.program = nodeObj.program;
                    

                    //update vertex attrib
                    if(!this.usingStandardVertexBuffer){
                        this.useStandardVertexBuffer(this);
                    }

                    //update uniforms
                    nodeObj.updateUniforms();
                    
                    // console.log('program: '+nodeObj.id);
                    if(nodeObj.drawToCanvas){
                        // console.log(nodeObj.id+' draw to canvas!');
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.viewport(0, 0, canvasW, canvasH);
                        
                        //draw
                        nodeObj.render();
                        
                    } else {
                        bufferObj = this.frameBuffers[nodeObj.outputBuffer];
                        // console.log('bind buffer: '+nodeObj.outputBuffer);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, bufferObj.frameBuffer);
                        gl.viewport(0, 0, bufferObj.width, bufferObj.height);
                        
                        if(nodeObj.clearBuffer){
                            gl.clear(gl.COLOR_BUFFER_BIT);
                        }                        
                        
                        //draw
                        nodeObj.render();
                        if(bufferObj.mipmap){
                            gl.activeTexture(gl["TEXTURE"+bufferObj.texUnit]);
                            // gl.bindTexture(gl.TEXTURE_2D, bufferObj.texture);
                            gl.generateMipmap(gl.TEXTURE_2D);
                        }
                    }



                    break;
                case "JSProgram":
                    if(nodeObj.draws){
                        if(!nodeObj.drawToCanvas){
                            bufferObj = this.frameBuffers[nodeObj.outputBuffer];
                            gl.bindFramebuffer(gl.FRAMEBUFFER, bufferObj.frameBuffer);
                            gl.viewport(0, 0, bufferObj.width, bufferObj.height);
                            
                            if(nodeObj.clearBuffer){
                                gl.clear(gl.COLOR_BUFFER_BIT);
                            }
                            
                            // run program
                            nodeObj.run();
                            
                            if(bufferObj.mipmap){
                                gl.activeTexture(gl["TEXTURE"+bufferObj.texUnit]);
                                // gl.bindTexture(gl.TEXTURE_2D, bufferObj.texture);
                                gl.generateMipmap(gl.TEXTURE_2D);
                            }
                            
                        } else {
                            
                            // console.log(nodeObj.id+' draw to canvas!');
                            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                            gl.viewport(0, 0, canvasW, canvasH);
                            
                            // run program
                            nodeObj.run();
                        }
                    } else {
                        nodeObj.run();
                    }

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

        if(this.autoRender)window.requestAnimationFrame(render.bind(this));
    }
    
    function destroy(){
        
        var gl = this.scene.gl,
            numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        
        // delete all texture units
        for (var unit = 0; unit < numTextureUnits; ++unit) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                
        for(var b=0; b<this.frameBuffers.length; b++){            
            gl.deleteRenderbuffer(this.frameBuffers[b].renderBuffer);
            gl.deleteFramebuffer(this.frameBuffers[b].frameBuffer);
            gl.deleteTexture(this.frameBuffers[b].texture);
            
            this.frameBuffers[b] = null;
        }
        
        this.arrayExecuter.destroy();
        
        this.scene = null;
        this.gl = null;
        this.arrayExecuter = null;
        this.renderList = null;
        this.frameBuffers = null;
    }
    
    Renderer.prototype.init = init;
    Renderer.prototype.update = update;
    Renderer.prototype.setSize = setSize;
    Renderer.prototype.start = start;
    Renderer.prototype.pause = pause;
    Renderer.prototype.render = render;
    
    Renderer.prototype.createTexture = createTexture;    
    
    Renderer.prototype.getNextTexUnit = getNextTexUnit;
    Renderer.prototype.useStandardVertexBuffer = useStandardVertexBuffer;
    Renderer.prototype.useCustomBuffer = useCustomBuffer;
    Renderer.prototype.createCustomBuffer = createCustomBuffer;
    Renderer.prototype.updateCustomBuffer = updateCustomBuffer;
    
    Renderer.prototype.destroy = destroy;
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.Renderer = Renderer;

}(window));
