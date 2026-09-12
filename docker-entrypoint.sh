#!/bin/sh
# Applique les migrations en attente, puis démarre l'app.
#
# `set -e` est ici l'essentiel : si une migration échoue, le conteneur ne
# démarre PAS. Une app qui répond 200 sur un schéma qu'elle croit à jour est
# exactement le mode de panne qui a coûté trois incidents à ce projet — il vaut
# mieux un conteneur qui refuse de monter, parce que celui-là se voit.
set -e

if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL absente : refus de démarrer." >&2
    echo "C'est une variable RUNTIME de Coolify, jamais une Build Variable." >&2
    exit 1
fi

echo "→ prisma migrate deploy"
npx --no-install prisma migrate deploy

echo "→ démarrage"
exec "$@"
