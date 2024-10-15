const Sequelize = require("sequelize");

// Vérifier si DATABASE_URL est bien définie dans les variables d'environnement
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Configuration de Sequelize pour la base de données PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  dialectModule: require('pg'),
  dialectOptions: {
    ssl: {
      require: true,               // Assure que SSL est bien requis
      rejectUnauthorized: false     // Nécessaire si le certificat SSL n'est pas strictement validé
    }
  },
  pool: {
    max: 5,           // Nombre maximum de connexions simultanées
    min: 0,           // Nombre minimum de connexions à maintenir ouvertes
    acquire: 30000,   // Temps maximum que Sequelize va essayer de se connecter avant d'échouer
    idle: 10000       // Temps maximum qu'une connexion inutilisée peut rester ouverte avant d'être fermée
  },
  logging: console.log // Activer les logs pour suivre les requêtes SQL
});

// Initialisation de l'objet `db` qui contiendra toutes les associations
const db = {};

// Ajouter Sequelize à l'objet `db`
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importation des modèles
db.articles = require("./article.model.js")(sequelize, Sequelize);
db.user = require("../models/user.model.js")(sequelize, Sequelize);
db.role = require("../models/role.model.js")(sequelize, Sequelize);
db.comment = require("../models/comment.model.js")(sequelize, Sequelize);

// Définir les associations entre les rôles et les utilisateurs
db.role.belongsToMany(db.user, {
  through: "user_roles"
});
db.user.belongsToMany(db.role, {
  through: "user_roles"
});

// Définir les associations pour Comment (commentaires)
db.comment.associate = (models) => {
  db.comment.belongsTo(models.user, {
    foreignKey: 'userId',
    as: 'user' // Inclure les informations de l'utilisateur dans les commentaires
  });
  db.comment.belongsTo(models.articles, {
    foreignKey: 'articleId',
    as: 'article' // Inclure les informations de l'article dans les commentaires
  });
};

// Définir les associations pour Article
db.articles.associate = (models) => {
  db.articles.hasMany(models.comment, {
    foreignKey: 'articleId',
    as: 'comments' // Récupérer les commentaires associés à un article
  });
};

// Définir les associations pour User
db.user.associate = (models) => {
  db.user.hasMany(models.comment, {
    foreignKey: 'userId',
    as: 'comments' // Récupérer les commentaires associés à un utilisateur
  });
};

// Définir les rôles possibles
db.ROLES = ["user", "admin", "moderator"];

// Appel des associations après la définition de tous les modèles
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Exporter l'objet `db` pour l'utiliser ailleurs dans le projet
module.exports = db;
