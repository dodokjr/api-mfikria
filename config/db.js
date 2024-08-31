const { Pool } = require('pg')

const pool = new Pool({
    connectionString: "postgres://default:fbWDGRqm8n7o@ep-bold-bonus-a1cl0jto.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
})

pool.connect((err) =>
{
    if (err) throw err
    console.log("Connect to PostgreSQL successfully!")
})

module.exports = pool