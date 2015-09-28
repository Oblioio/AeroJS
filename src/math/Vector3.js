(function(window) {

    'use strict';


    function calculateFaceNormal(ptA, ptB, ptC){
        // give me 3 points... i'll calculate the normal
        var vecA = vec_sub(ptC, ptB),
            vecB = vec_sub(ptA, ptB),
            cross = vec_cross(vecA, vecB);

        // return normalized cross product
        return vec_divide(cross, vec_length(cross));
    }

    function vec_sub(vecA, vecB){
        return [vecA[0]-vecB[0], vecA[1]-vecB[1], vecA[2]-vecB[2]];
    }

    function vec_cross(vecA, vecB){
        return [
                    vecA[1]*vecB[2] - vecA[2]*vecB[1],
                    vecA[2]*vecB[0] - vecA[0]*vecB[2],
                    vecA[0]*vecB[1] - vecA[1]*vecB[0]
                ];
    }

    function vec_divide(vecA, scalar){
        return [vecA[0]/scalar, vecA[1]/scalar, vecA[2]/scalar];
    }

    function vec_length(vecA){
        return Math.sqrt( vecA[0] * vecA[0] + vecA[1] * vecA[1] + vecA[2] * vecA[2] );
    }
    
    
    // add section to Aero namespace
    Aero.Math = Aero.Math || {};
    Aero.Math.Vector3 = {
    	
    };


}(window));
