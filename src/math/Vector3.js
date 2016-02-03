(function(window) {

    'use strict';


    // function calculateFaceNormal(ptA, ptB, ptC){
    //     // give me 3 points... i'll calculate the normal
    //     var vecA = vec_sub(ptC, ptB),
    //         vecB = vec_sub(ptA, ptB),
    //         cross = vec_cross(vecA, vecB);

    //     // return normalized cross product
    //     return vec_divide(cross, vec_length(cross));
    // }

    // function vec_sub(vecA, vecB){
    //     return [vecA[0]-vecB[0], vecA[1]-vecB[1], vecA[2]-vecB[2]];
    // }

    // function vec_cross(vecA, vecB){
    //     return [
    //                 vecA[1]*vecB[2] - vecA[2]*vecB[1],
    //                 vecA[2]*vecB[0] - vecA[0]*vecB[2],
    //                 vecA[0]*vecB[1] - vecA[1]*vecB[0]
    //             ];
    // }

    // function vec_divide(vecA, scalar){
    //     return [vecA[0]/scalar, vecA[1]/scalar, vecA[2]/scalar];
    // }

    // function vec_length(vecA){
    //     return Math.sqrt( vecA[0] * vecA[0] + vecA[1] * vecA[1] + vecA[2] * vecA[2] );
    // }
    
    
    function multiplyMat4(vec, mat){
        var w = mat[3] * vec[0] + mat[7] * vec[1] + mat[11] * vec[2] + mat[15];
        w = w || 1.0;
        
        return [ (mat[0] * vec[0] + mat[4] * vec[1] + mat[8] * vec[2] + mat[12]) / w,
            (mat[1] * vec[0] + mat[5] * vec[1] + mat[9] * vec[2] + mat[13]) / w,
            (mat[2] * vec[0] + mat[6] * vec[1] + mat[10] * vec[2] + mat[14]) / w ];
    }
    
    // add section to Aero namespace
    Aero.Math = Aero.Math || {};
    Aero.Math.Vector3 = {
    	multiplyMat4: multiplyMat4
    };


}(window));
