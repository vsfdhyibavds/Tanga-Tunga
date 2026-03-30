const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = String(process.env.DB_NAME || 'rutick');
const dbUser = String(process.env.DB_USER || 'postgres');
const dbPassword = process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : 'postgres';
const dbHost = String(process.env.DB_HOST || 'localhost');
const dbPort = Number(process.env.DB_PORT || 5432);

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        underscored: true,
    }
});


const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ PostgreSQL Connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);

        // Import models and set up associations
        require('../models/index');
        console.log('✅ Models and associations loaded');

        // Sync models with database
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('✅ Database models synchronized');

        return sequelize;
    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };

