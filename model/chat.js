var Sequelize = require('sequelize');

var sequelize = new Sequelize('postgres://postgres@localhost:5432/afrLublin_database');

var ChatU = sequelize.define('ChatUsers', {
    nick: {
        type: Sequelize.STRING,
        primaryKey: false,
        allowNull: true
    },
    msg: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: true
    },
    posted: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        unique: false,
        allowNull: false
    }});

sequelize.sync()
  .then(() => console.log('ChatUser table has been successfully created, if one doesn\'t exist'))
  .catch(error => console.log('This error occured', error));

    module.exports = ChatU;
