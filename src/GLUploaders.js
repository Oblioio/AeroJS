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
