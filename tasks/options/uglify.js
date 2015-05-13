
module.exports = {
    standalone: {
        options: {
            sourceMap: true,
            sourceMapName: '<%= compile_dir %>/aero.map',
            banner: '/* AeroJS v<%= package.version %> - http://oblio.io - @oblioio - (c) 2015 Oblio */\n'
        },
        src: ['<%= concat.standalone.dest %>'],
        dest: '<%= compile_dir %>/aero.min.js'
    }
};
