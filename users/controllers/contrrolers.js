const pool = require("../../config/db.js")

const contrroller = {
    getAll: async (req, res) =>
    {
        try
        {
            const { rows } = await pool.query("select * from users")
            res.json({ msg: "OK", data: rows })
        } catch (error)
        {
            res.json({ msg: error.msg })
        }
    },

    createUsers: async (req, res) =>
    {
        try
        {
            const name = req.body.name;
            const email = req.body.email;
            const password = req.body.password;
            if (!name || !email || !password)
            {
                res.status(400).send({
                    succes: false,
                    msg: "tidak ada data yang di input"
                })
            }

            const sql = `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}')`
            await pool.query(sql)

            res.status(200).send({
                succes: true,
                msg: "data tersimpan"
            })
        } catch (error)
        {
            res.status(500).send({
                succes: false,
                error: error
            })
        }
    }
}

module.exports = contrroller