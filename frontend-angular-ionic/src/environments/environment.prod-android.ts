// Entorno de producción para builds Android.
// Usa la IP de tu VM externa en lugar de rutas relativas.
const VM_IP = '35.255.218.37';

export const environment = {
  production: true,
  nodeApiUrl: `http://${VM_IP}:3000/api`,
  javaApiUrl: `http://${VM_IP}:8080/api`,
  corbaApiUrl: `http://${VM_IP}:8089/corba-bridge/api`,
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
