// Copyright 2020, University of Colorado Boulder

// will be replaced by domain name in the future
var domain = 'https://bayes.colorado.edu/';
var serverURL = `${domain}phettest-server/`;
var phettestURL = `${domain}phettest/`;

// common repo fields
var commonSameMasterStatusElements = {};
var commonRows = [];
var outOfDateCommonRows = [];
var showAllCommon = true;
var showOutOfDateCommon = false;
var commonCheckingStatus = document.getElementById( 'commonCheckingStatus' );

// sim repo fields
var simSameMasterStatusElements = {};
var simRows = [];
var outOfDateSimRows = [];
var showAllSims = true;
var showOutOfDateSims = false;
var simCheckingStatus = document.getElementById( 'simCheckingStatus' );

function updateOutOfDateCommon() {
  outOfDateCommonRows.forEach( function( row ) {
    if ( !showAllCommon ) {
      row.style.display = showOutOfDateCommon ? 'table-row' : 'none';
    }
  } );
}

function updateAllCommon() {
  commonRows.forEach( function( row ) {
    row.style.display = showAllCommon ? 'table-row' : 'none';
  } );
}

var commonFilterRadioOut = document.getElementById( 'commonFilterRadioOut' );
commonFilterRadioOut.addEventListener( 'change', function() {
  commonFilter( true );
} );

var commonFilterRadioAll = document.getElementById( 'commonFilterRadioAll' );
commonFilterRadioAll.addEventListener( 'change', function() {
  commonFilter( false );
} );

function commonFilter( isFiltered ) {

  showOutOfDateCommon = isFiltered;
  showAllCommon = !isFiltered;

  commonCheckingStatus.style.display = isFiltered ? 'block' : 'none';

  updateAllCommon();
  isFiltered && updateOutOfDateCommon();
}

function updateOutOfDateSims() {
  outOfDateSimRows.forEach( function( row ) {
    if ( !showAllSims ) {
      row.style.display = showOutOfDateSims ? 'table-row' : 'none';
    }
  } );
}

function updateAllSims() {
  simRows.forEach( function( row ) {
    row.style.display = showAllSims ? 'table-row' : 'none';
  } );
}

var simFilterRadioOut = document.getElementById( 'simFilterRadioOut' );
simFilterRadioOut.addEventListener( 'change', function() {
  simFilter( true );
} );

var simFilterRadioAll = document.getElementById( 'simFilterRadioAll' );
simFilterRadioAll.addEventListener( 'change', function() {
  simFilter( false );
} );

function simFilter( isFiltered ) {

  showOutOfDateSims = isFiltered;
  showAllSims = !isFiltered;

  simCheckingStatus.style.display = isFiltered ? 'block' : 'none';

  updateAllSims();
  isFiltered && updateOutOfDateSims();
}

function checkSimSameMaster( reposToCheck ) {
  if ( reposToCheck === undefined ) {
    reposToCheck = Object.keys( simSameMasterStatusElements );
  }

  function checkSim( sim ) {
    var statusElement = simSameMasterStatusElements[ sim ].status;
    $( statusElement ).text( '?' );
    statusElement.className = 'masterStatus';
    $.ajax( serverURL + 'same-as-remote-master?repo=' + sim ).done( function( data ) {
      if ( data.output === 'same' ) {
        $( statusElement ).text( 'up-to-date' );
        statusElement.className = 'masterStatus masterUpToDate';
        outOfDateSimRows = remove( outOfDateSimRows, simSameMasterStatusElements[ sim ].row );
      }
      else if ( data.output === 'different' ) {
        $( statusElement ).text( 'out-of-date' );
        statusElement.className = 'masterStatus masterOutOfDate';
        outOfDateSimRows.push( simSameMasterStatusElements[ sim ].row );
        updateOutOfDateSims();
      }
      else {
        $( statusElement ).text( 'failed' );
        statusElement.className = 'masterStatus masterFailed';
      }
      if ( reposToCheck.length ) {

        checkSim( reposToCheck.shift() );
      }
      else {

        updateSimCheckingStatus( true );
      }
    } ).fail( function() {
      $( statusElement ).text( 'failed' );
      statusElement.className = 'masterStatus masterFailed';
      reposToCheck.length && checkSim( reposToCheck.shift() );
    } );
  }

  checkSim( reposToCheck.shift() );
}

function updateSimCheckingStatus( done ) {

  if ( done ) {
    if ( outOfDateSimRows.length ) {
      $( simCheckingStatus ).text( '' );
    }
    else {
      $( simCheckingStatus ).text( 'No out-of-date simulation repositories!' );
    }
  }
  else {
    $( simCheckingStatus ).text( 'checking...' );
  }
}

function checkCommonSameMaster( reposToCheck ) {
  if ( reposToCheck === undefined ) {
    reposToCheck = Object.keys( commonSameMasterStatusElements );
  }

  function checkCommon( commonRepo ) {
    var statusElement = commonSameMasterStatusElements[ commonRepo ].status;
    $( statusElement ).text( '?' );
    statusElement.className = 'masterStatus';
    $.ajax( serverURL + 'same-as-remote-master?repo=' + commonRepo ).done( function( data ) {
      if ( data.output === 'same' ) {
        $( statusElement ).text( 'up-to-date' );
        statusElement.className = 'masterStatus masterUpToDate';
        outOfDateCommonRows = remove( outOfDateCommonRows, commonSameMasterStatusElements[ commonRepo ].row );
      }
      else if ( data.output === 'different' ) {
        $( statusElement ).text( 'out-of-date' );
        statusElement.className = 'masterStatus masterOutOfDate';
        outOfDateCommonRows.push( commonSameMasterStatusElements[ commonRepo ].row );
        updateOutOfDateCommon();
      }
      else {
        $( statusElement ).text( 'failed' );
        statusElement.className = 'masterStatus masterFailed';
      }

      if ( reposToCheck.length ) {

        checkCommon( reposToCheck.shift() );
      }
      else {

        updateCommonCheckingStatus( true );
      }
    } ).fail( function() {
      $( statusElement ).text( 'failed' );
      statusElement.className = 'masterStatus masterFailed';
      reposToCheck.length && checkCommon( reposToCheck.shift() );
    } );
  }

  checkCommon( reposToCheck.shift() );
}

function updateCommonCheckingStatus( done ) {

  if ( done ) {
    if ( outOfDateCommonRows.length ) {
      $( commonCheckingStatus ).text( '' );
    }
    else {
      $( commonCheckingStatus ).text( 'No out-of-date common repositories!' );
    }
  }
  else {
    $( commonCheckingStatus ).text( 'checking...' );
  }
}

document.getElementById( 'pullAll' ).addEventListener( 'click', function() {
  var status = document.getElementById( 'pullStatus' );
  $( status ).text( 'pulling...' );
  $.ajax( serverURL + 'pull-all' ).done( function( data ) {
    $( status ).text( '' );

    checkCommonSameMaster();
    checkSimSameMaster();
  } ).fail( function() {
    $( status ).text( 'pull failed' );
  } );
} );

document.getElementById( 'perennialRefresh' ).addEventListener( 'click', function() {
  var status = document.getElementById( 'perennialStatus' );
  $( status ).text( 'refreshing perennial' );
  $.ajax( serverURL + 'perennial-refresh' ).done( function( data ) {
    $( status ).text( '' );

    updateCommonRepos();
    updateSims();
    updateCommonCheckingStatus( false );
    updateSimCheckingStatus( false );
  } ).fail( function() {
    $( status ).text( 'perennial refresh failed' );
  } );
} );

function remove( array, element ) {
  return array.filter( e => e !== element );
}

function updateCommonRepos() {
  var commonTable = document.getElementById( 'common' );
  while ( commonTable.childNodes.length ) {
    commonTable.removeChild( commonTable.childNodes[ 0 ] );
  }
  $.ajax( serverURL + 'sim-list' ).done( function( data ) {
    var sims = data.output;

    $.ajax( serverURL + 'repo-list' ).done( function( data ) {
      var repos = data.output;
      const commonRepos = repos.filter( function( repo ) {
        return !_.includes( sims, repo );
      } );

      _.each( commonRepos, function( commonRepoName ) {
        // row
        var tr = document.createElement( 'tr' );
        commonTable.appendChild( tr );

        function cell( element ) {
          var td = document.createElement( 'td' );
          tr.appendChild( td );
          td.appendChild( element );
        }

        function linkCell( text, url ) {
          var a = document.createElement( 'a' );
          $( a ).text( text );
          a.href = url;
          cell( a );
        }

        function actionCell( text, url ) {
          var button = document.createElement( 'button' );
          var status = document.createElement( 'span' );
          status.className = 'status';
          $( button ).text( text );
          button.addEventListener( 'click', function() {
            $( status ).text( 'running' );
            $.ajax( url ).done( function handle( data ) {
              if ( data.success ) {
                $( status ).text( '' );
              }
              else {
                $( status ).text( 'failed' );
                console.error( data );
              }
              checkCommonSameMaster( [ commonRepoName ] );
            } ).fail( function( xhr ) {
              $( status ).text( 'failed' );
              console.error( xhr );
            } );
          } );
          cell( button );
          cell( status );
        }

        function sameAsMasterCell( commonRepoName ) {
          var status = document.createElement( 'span' );
          status.className = 'masterStatus';
          $( status ).text( '?' );
          commonSameMasterStatusElements[ commonRepoName ] = { row: tr, status: status };
          cell( status );
        }

        var name = document.createElement( 'div' );
        name.textContent = commonRepoName;
        cell( name );
        sameAsMasterCell( commonRepoName );
        actionCell( 'Pull', serverURL + 'pull?sim=' + commonRepoName );
        linkCell( 'GitHub Issues', 'http://github.com/phetsims/' + commonRepoName + '/issues' );

        commonRows.push( tr );
      } );

      updateAllCommon();
      checkCommonSameMaster();
    } );
  } );
}

function updateSims() {
  var simsTable = document.getElementById( 'sims' );
  while ( simsTable.childNodes.length ) {
    simsTable.removeChild( simsTable.childNodes[ 0 ] );
  }
  $.ajax( serverURL + 'sim-list' ).done( function( data ) {
    var sims = data.output;

    _.each( sims, function( simName ) {
      // row
      var tr = document.createElement( 'tr' );
      simsTable.appendChild( tr );

      function cell( element ) {
        var td = document.createElement( 'td' );
        tr.appendChild( td );
        td.appendChild( element );
      }

      function linkCell( text, url ) {
        var a = document.createElement( 'a' );
        $( a ).text( text );
        a.href = url;
        cell( a );
      }

      function actionCell( text, url ) {
        var button = document.createElement( 'button' );
        var status = document.createElement( 'span' );
        status.className = 'status';
        $( button ).text( text );
        button.addEventListener( 'click', function() {
          $( status ).text( 'running' );
          $.ajax( url ).done( function handle( data ) {
            if ( data.success ) {
              $( status ).text( '' );
            }
            else {
              $( status ).text( 'failed' );
              console.error( data );
            }
            checkSimSameMaster( [ simName ] );
          } ).fail( function( xhr ) {
            $( status ).text( 'failed' );
            console.error( xhr );
          } );
        } );
        cell( button );
        cell( status );
      }

      function sameAsMasterCell( simName ) {
        var status = document.createElement( 'span' );
        status.className = 'masterStatus';
        $( status ).text( '?' );
        simSameMasterStatusElements[ simName ] = { row: tr, status: status };
        cell( status );
      }

      linkCell( simName, serverURL +  simName + '/' + simName + '_en.html?ea&brand=phet' );
      sameAsMasterCell( simName );
      actionCell( 'Pull', serverURL + 'pull?sim=' + simName );
      actionCell( 'Build', serverURL + 'build?sim=' + simName );
      linkCell( 'Built Version', phettestURL + simName + '/build/phet/' + simName + '_en_phet.html' );
      linkCell( 'GitHub Issues', 'http://github.com/phetsims/' + simName + '/issues' );
      linkCell( 'Dev', 'https://phet-dev.colorado.edu/html/' + simName );
      linkCell( 'Production', 'http://phet.colorado.edu/sims/html/' + simName + '/latest/' + simName + '_en.html' );

      simRows.push( tr );
    } );

    updateAllSims();
    checkSimSameMaster();
  } );
}

updateCommonRepos();
updateSims();
updateCommonCheckingStatus( false );
updateSimCheckingStatus( false );
commonFilter( false );
simFilter( false );
  