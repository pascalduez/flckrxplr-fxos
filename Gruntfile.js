"use strict";

var path = require("path");
var lrSnippet = require("grunt-contrib-livereload/lib/utils").livereloadSnippet;
var folderMount = function folderMount( connect, point ) {
  return connect.static( path.resolve(point) );
};

module.exports = function( grunt ) {
  // Project configuration.
  grunt.initConfig({
    connect: {
      options: {
        port: 9000
      },
      livereload: {
        middleware: function( connect ) {
          return [ lrSnippet, folderMount(connect, ".") ];
        }
      }
    },
    open: {
      server: {
        url: "http://localhost:<%= connect.options.port %>"
      }
    },
    regarde: {
      fred: {
        files: ["*.html", "js/*.js", "css/*.css", "img/*.{png,jpg,jpeg,svg}"],
        tasks: ["livereload"]
      }
    },
    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },
      all: [
        "Gruntfile.js",
        "js/*.js"
      ]
    }
  });

  grunt.loadNpmTasks("grunt-open");
  grunt.loadNpmTasks("grunt-regarde");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-livereload");
  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.registerTask("default", "jshint");

  grunt.registerTask("server", ["livereload-start", "open", "connect", "regarde"]);
};
