// ==UserScript==
// @name        Google Search Filter Plus
// @description Filters google search results
// @namespace   smk
// @license     MPL 1.1; http://www.mozilla.org/MPL/MPL-1.1.html
// @include     http://www.google.tld/
// @include     http://www.google.tld/#*&q=*
// @include     http://www.google.tld/#q=*
// @include     http://www.google.tld/cse?*
// @include     http://www.google.tld/custom?*
// @include     http://www.google.tld/search?*
// @include     https://encrypted.google.com/
// @include     https://encrypted.google.com/#*&q=*
// @include     https://encrypted.google.com/search?*
// @include     https://www.google.tld/
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
// @require     https://code.jquery.com/jquery-2.1.3.min.js
// @require     https://code.jquery.com/ui/1.11.3/jquery-ui.min.js
// @require     https://js.cybozu.com/jqgrid/v4.7.1/jquery.jqGrid.min.js
// @require     https://js.cybozu.com/jqgrid/v4.7.1/i18n/grid.locale-en.js
// @resource    jquery-ui-css https://code.jquery.com/ui/1.11.3/themes/smoothness/jquery-ui.css
// @resource    jquery-ui-css/images/ui-bg_flat_0_aaaaaa_40x100.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_flat_0_aaaaaa_40x100.png
// @resource    jquery-ui-css/images/ui-bg_flat_75_ffffff_40x100.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_flat_75_ffffff_40x100.png
// @resource    jquery-ui-css/images/ui-bg_glass_55_fbf9ee_1x400.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_glass_55_fbf9ee_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_65_ffffff_1x400.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_glass_65_ffffff_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_75_dadada_1x400.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_glass_75_dadada_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_75_e6e6e6_1x400.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_glass_75_e6e6e6_1x400.png
// @resource    jquery-ui-css/images/ui-bg_glass_95_fef1ec_1x400.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_glass_95_fef1ec_1x400.png
// @resource    jquery-ui-css/images/ui-bg_highlight-soft_75_cccccc_1x100.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-bg_highlight-soft_75_cccccc_1x100.png
// @resource    jquery-ui-css/images/ui-icons_222222_256x240.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-icons_222222_256x240.png
// @resource    jquery-ui-css/images/ui-icons_2e83ff_256x240.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-icons_2e83ff_256x240.png
// @resource    jquery-ui-css/images/ui-icons_454545_256x240.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-icons_454545_256x240.png
// @resource    jquery-ui-css/images/ui-icons_888888_256x240.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-icons_888888_256x240.png
// @resource    jquery-ui-css/images/ui-icons_cd0a0a_256x240.png https://code.jquery.com/ui/1.11.3/themes/smoothness/images/ui-icons_cd0a0a_256x240.png
// @resource    jqgrid-css https://js.cybozu.com/jqgrid/v4.7.1/css/ui.jqgrid.css
// ==/UserScript==
