import jwt from "jsonwebtoken";

const SECRET = "CLAVE_SUPER_SECRETA_PORTAL_PACIENTE_2024"; // cámbiala por algo más random

const generarToken = (id_funcionario) => {
  return jwt.sign(
    { id_funcionario },   // payload
    SECRET,               // clave secreta
    { expiresIn: "1h" }   // duración del token
  );
};

export default generarToken;
