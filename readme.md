# Google Search Filter Plus
Userscript to filter Google search results.

## Development Setup
The project is developed in PyCharm.

---

To setup the tools used for development, run:

    $ cd gfp
    $ npm install
    $ pre-commit install --hook-type pre-commit --hook-type commit-msg

---

To build the script, run:

    $ npm run script

This builds the userscript at `gfp/dist/google_search_filter_plus.user.js`.

---

Tests are done using [Jest · 🃏 Delightful JavaScript Testing](https://jestjs.io/). To run all tests do:

    $ npm run test

`jest` also allows running individual tests.

---

To debug the preferences dialog by itself, run:

    $ npm run pref

This builds a script for debugging at `gfp/dist/pref.js`.

`pref.html` can then be opened up and debugged.

## Acknowledgments
Code/dependencies:

- [adblockplus/adblockplus: DEPRECATED: Adblock Plus extension for Firefox and other Gecko-based browsers](https://github.com/adblockplus/adblockplus)
- [webismymind/editablegrid](https://github.com/webismymind/editablegrid)

People for helpful comments:

- [cho45 - Userscripts.org](https://userscripts-mirror.org/users/1965)
- [ekbworldwide - Userscripts.org](https://userscripts-mirror.org/users/39581)
- [Marti - Userscripts.org](https://userscripts-mirror.org/users/marti)
- [sizzlemctwizzle - Userscripts.org](https://userscripts-mirror.org/users/sizzle.html)
