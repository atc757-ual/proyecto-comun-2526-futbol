const VM_HOST = 'https://futbolclub.duckdns.org';

export const environment = {
  production: true,
  nodeApiUrl: `${VM_HOST}/node-api`,
  javaApiUrl: `${VM_HOST}/java-api`,
  corbaApiUrl: `${VM_HOST}/corba-api`,
  firebaseConfig: {
    apiKey: "AIzaSyAC7hh8gwRLaqdfHCN04DSDBiv8nsLWx30",
    authDomain: "proyecto-final-8f184.firebaseapp.com",
    projectId: "proyecto-final-8f184",
    storageBucket: "proyecto-final-8f184.firebasestorage.app",
    messagingSenderId: "1085547830836",
    appId: "1:1085547830836:web:1452a0b0e687315cfc3461",
    measurementId: "G-VGXNVZRTL8"
  },
  useJavaBackend: false
};
