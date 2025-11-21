import express from "express";
// import exampleController from "../controllers/example.controller.js";
import { pool } from "../database.js";
import generarToken from "../utils/generarToken.js"; // si lo tienes en otro archivo

const router = express.Router();

router.get("/", (req, res) => {
  console.log("holaaaaa");
  res.json({ mensaje: "API Proyecto Título funcionando correctamente 🚀" });
});

// router.get("/example", exampleController.example);

router.post("/login", async (req, res) => {
  const { rut, password_sha256 } = req.body;

  // 1. Buscar funcionario
  const funcionarioQuery = await pool.query(
    `
    SELECT id_funcionario, activo, nombre_funcionario, apellido_paterno, apellido_materno
    FROM funcionario
    WHERE rut_funcionario = $1
  `,
    [rut]
  );
  
  if (funcionarioQuery.rowCount === 0) {
    var respuesta = {
        ok: false,
        error: "",
        respuesta: "Usuario no existe" 
    };
 
    res.status(400).send(respuesta)
  }

  const funcionario = funcionarioQuery.rows[0];

  if (!funcionario.activo) {
    var respuesta = {
        ok: false,
        error: "",
        respuesta: "Usuario inactivo" 
    };
 
    res.status(403).send(respuesta)
  }

  // 2. Buscar usuario_sistema
  const usuarioQuery = await pool.query(
    `
    SELECT sistema.clave, sistema.activo, perfil.id_perfil
    FROM usuario_sistema sistema
    LEFT JOIN usuario_perfil perfil on perfil.id_usu_sistema = sistema.id_usu_sistema
    WHERE sistema.id_funcionario = $1
  `,
    [funcionario.id_funcionario]
  );

  if (usuarioQuery.rowCount === 0) {
    var respuesta = {
        ok: false,
        error: "",
        respuesta: "Usuario no habilitado" 
    };
 
    res.status(400).send(respuesta)
  }

  const usuario = usuarioQuery.rows[0];

  if (!usuario.activo) {
    var respuesta = {
        ok: false,
        error: "",
        respuesta: "Usuario inactivo" 
    };
 
    res.status(403).send(respuesta)
  }

  // 3. Comparar contraseña SHA256
  if (usuario.clave !== password_sha256) {
    var respuesta = {
        ok: false,
        error: "",
        respuesta: "Contraseña incorrecta" 
    };
 
    res.status(401).send(respuesta)
  }

  // 4. Login OK
  var respuesta = {
        ok: true,
        error: "",
        respuesta: "Login OK",
        token: generarToken(funcionario.id_funcionario),
        personal: {'nombre': funcionario.nombre_funcionario,'apellido_paterno': funcionario.apellido_paterno,'apellido_materno': funcionario.apellido_materno, 'id_perfil': usuario.id_perfil}
    };
      
  res.status(200).send(respuesta)

//   return res.json({
//     mensaje: "Login OK",
//     id_funcionario: funcionario.id_funcionario,
//     // token: generarToken(funcionario.id_funcionario),
//   });
});

export default router;
