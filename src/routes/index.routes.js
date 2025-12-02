import express from "express";
import { pool } from "../database.js";
import generarToken from "../utils/generarToken.js";

const router = express.Router();

/* =====================================================
   STATUS API
===================================================== */

router.get("/", (req, res) => {
  res.json({ mensaje: "API Proyecto Título funcionando correctamente 🚀" });
});

/* =====================================================
   LOGIN
===================================================== */

router.post("/login", async (req, res) => {
  const { rut, password_sha256 } = req.body;

  try {
    const funcionarioQuery = await pool.query(
      `
      SELECT id_funcionario, activo, nombre_funcionario, apellido_paterno, apellido_materno
      FROM funcionario
      WHERE rut_funcionario = $1
      `,
      [rut]
    );

    if (funcionarioQuery.rowCount === 0) {
      return res.status(400).json({ ok: false, respuesta: "Usuario no existe" });
    }

    const funcionario = funcionarioQuery.rows[0];
    if (!funcionario.activo) {
      return res.status(403).json({ ok: false, respuesta: "Usuario inactivo" });
    }

    const usuarioQuery = await pool.query(
      `
      SELECT sistema.clave, sistema.activo, perfil.id_perfil
      FROM usuario_sistema sistema
      LEFT JOIN usuario_perfil perfil 
        ON perfil.id_usu_sistema = sistema.id_usu_sistema
      WHERE sistema.id_funcionario = $1
      `,
      [funcionario.id_funcionario]
    );

    if (usuarioQuery.rowCount === 0) {
      return res.status(400).json({ ok: false, respuesta: "Usuario no habilitado" });
    }

    const usuario = usuarioQuery.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ ok: false, respuesta: "Usuario inactivo" });
    }

    if (usuario.clave !== password_sha256) {
      return res.status(401).json({ ok: false, respuesta: "Contraseña incorrecta" });
    }

    return res.status(200).json({
      ok: true,
      respuesta: "Login OK",
      token: generarToken(funcionario.id_funcionario),
      personal: {
        nombre: funcionario.nombre_funcionario,
        apellido_paterno: funcionario.apellido_paterno,
        apellido_materno: funcionario.apellido_materno,
        id_perfil: usuario.id_perfil,
      },
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ ok: false, respuesta: "Error interno" });
  }
});

/* =====================================================
   ENDPOINTS PARA CONSUMIR LAS VISTAS
===================================================== */
router.put("/paciente/actualizar", async (req, res) => {
  try {
    const {
      identificador,
      fecha_nacimiento,
      pais,
      sexo,
      genero,
      prevision,
      religion,
      estado_civil,
      pueblo_indigena,
      ocupacion
    } = req.body;

    const query = `
      SELECT actualizar_paciente(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      ) AS data;
    `;

    const values = [
      identificador,
      fecha_nacimiento,
      pais,
      sexo,
      genero,
      prevision,
      religion,
      estado_civil,
      pueblo_indigena,
      ocupacion
    ]; 
    
    const result = await pool.query(query, values);

    return res.json({ ok: true, data: result.rows[0].data });
  } catch (error) {
    console.error("Error al actualizar paciente:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


router.post("/solicitud", async (req, res) => {
  try {
    const {
      identificador,
      episodio,
      fecha_solicitud,
      tipo_solicitud,
      observacion,
      id_estado,
      glosa_estado,
      correo_contacto
    } = req.body;

    const query = `
      SELECT insertar_solicitud(
        $1, $2, $3, $4, $5, $6, $7, $8
      ) AS data;
    `;

    const values = [
      identificador,
      episodio,
      fecha_solicitud,
      tipo_solicitud,
      observacion,
      id_estado,
      glosa_estado,
      correo_contacto
    ];

    const result = await pool.query(query, values);
    res.json({ ok: true, data: result.rows[0].data });

  } catch (error) {
    console.error("Error al guardar solicitud:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});



router.post("/retroalimentacion", async (req, res) => {
  try {
    const {
      identificador_emisor,
      identificador_afectado,
      fecha_solicitud,
      id_tipo,
      glosa_tipo,
      observacion
    } = req.body;

    // Query que llama a la función SQL
    const query = `
      SELECT insertar_retroalimentacion(
        $1, $2, $3, $4, $5, $6
      ) AS data;
    `;

    const values = [
      identificador_emisor,
      identificador_afectado,
      fecha_solicitud,
      1,
      glosa_tipo,
      observacion
    ];

    const result = await pool.query(query, values);
    return res.json({ ok: true, data: result.rows[0].data });

  } catch (error) {
    console.error("Error al guardar retroalimentación:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/* 1. OBTENER PACIENTE POR IDENTIFICADOR */
router.get("/paciente/:identificador", async (req, res) => {
  const { identificador } = req.params;
  const query = `SELECT * FROM vw_pacientes_guardados WHERE identificador = $1`;
  const result = await pool.query(query, [identificador]);
  res.json(result.rows[0] ?? {});
});

/* 2. LISTA PACIENTES TOTAL */
router.get("/pacientes/total", async (req, res) => {
  const result = await pool.query("SELECT * FROM vw_lista_paciente_total");
  res.json(result.rows);
});

/* 3. PACIENTES GUARDADOS */
router.get("/pacientes/guardados", async (req, res) => {
  const result = await pool.query("SELECT * FROM vw_pacientes_guardados");
  res.json(result.rows);
});

/* 4. ANTERIORES ATENCIONES (POR IDENTIFICADOR) */
router.get("/anteriores-atenciones/:identificador", async (req, res) => {
  const { identificador } = req.params;
  const query = `
      SELECT * 
      FROM vw_anteriores_atenciones 
      WHERE identificador_paciente = $1
      ORDER BY fecha DESC
  `;
  const result = await pool.query(query, [identificador]);
  res.json(result.rows);
});

/* 5. RESULTADOS TOTALES (POR IDENTIFICADOR) */
router.get("/resultados/:identificador", async (req, res) => {
  const { identificador } = req.params;
  const query = `
      SELECT * 
      FROM vw_resultados_totales
      WHERE identificador_paciente = $1
  `;
  const result = await pool.query(query, [identificador]);
  res.json(result.rows);
});

/* 6. PRÓXIMAS ATENCIONES (POR IDENTIFICADOR) */
router.get("/proximas-atenciones/:identificador", async (req, res) => {
  const { identificador } = req.params;
  const query = `
      SELECT * 
      FROM vw_proximas_atenciones 
      WHERE identificador_paciente = $1
      ORDER BY fecha ASC
  `;
  const result = await pool.query(query, [identificador]);
  
  
  res.json(result.rows);
});

/* 7. SOLICITUDES DE LABORATORIO (POR IDENTIFICADOR) */
router.get("/solicitudes-laboratorio/:identificador", async (req, res) => {
  const { identificador } = req.params;
  const query = `
      SELECT *
      FROM vw_solicitudes_laboratorio
      WHERE identificador_paciente = $1
  `;
  const result = await pool.query(query, [identificador]);
  res.json(result.rows);
});

/* 8. LISTA SOLICITUDES (OIRS) */
router.get("/solicitudes/total", async (req, res) => {
  const result = await pool.query("SELECT * FROM vw_lista_solicitud_total");
  res.json(result.rows);
});

/* 9. LISTA RETROALIMENTACIÓN (OIRS) */
router.get("/retroalimentacion/total", async (req, res) => {
  const result = await pool.query("SELECT * FROM vw_lista_retroalimentacion_total");
  res.json(result.rows);
});

export default router;
