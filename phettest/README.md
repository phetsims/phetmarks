## PhET Testing server (phettest)

This internal testing server is set up to let internal phet employees run sims off of master without having code checked
out.

This is currently available on bayes.colorado.edu/dev/phettest/

### Maintenance

The server is currently running on bayes using pm2 on the `phet-admin` account. Please see
continuous-testing-management.md for a convenient way to change users.

To pull changes for the server or front-end:

    cd /data/web/htdocs/dev/phettest/phetmarks
    git pull

To restart:

    pm2 restart phettest-server

To check on the logs:

    pm2 logs phettest-server

### To test locally:

PhET Test is a bit of a mess as it comes to testing locally. Here are some steps @zepumph used to help debug an issue
once (https://github.com/phetsims/phetmarks/issues/55)
and it made it possible to run and test locally. See the patch
in https://github.com/phetsims/phetmarks/issues/56#issue-967089770
for some of these working copy changes.

1. move the index.html to the root of your git repository structure, and change the link to `phettest.js` to point
   into `./phetmarks/phettest/phettest.js`.
1. `cd ./phetmarks/phettest/phettest-server.js`
1. `node phettest-server.js`
1. change the hard coded URLs for the server and for phettest's index at the top `phettest.js` to point to the local
   URLs you plan to use.
1. For my work in updating how to refresh perennial (and perhaps yours too!) it was helpful to stop the commands that
   occur one sim at a time and on launch of the page. (`checkSimSameMaster` and `checkCommonSameMaster` in phettest.js)
1. navigate via your normal method to the root of your directories. It will be phettest's index page.


Good luck, and talk to @zepumph if you run into trouble. 

#### (untested) Duplicating htaccess protocols used by bayes

Instead of some of the hackary above, you may be able to just utilize the same httaccess protocols that are used on bayes
to redirect you to the index page within phetmarks/ from the root. Good luck, and please update this documentation if
things work out for you.

```htaccess
RewriteEngine on
RewriteBase /dev/phettest/
RewriteRule "^phettest.js" phetmarks/phettest/phettest.js [R=302]

DirectoryIndex phetmarks/phettest/index.html index.html
```