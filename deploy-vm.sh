#!/bin/bash
# Script de despliegue en VM con SSL automatico
# Uso: ./deploy-vm.sh

set -e

echo "Creando directorios para nginx-proxy..."
mkdir -p nginx/certs nginx/vhost.d nginx/html

echo "Levantando servicios con SSL..."
docker compose -f docker-compose.yml -f docker-compose.vm.yml --profile vm up -d

echo "Listo. Accede en https://futbolclub.duckdns.org"
