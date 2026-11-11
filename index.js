/**
 * App entry. Install crash handlers BEFORE expo-router loads any screens.
 * CommonJS require order matters — do not convert to ESM imports.
 */
'use strict';

require('./installCrashHandlers');
require('expo-router/entry');
