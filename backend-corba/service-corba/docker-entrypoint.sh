#!/bin/bash

# El nombre del host donde corre el naming service (orbd)
# Por defecto se conectará a "corba-naming" configurado en docker-compose.yml
ORB_HOST=${ORB_HOST:-localhost}

echo "=== Esperando al Servicio de Nombres (corba-naming) en $ORB_HOST ==="
sleep 3

echo "=== Iniciando Servidor CORBA (BufferServer) ==="
# Ejecutamos el servidor con Java 17 y le decimos que se conecte al orbd externo
java -Dorg.glassfish.gmbal.disable=true -Dcom.sun.CORBA.ORBDisableJMX=true \
    -cp "classes:dependency/*" \
    com.futbol.server.BufferServer \
    -ORBInitialPort 1050 \
    -ORBInitialHost $ORB_HOST
