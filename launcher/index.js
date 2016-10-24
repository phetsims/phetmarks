// Copyright 2016, University of Colorado Boulder
(function() {
  'use strict';

  /**
   * Read a file over XHR and return the contents in a callback
   * @param {string} path
   * @param {function} callback
   *
   * TODO: duplicated with readFile.js
   */
  window.readFile = function( path, callback ) {
    var xhr = new XMLHttpRequest();
    xhr.open( 'GET', path );
    xhr.send( null );

    xhr.onreadystatechange = function() {
      if ( xhr.readyState === 4 /*done*/ && xhr.status === 200 /*ok*/ ) {
        callback( xhr.responseText );
      }
    };
  };

  window.readFile( '../../chipper/data/active-sims', function( activeSimsString ) {
    var activeSims = activeSimsString.split( /\r?\n/ );

    var listHTML = '';
    activeSims.forEach( function( sim ) {
      if ( sim.trim().length > 0 ) {
        listHTML = listHTML + '<option value="' + sim + '">' + sim + '</option>';
      }
    } );

    document.getElementById( 'simList' ).innerHTML = listHTML;

    // Init localStorage to remember what the user selected last
    var simList = document.getElementById( 'simList' );
    var appList = document.getElementById( 'appList' );
    var showPointerAreasCheckbox = document.getElementById( 'showPointerAreasCheckbox' );

    if ( localStorage.getItem( 'sim' ) ) {
      simList.value = localStorage.getItem( 'sim' );
    }
    if ( localStorage.getItem( 'app' ) ) {
      appList.value = localStorage.getItem( 'app' );
    }
    if ( localStorage.getItem( 'showPointerAreas' ) ) {
      showPointerAreasCheckbox.checked = localStorage.getItem( 'showPointerAreas' ) === 'true';
    }

    // When values change, persist them
    simList.addEventListener( 'change', function() {localStorage.setItem( 'sim', simList.value );}, false );
    appList.addEventListener( 'change', function() {localStorage.setItem( 'app', appList.value );}, false );
    showPointerAreasCheckbox.addEventListener( 'change', function() {
      localStorage.setItem( 'showPointerAreas', showPointerAreasCheckbox.checked ? 'true' : 'false' );
    } );

    // When "launch" is pressed, launch the selected app
    var launch = function() {

      var sim = simList.value;
      var wrapper = appList.value;

      if ( wrapper === 'Formatted Console Output' ) {

        // Launch the simulation with console output (no iframe)
        window.location = '../../' + sim + '/' + sim + '_en.html?ea&brand=phet-io&phet-io.standalone&phet-io.log=lines';
      }
      else if ( wrapper === 'PhET Brand' ) {

        var showPointerAreas = showPointerAreasCheckbox.checked ? '&showPointerAreas' : '';
        // Launch the simulation normally in requirejs mode
        window.location = '../../' + sim + '/' + sim + '_en.html?ea&brand=phet' + showPointerAreas;
      }
      else {

        // Launch app that includes the sim in an iframe
        window.location = '../../phet-io/wrappers/' + wrapper + '/' + wrapper + '.html?sim=' + sim;
      }
    };
    document.getElementById( 'launchButton' ).addEventListener( 'click', launch );

    document.getElementById( 'loginButton' ).addEventListener( 'click', function() {
      var sim = simList.value;
      var wrapper = appList.value;
      window.location = '../../phet-io/wrappers/login/login.html?sim=' + sim + '&wrapper=' + wrapper + '&validationRule=validateFromList';
    } );

    // Focus on the sim list so it is highlighted brighter and you can type in the sim name to select it.
    simList.focus();

    // Launch the simulation when the user presses enter
    window.addEventListener( 'keydown', function( event ) {

      // Check for enter key
      if ( event.which === 13 ) {
        launch();
      }
    }, false );
  } );
})();