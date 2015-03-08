// ==UserScript==
// @name        Google Search Filter Plus
// @description Filters google search results
// @namespace   smk
// @license     MPL 1.1; http://www.mozilla.org/MPL/MPL-1.1.html
// @include     http://www.google.tld/
// @include     http://www.google.tld/?*
// @include     http://www.google.tld/#*&q=*
// @include     http://www.google.tld/#q=*
// @include     http://www.google.tld/cse?*
// @include     http://www.google.tld/custom?*
// @include     http://www.google.tld/search?*
// @include     https://encrypted.google.com/
// @include     https://encrypted.google.com/#*&q=*
// @include     https://encrypted.google.com/search?*
// @include     https://www.google.tld/
// @include     https://www.google.tld/?*
// @include     https://www.google.tld/#*&q=*
// @include     https://www.google.tld/#q=*
// @include     https://www.google.tld/cse?*
// @include     https://www.google.tld/custom?*
// @include     https://www.google.tld/search?*
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getResourceURL
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @require     https://cdn.jsdelivr.net/jquery/2.1.3/jquery.min.js
// @require     https://cdn.jsdelivr.net/jquery.ui/1.11.3/jquery-ui.min.js
// @require     https://cdn.jsdelivr.net/jquery.event.drag/2.2/jquery.event.drag.min.js
// @require     https://rawgit.com/mleibman/SlickGrid/2.1.0/slick.core.js
// @require     https://rawgit.com/mleibman/SlickGrid/2.1.0/slick.editors.js
// @require     https://rawgit.com/mleibman/SlickGrid/2.1.0/slick.grid.js
// @resource    jquery-ui-css https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/jquery-ui.css
// @resource    jquery-ui-css/images/ui-bg_glass_55_fbf9ee_1x400.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-bg_glass_55_fbf9ee_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_65_ffffff_1x400.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-bg_glass_65_ffffff_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_75_dadada_1x400.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-bg_glass_75_dadada_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_75_e6e6e6_1x400.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-bg_glass_75_e6e6e6_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_95_fef1ec_1x400.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-bg_glass_95_fef1ec_1x400.png
// @resource    jquery-ui-css/images/ui-bg_highlight-soft_75_cccccc_1x100.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-bg_highlight-soft_75_cccccc_1x100.png
// @resource    jquery-ui-css/images/ui-icons_222222_256x240.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-icons_222222_256x240.png
// @resource    jquery-ui-css/images/ui-icons_2e83ff_256x240.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-icons_2e83ff_256x240.png
// @resource    jquery-ui-css/images/ui-icons_454545_256x240.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-icons_454545_256x240.png
// @resource    jquery-ui-css/images/ui-icons_888888_256x240.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-icons_888888_256x240.png
// @resource    jquery-ui-css/images/ui-icons_cd0a0a_256x240.png https://cdn.jsdelivr.net/jquery.ui/1.11.3/themes/smoothness/images/ui-icons_cd0a0a_256x240.png
// @resource    slickgrid-css https://rawgit.com/mleibman/SlickGrid/2.1.0/slick.grid.css
// @resource    slickgrid-css/images/sort-asc.gif https://rawgit.com/mleibman/SlickGrid/2.1.0/images/sort-asc.gif
// @resource    slickgrid-css/images/sort-desc.gif https://rawgit.com/mleibman/SlickGrid/2.1.0/images/sort-desc.gif
// ==/UserScript==
