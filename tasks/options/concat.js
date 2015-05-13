module.exports = {

    //  One ring to rule them all
    standalone: {
        options: {
            banner: '<%= banner %>'
        },
        src: require('../manifests/aero'),
        dest: '<%= compile_dir %>/aero.js'
    }
    
};
