module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            css: {
                src: [
                    'lib/css/thirdparty/*.css',
                    'lib/css/freeboard/styles.css'
                ],
                dest: 'css/freeboard.css'
            },
            thirdparty : {
                src : [
                    [
                        'lib/js/thirdparty/head.js',
                        'lib/js/thirdparty/jquery.js',
                        'lib/js/thirdparty/jquery-ui.js',
                        'lib/js/thirdparty/knockout.js',
                        'lib/js/thirdparty/underscore.js',
                        'lib/js/thirdparty/jquery.gridster.js',
                        'lib/js/thirdparty/jquery.caret.js',
                        'lib/js/thirdparty/codemirror.js',
                    ]
                ],
                dest : 'js/freeboard.thirdparty.js'
            },
			fb : {
				src : [
					'lib/js/freeboard/datasourceModel.js',
					'lib/js/freeboard/developerConsole.js',
					'lib/js/freeboard/dialogBox.js',
					'lib/js/freeboard/freeboardModel.js',
					'lib/js/freeboard/freeboardUI.js',
					'lib/js/freeboard/jsEditor.js',
					'lib/js/freeboard/paneModel.js',
					'lib/js/freeboard/pluginEditor.js',
					'lib/js/freeboard/valueEditor.js',
					'lib/js/freeboard/widgetModel.js',
					'lib/js/freeboard/freeboard.js',
				],
				dest : 'js/freeboard.js'
			},
            plugins : {
                src : [
                    'plugins/freeboard/*.js'
                ],
                dest : 'js/freeboard.plugins.js'
            },
            'fb+plugins' : {
                src : [
                    'js/freeboard.js',
                    'js/freeboard.plugins.js'
                ],
                dest : 'js/freeboard+plugins.js'
            }
        },
        cssmin : {
            css:{
                src: 'css/freeboard.css',
                dest: 'css/freeboard.min.css'
            }
        },
        uglify : {
            fb: {
                files: {
                    'js/freeboard.min.js' : [ 'js/freeboard.js' ]
                }
            },
            plugins: {
                files: {
                    'js/freeboard.plugins.min.js' : [ 'js/freeboard.plugins.js' ]
                }
            },
            thirdparty :{
                options: {
                    mangle : false,
                    beautify : false,
                    compress: true
                },
                files: {
                    'js/freeboard.thirdparty.min.js' : [ 'js/freeboard.thirdparty.js' ]
                }
            },
            'fb+plugins': {
                files: {
                    'js/freeboard+plugins.min.js' : [ 'js/freeboard+plugins.js' ]
                }
            }
        },
        'string-replace': {
            css: {
                files: {
                    'css/': 'css/*.css'
                },
                options: {
                    replacements: [{
                        pattern: /..\/..\/..\/img/ig,
                        replacement: '../img'
                    }]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-githooks');
    grunt.registerTask('default', [ 'concat:css', 'cssmin:css', 'concat:fb', 'concat:thirdparty', 'concat:plugins', 'concat:fb+plugins', 'uglify:fb', 'uglify:plugins', 'uglify:fb+plugins', 'uglify:thirdparty', 'string-replace:css' ]);
};