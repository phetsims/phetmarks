// Copyright 2016, University of Colorado Boulder

/* eslint-env node */
'use strict';

const http = require( 'http' );
const spawn = require( 'child_process' ).spawn; // eslint-disable-line
const path = require( 'path' );
const url = require( 'url' );
const fs = require( 'fs' );

const port = 45362;

// Allow CORS
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

// root of your GitHub working copy, relative to the name of the directory that the currently-executing script resides in
const rootDir = path.normalize( __dirname + '/../../' ); // eslint-disable-line

// callback(), errCallback( code )
function execute( cmd, args, cwd, callback, errCallback ) {

  const process = spawn( cmd, args, {
    cwd: cwd
  } );
  console.log( `running ${cmd} ${args.join( ' ' )} from ${cwd}` );

  process.on( 'error', error => {
    console.log( 'uncaught error:', error );
  } );
  process.stderr.on( 'data', data => {
    console.log( `stderr: ${data}` );
  } );
  process.stdout.on( 'data', data => {
    console.log( `stdout: ${data}` );
  } );
  process.on( 'close', code => {
    console.log( 'finished executing', cmd, args, cwd, code );

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
function npmUpdate( repo, callback, errCallback ) {

  execute( 'npm', [ 'update' ], rootDir + repo, callback, errCallback );
}

// callback(), errCallback( code )
function grunt( repo, callback, errCallback ) {

  execute( 'grunt', [ '--no-color', '--minify.uglify=false' ], rootDir + repo, callback, errCallback );
}

function isSameAsRemoteMaster( repo, sameCallback, differentCallback ) {

  execute( 'bash', [ '../phetmarks/phettest/same-as-remote-master.sh' ], rootDir + repo, sameCallback, differentCallback );
}

function getActiveRepos() {

  return fs.readFileSync( `${rootDir}perennial/data/active-repos`, 'utf8' )
    .split( '\n' )
    .filter( name => name.length > 0 );
}

function getActiveSims() {

  return fs.readFileSync( `${rootDir}perennial/data/active-sims`, 'utf8' )
    .split( '\n' )
    .filter( name => name.length > 0 );
}

function successFunction( req, res, name ) {

  return () => {
    res.writeHead( 200, jsonHeaders );
    res.end( JSON.stringify( {
      output: name,
      success: true
    } ) );
  };
}

function errorFunction( req, res, name ) {

  return code => {
    res.writeHead( 500, jsonHeaders );
    res.end( JSON.stringify( {
      output: `${name} exit code ${code}`,
      success: false
    } ) );
  };
}

function taskBuild( req, res, query ) {

  const simName = query.sim;

  if ( !validateSimName( simName ) ) {
    res.writeHead( 403, jsonHeaders );
    res.end( JSON.stringify( {
      output: 'Invalid sim name',
      success: false
    } ) );
    return;
  }

  npmUpdate( 'chipper', () => {
    npmUpdate( simName, () => {
      grunt( simName, () => {} );
    }, () => {} );
  }, () => {} );

  res.writeHead( 200, jsonHeaders );
  res.end( JSON.stringify( {
    output: 'Build kicked off',
    success: true
  } ) );
}

function taskSimList( req, res, query ) {

  const activeSims = getActiveSims();

  res.writeHead( 200, jsonHeaders );
  res.end( JSON.stringify( {
    output: activeSims,
    success: true
  } ) );
}

function taskRepoList( req, res, query ) {

  const activeSims = getActiveRepos();

  res.writeHead( 200, jsonHeaders );
  res.end( JSON.stringify( {
    output: activeSims,
    success: true
  } ) );
}

function taskPerennialRefresh( req, res, query ) {

  pull( 'perennial', () => {
    npmUpdate( 'perennial', () => {
      execute( `${rootDir}perennial/bin/clone-missing-repos.sh`, [], rootDir,
        successFunction( req, res, 'perennial refresh' ),
        errorFunction( req, res, 'perennial clone missing repos' ) );
    }, errorFunction( req, res, 'perennial npm update' ) );
  }, errorFunction( req, res, 'pull perennial' ) );
}

function taskPull( req, res, query ) {

  const simName = query.sim;

  if ( !validateSimName( simName ) ) {
    res.writeHead( 403, jsonHeaders );
    res.end( JSON.stringify( {
      output: 'Invalid sim name',
      success: false
    } ) );
    return;
  }

  pull( simName, successFunction( req, res, `pull ${simName}` ), errorFunction( req, res, `pull ${simName}` ) );
}

function taskPullAll( req, res, query ) {

  execute( `${rootDir}perennial/bin/pull-all.sh`, [ '-p' ], rootDir,
    successFunction( req, res, 'pulled' ),
    errorFunction( req, res, 'pull failed' ) );
}

function taskSameAsRemoteMaster( req, res, query ) {

  const simName = query.repo;

  if ( !validateSimName( simName ) ) {
    res.writeHead( 403, jsonHeaders );
    res.end( JSON.stringify( {
      output: 'Invalid repo name',
      success: false
    } ) );
    return;
  }

  isSameAsRemoteMaster( simName, successFunction( req, res, 'same' ), successFunction( req, res, 'different' ) );
}

function validateSimName( simName ) {

  // validate that it is lower-case with hyphens
  for ( let i = 0; i < simName.length; i++ ) {
    const charCode = simName.charCodeAt( i );

    // TODO: use a perennial data list as a white list, https://github.com/phetsims/special-ops/issues/170
    if ( charCode !== '-'.charCodeAt( 0 ) && ( charCode < 'a'.charCodeAt( 0 ) || charCode > 'z'.charCodeAt( 0 ) ) ) {
      return false;
    }
  }
  return true;
}

http.createServer( ( req, res ) => {

  // req.url
  // req.method
  // req.headers

  const bits = url.parse( req.url, true );
  const path = bits.pathname;
  const query = bits.query;

  if ( path === '/build' ) {
    taskBuild( req, res, query );
  }
  else if ( path === '/sim-list' ) {
    taskSimList( req, res, query );
  }
  else if ( path === '/repo-list' ) {
    taskRepoList( req, res, query );
  }
  else if ( path === '/perennial-refresh' ) {
    taskPerennialRefresh( req, res, query );
  }
  else if ( path === '/pull-all' ) {
    taskPullAll( req, res, query );
  }
  else if ( path === '/pull' ) {
    taskPull( req, res, query );
  }
  else if ( path === '/same-as-remote-master' ) {
    taskSameAsRemoteMaster( req, res, query );
  }
  else {
    res.writeHead( 403, jsonHeaders );
    res.end( JSON.stringify( {
      output: 'Unknown task',
      success: false
    } ) );
  }

  // const simName = req.url.slice( 1 );


} ).listen( port );

console.log( `running on port ${port} with root directory ${rootDir}` );
