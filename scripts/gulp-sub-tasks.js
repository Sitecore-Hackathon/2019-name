var gulp = require("gulp");
var msbuild = require("gulp-msbuild");
var debug = require("gulp-debug");
var foreach = require("gulp-foreach");
var rename = require("gulp-rename");
var newer = require("gulp-newer");
var nugetRestore = require("gulp-nuget-restore");
var yargs = require("yargs").argv;
var util = require("gulp-util");
var config = require("./Configs/gulp-config.js")();
var wait = require("gulp-wait");
var exec = require("gulp-exec");
var replace = require('gulp-replace');

module.exports.config = config;

gulp.task("Sub-Publish-Foundation-Projects", function () {
    return publishProjects(config.srcRoot + "/Foundation", config.websiteRoot);
});

gulp.task("Sub-Publish-Feature-Projects", function () {
    return publishProjects(config.srcRoot + "/Feature", config.websiteRoot);
});

gulp.task("Sub-Publish-Project-Projects", function () {
    return publishProjects(config.srcRoot + "/Project", config.websiteRoot);
});

//gulp.task("Sub-Publish-Node-Modules", function () {
//    var root = config.srcRoot + "/../node_modules";
//    var roots = [
//        root + "/@angular",
//        root + "/angular-in-memory-web-api",
//        root + "/core-js",
//        root + "/rxjs",
//        root + "/systemjs",
//        root + "/zone.js"
//    ];
//    var files = "/**/*.js";
//    var destination = config.websiteRoot + "\\node_modules";
//    console.log("Publishing Node Modules from " + root + " to " + destination);
//    return gulp.src(roots, { base: root }).pipe(
//      foreach(function (stream, file) {
//          console.log("Publishing from " + file.path);
//          var target = destination + "\\" + file.relative;
//          gulp.src(file.path + files, { base: file.path })
//            .pipe(newer(target))
//            .pipe(debug({ title: "Copying " }))
//            .pipe(gulp.dest(target));
//          return stream;
//      })
//    );
//});

gulp.task("Sub-Publish-Project", function () {
  if(yargs && yargs.m && typeof(yargs.m) == "string") {
      return publishProject(yargs.m, config.websiteRoot);
  } else {
    throw "\n\n------\n USAGE: -m Layer/Module \n------\n\n";
  }
});

gulp.task("Sub-Build-Solution", function () {
    var targets = ["Build"];
    if (config.runCleanBuilds) {
        targets = ["Clean", "Build"];
    }

    var solution = "./" + config.solutionName + ".sln";

    if (config.skipVanilla)
    {
        var tag = "-no-vanilla";
        // Remove build entries in solution file for Vanilla project and Solr project so it does not build (this is workaround for octopus deploy config conflicts)
        gulp.src([solution])
            // .pipe(replace(/^Project.*Vanilla[^]*EndProject/g, ''))
            .pipe(replace(/\{958A09BB\-A0A9\-4067\-9D5D\-D27A98778968\}\.[^\n]*/g, '')) // Vanilla.csproj
            .pipe(replace(/\{A52FE1BF\-AF04\-49FE\-AC65\-5CE0C750F5AE\}\.[^\n]*/g, '')) // Solr.csproj
            .pipe(rename({ suffix: tag}))
            .pipe(gulp.dest("./"));
        solution = "./" + config.solutionName + tag + ".sln";
    }

    console.log("Environment: " + config.transform);
    console.log("Build Config: " + config.buildConfiguration);
    console.log("Build Platform: " + config.buildPlatform);
    console.log("Solution: " + solution);
    
    return gulp.src(solution)
        .pipe(msbuild({
            targets: targets,
            configuration: config.buildConfiguration,
            logCommand: false,
            verbosity: "minimal",
            stdout: true,
            errorOnFail: true,
            maxcpucount: 0,
            toolsVersion: config.toolsVersion,
            properties: {
                Platform: config.buildPlatform
            }
        }));
});
gulp.task("Sub-Publish-Assemblies", function () {
  var root = config.srcRoot;
  var binFiles = config.srcRoot + "/**/code/**/bin/Sitecore.{Feature,Foundation,Habitat}.*.{dll,pdb}";
  var destination = config.websiteRoot + "/bin/";
  return gulp.src(binFiles, { base: root })
    .pipe(rename({ dirname: "" }))
    .pipe(newer(destination))
    .pipe(debug({ title: "Copying " }))
    .pipe(gulp.dest(destination));
});

gulp.task("Sub-Publish-All-Views", function () {
  var root = config.srcRoot;
  var roots = [root + "/**/Views", "!" + root + "/**/obj/**/Views"];
  var files = "/**/*.cshtml";
  var destination = config.websiteRoot + "\\Views";
  return gulp.src(roots, { base: root }).pipe(
    foreach(function (stream, file) {
      console.log("Publishing from " + file.path);
      gulp.src(file.path + files, { base: file.path })
        .pipe(newer(destination))
        .pipe(debug({ title: "Copying " }))
        .pipe(gulp.dest(destination));
      return stream;
    })
  );
});

gulp.task("Sub-Publish-All-Configs", function () {
  var root = config.srcRoot;
  var roots = [root + "/**/App_Config", "!" + root + "/**/obj/**/App_Config"];
  var files = "/**/*.config";
  var destination = config.websiteRoot + "\\App_Config";
  return gulp.src(roots, { base: root }).pipe(
    foreach(function (stream, file) {
      console.log("Publishing from " + file.path);
      gulp.src(file.path + files, { base: file.path })
        .pipe(newer(destination))
        .pipe(debug({ title: "Copying " }))
        .pipe(gulp.dest(destination));
      return stream;
    })
  );
});

gulp.task("Sub-Nuget-Restore", function () {
    var solution = "./" + config.solutionName + ".sln";
    return gulp.src(solution).pipe(nugetRestore());
});

gulp.task("Sub-Apply-Transforms", function () {
    var layerPathFilters = [config.srcRoot + "/Foundation/**/*.transform", config.srcRoot + "/Foundation/**/*.transform." + config.transform, config.srcRoot + "/Feature/**/*.transform", config.srcRoot + "/Feature/**/*.transform." + config.transform, config.srcRoot + "/Project/**/*.transform", config.srcRoot + "/Project/**/*.transform." + config.transform, "!" + config.srcRoot + "/**/obj/**/*.transform*", "!" + config.srcRoot + "/**/bin/**/*.transform*"];

    if (config.skipVanilla) {
        layerPathFilters.push("!" + config.srcRoot + "/Foundation/Vanilla/*.transform*")
        layerPathFilters.push("!" + config.srcRoot + "/Foundation/Vanilla/**/*.transform*")
        layerPathFilters.push("!" + config.srcRoot + "/Foundation/Solr/*.transform*")
        layerPathFilters.push("!" + config.srcRoot + "/Foundation/Solr/**/*.transform*")
        // TODO: fix this overwrite conflict by extending octopus deploy... but this will work for now (include these in CA/CD foundation solutions and ignore here)
        layerPathFilters.push("!" + config.srcRoot + "/**/**/code/web.config.transform*")
        layerPathFilters.push("!" + config.srcRoot + "/**/**/code/Web.config.transform*")
        layerPathFilters.push("!" + config.srcRoot + "/Foundation/Glass/code/Views/Web.config.transform*")
        layerPathFilters.push("!" + config.srcRoot + "/Foundation/Accounts/code/App_Config/Security/domains.config.transform*")
        layerPathFilters.push("!" + config.srcRoot + "/**/**/code/App_Config/ConnectionStrings.config.transform*")
    }
    return gulp.src(layerPathFilters)
      .pipe(foreach(function (stream, file) {
          var fileToTransform = file.path.replace(/.+code\\(.+)\.transform/, "$1").replace("." + config.transform, "");
          util.log("Applying configuration transform: " + file.path);
          return gulp.src(config.srcRoot+"/../scripts/applytransform.targets")
            .pipe(msbuild({
                targets: ["ApplyTransform"],
                configuration: config.buildConfiguration,
                logCommand: false,
                verbosity: "minimal",
                stdout: true,
                errorOnFail: true,
                maxcpucount: 0,
                toolsVersion: config.toolsVersion,
                properties: {
                    WebConfigToTransform: config.websiteRoot,
                    TransformFile: file.path,
                    FileToTransform: fileToTransform
                }
            }));
      }));
});

gulp.task("Sub-Deploy-Transforms", function () {
    return gulp.src([config.srcRoot + "/**/code/**/*.transform", config.srcRoot + "/**/code/**/*.transform." + config.transform])
        .pipe(gulp.dest(config.websiteRoot + "/temp/transforms"));
});

gulp.task("Sub-Deploy-All-Transforms", function () {
    return gulp.src([config.srcRoot + "/**/code/**/*.transform*"])
        .pipe(gulp.dest(config.instanceRoot+ "/Transforms"));
});

gulp.task("Testing-Sitecore-License", function () {
    console.log("Copying Sitecore License file");

    return gulp.src(config.licensePath).pipe(gulp.dest(config.srcRoot + "/../lib"));
});


/*****************************
  Publish
*****************************/
var publishStream = function (stream, dest) {
    var targets = ["Build"];

    return stream
      .pipe(debug({ title: "Building project:" }))
      .pipe(msbuild({
          targets: targets,
          configuration: config.buildConfiguration,
          logCommand: false,
          verbosity: "minimal",
          stdout: true,
          errorOnFail: true,
          maxcpucount: 1,
          toolsVersion: config.toolsVersion,
          properties: {
              Platform: config.publishPlatform,
              DeployOnBuild: "true",
              DeployDefaultTarget: "WebPublish",
              WebPublishMethod: "FileSystem",
              DeleteExistingFiles: "false",
              publishUrl: dest,
              _FindDependencies: "false"
          }
      }));
}

var publishProject = function (location, dest) {
    console.log("publish to " + dest + " folder");
    return gulp.src([config.srcRoot + "/" + location + "/code/*.csproj"])
      .pipe(foreach(function (stream, file) {
          return publishStream(stream, dest);
      }));
}

var publishProjects = function (location, dest) {
    console.log("publish to " + dest + " folder");
    var projects = [location + "/**/code/*.csproj"];
    if (config.skipVanilla)
    {
        projects.push("!" + location + "/**/code/*Vanilla.csproj");
        projects.push("!" + location + "/**/code/*Solr.csproj");
    }
    return gulp.src(projects)
      .pipe(foreach(function (stream, file) {
          return publishStream(stream, dest);
      }));
};

gulp.task("SUB-App-Offline", function (callback) {
    console.log("Disabling Web App");
    return gulp.src(config.srcRoot + "/Project/Common/code/app_offline.htm").pipe(gulp.dest(config.websiteRoot)).pipe(wait(3000));
});

gulp.task("SUB-App-Online", function (callback) {
    console.log("Enabling Web App");
    exec('Powershell.exe  -executionpolicy remotesigned -File ' + config.srcRoot + '/Project/Common/code/ToggleAppOn.ps1 -websiteFolder ' + config.websiteRoot, function (err, stdout, stderr) {
        console.log(stdout);
        callback(err);
    });
});
