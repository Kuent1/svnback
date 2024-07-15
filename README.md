# API SVN Creator

Ceci est le dépôt Git de l'API Backend du projet SVN Creator, une interface de facilitation de création de dépôts [Subversion (SVN)](https://subversion.apache.org/).

## Dépendances de déploiement

Cette API est à utiliser de façon jointe avec l'[interface web SVN Creator](https://github.com/Kuent1/svnfront), ou à déployer sur AWS via [ce projet d'infrastructure](https://github.com/Kuent1/svn_docker_swarm).

## Présentation

Ce projet utilise Node JS dans sa version LTS. 

L'API est exposée par défaut sur le port 3000 et comporte deux routes :

`GET /ping`: healthcheck de l'application. Cette route est appelée au démarrage de l'interface web.
`POST /create`: cette route envoie une commande de création de dépôt SVN à l'hôte, puis génère les fichiers de configurations nécessaires.

Le corps de la requête suit la syntaxe suivante:

```json
{ 
    "repoName": "nom_du_dépôt",
    "users": [
        {
            "username": "user1",
            "password": "password"
        },
        {
            "username": "user 2",
            "password": "password"
        }
    ],
    "fileLock": true
}
```

## Déploiement local

Cloner le code source 
```bash
git clone https://github.com/Kuent1/svnback
```

Créer un fichier .env à la racine du projet et suivre la syntaxe du fichier `.env.example`

Installer les dépendences Node

```bash
npm install
```

Lancer l'API

```bash
node app.js
```

L'API est désormais disponible sur le port 3000. Les logs sont disponibles dans `/logs`.