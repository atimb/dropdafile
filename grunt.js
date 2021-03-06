'use strict';

module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-mocha-test');

    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',
        mochaTest: {
            files: ['test/**/*.js']
        },
        mochaTestConfig: {
            options: {
                reporter: 'spec'
            }
        },
        lint: {
            files: ['grunt.js', 'lib/**/*.js']
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'default'
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                node: true
            },
            globals: {
                exports: true
            }
        }
    });

    // Additional Tasks
    grunt.registerTask('test', 'mochaTest');
    grunt.registerTask('default', 'lint test');

};
