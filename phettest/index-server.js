var http = require( 'http' );
var spawn = require( 'child_process' ).spawn;
var path = require( 'path' );
var url = require( 'url' );
var fs = require( 'fs' );

var port = 45362;

// Allow CORS
var jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

// root of your GitHub working copy, relative to the name of the directory that the currently-executing script resides in
var rootDir = path.normalize( __dirname + '/' );

// callback(), errCallback( code )
function execute( cmd, args, cwd, callback, errCallback ) {
  var process = spawn( cmd, args, {
    cwd: cwd
  } );
  console.log( 'running ' + cmd + ' ' + args.join( ' ' ) + ' from ' + cwd );

  process.stderr.on( 'data', function( data ) {
    console.log( 'stderr: ' + data );
  } );
  process.stdout.on( 'data', function( data ) {
    console.log( 'stdout: ' + data );
  } );
  process.on( 'close', function( code ) {
    // Failure
    if ( code !== 0 ) {
      errCallback( code );
    }
    // Success
    else {
      callback();
    }
  } );
}

// callback(), errCallback( code )
function pull( repo, callback, errCallback ) {
  execute( 'git', [ 'pull' ], rootDir + repo, callback, errCallback );
}

// callback(), errCallback( code )
function npmInstall( repo, callback, errCallback ) {
  execute( 'npm', [ 'install' ], rootDir + repo, callback, errCallback );
}

// callback(), errCallback( code )
function grunt( repo, callback, errCallback ) {
  execute( 'grunt', [ '--no-color' ], rootDir + repo, callback, errCallback );
}

function getActiveRepos() {
  return fs.readFileSync( rootDir + 'chipper/data/active-repos', 'utf8' )
           .split( '\n' )
           .filter( function( name ) { return name.length > 0; } );
}

function getActiveSims() {
  return fs.readFileSync( rootDir + 'chipper/data/active-sims', 'utf8' )
           .split( '\n' )
           .filter( function( name ) { return name.length > 0; } );
}

function successFunction( req, res, name ) {
  return function() {
    res.writeHead( 200, jsonHeaders );
    res.end( JSON.stringify( {
      output: name,
      success: true
    } ) );
  };
}

function errorFunction( req, res, name ) {
  return function( code ) {
    res.writeHead( 500, jsonHeaders );
    res.end( JSON.stringify( {
      output: name + ' exit code ' + code,
      success: false
    } ) );
  };
}

function taskBuild( req, res, query ) {
  var simName = query.sim;

  if ( !validateSimName( simName ) ) {
    res.writeHead( 403, jsonHeaders );
    res.end( JSON.stringify( {
      output: 'Invalid sim name',
      success: false
    } ) );
    return;
  }

  npmInstall( simName, function() {
    grunt( simName,
           successFunction( req, res, 'build ' + simName ),
           errorFunction( req, res, 'grunt ' + simName ) );
  }, errorFunction( req, res, 'npm install ' + simName ) );
}

function taskSimList( req, res, query ) {
  var activeSims = getActiveSims();

  res.writeHead( 200, jsonHeaders );
  res.end( JSON.stringify( {
    output: activeSims,
    success: true
  } ) );
}

function taskChipperRefresh( req, res, query ) {
  pull( 'chipper', function() {
    npmInstall( 'chipper', function() {
      execute( rootDir + 'chipper/bin/clone-missing-repos.sh', [], rootDir,
               successFunction( req, res, 'chipper refresh' ),
               errorFunction( req, res, 'chipper clone missing repos') );
    }, errorFunction( req, res, 'chipper npm install' ) );
  }, errorFunction( req, res, 'pull chipper' ) );
}

function taskPull( req, res, query ) {
  var simName = query.sim;

  if ( !validateSimName( simName ) ) {
    res.writeHead( 403, jsonHeaders );
    res.end( JSON.stringify( {
      output: 'Invalid sim name',
      success: false
    } ) );
    return;
  }

  pull( simName, successFunction( req, res, 'pull ' + simName ), errorFunction( req, res, 'pull ' + simName ) );
}

function taskPullAll( req, res, query ) {
  var repos = getActiveRepos();

  (function step() {
    if ( repos.length ) {
      var repo = repos.shift();

      pull( repo, function() {
        step();
      }, errorFunction( req, res, 'pull ' + repo ) );
    }
    else {
      res.writeHead( 200, jsonHeaders );
      res.end( JSON.stringify( {
        output: 'pulled',
        success: true
      } ) );
    }
  })();
}

function validateSimName( simName ) {
  // validate that it is lower-case with hyphens
  for ( var i = 0; i < simName.length; i++ ) {
    var charCode = simName.charCodeAt( i );
    if ( charCode !== '-'.charCodeAt( 0 ) && ( charCode < 'a'.charCodeAt( 0 ) || charCode > 'z'.charCodeAt( 0 ) ) ) {
      return false;
    }
  }
  return true;
}

http.createServer( function( req, res ) {
  // req.url
  // req.method
  // req.headers

  var bits = url.parse( req.url, true );
  var path = bits.pathname;
  var query = bits.query;

  if ( path === '/build' ) {
    taskBuild( req, res, query );
  }
  else if ( path === '/sim-list' ) {
    taskSimList( req, res, query );
  }
  else if ( path === '/chipper-refresh' ) {
    taskChipperRefresh( req, res, query );
  }
  else if ( path === '/pull-all' ) {
    taskPullAll( req, res, query );
  }
  else if ( path === '/pull' ) {
    taskPull( req, res, query );
  }
  else {
    res.writeHead( 403, jsonHeaders );
    res.end( JSON.stringify( {
      output: 'Unknown task',
      success: false
    } ) );
  }

  var simName = req.url.slice( 1 );



} ).listen( port );

console.log( 'running on port ' + port + ' with root directory ' + rootDir );
