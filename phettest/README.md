

## phettest.colorado.edu

This internal testing server is set up to let internal phet employees run sims off of master without having 
code checked out.

This must be accessed from on campus or via a VPN. 

### implementation notes

* Currently this runs on Turing
* The server, `index-server.js`, runs via `pm2`
* Access to the ~/phet/ directory over http is through apache, and is configured in `/etc/apache2/httpd.conf`

