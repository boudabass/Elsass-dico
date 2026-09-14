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
# /opt/prisma-cli est un répertoire à part entière (Dockerfile, étage final) :
# binaire, dépendances, schéma ET config y vivent ensemble, pour que la
# résolution de module de prisma.config.ts (dotenv, prisma/config) ne
# traverse jamais vers /app. D'où le `cd` — en sous-shell, pour que le process
# final (`exec "$@"` plus bas) garde /app comme répertoire courant.
( cd /opt/prisma-cli && ./node_modules/.bin/prisma migrate deploy )

echo "→ démarrage"
exec "$@"
