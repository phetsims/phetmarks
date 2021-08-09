

## PhET Testing server (phettest)

This internal testing server is set up to let internal phet employees run sims off of master without having 
code checked out.

This is currently available on bayes.colorado.edu/dev/phettest/ 

### Maintenance

The server is currently running on bayes using pm2 on the `phet-admin` account.  Please see continuous-testing-management.md 
for a convenient way to change users.

To pull changes for the server or front-end:

    cd /data/web/htdocs/dev/phettest/phetmarks
    git pull

To restart:

    pm2 restart phettest-server
  
To check on the logs:

    pm2 logs phettest-server
    
    