// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Ionic constructs icon URLs with document.baseURI. In Karma (about:blank) this
// fails with "Invalid base URL". Setting a <base> tag fixes it silently.
const base = document.createElement('base');
base.href = 'http://localhost:9876/';
document.head.prepend(base);

// Aumentar timeout para componentes Ionic que cargan chunks asíncronamente
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
