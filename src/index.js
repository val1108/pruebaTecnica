//Declarar variables e importar modulos
const path = require("path");
const port = 3000;
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const database = require("../src/database/db").mongoURIlocal;
const userModel = require("../src/model/user");
const jwt = require("jsonwebtoken");
const secretKey = "supersecret";
const options = {
  expiresIn: "1h", // El token expirará en 1 hora
};

//Configurar lectura de datos
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

//Conectar base de datos
mongoose
  .connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Conexion exitosa");
  })
  .catch((error) => {
    console.error("Error de conexion", error);
  });

//Verificar puerto
app.listen(port, () => {
  console.log(`La app esta escuchando en http://localhost:${port}`);
});

//Get para mostrar Front
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public", "index.html"));
});

//Get para mostrar usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await userModel.find();
    const userShow = usuarios.map((usuario) => usuario.user);
    res.json(userShow);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).send("Error interno del servidor");
  }
});

//Post para registrar
app.post("/registrar", async (req, res) => {
  const { user, password, email, phone } = req.body;
  try {
    const newUser = new userModel({ user, password, email, phone });
    await newUser.save();
    console.log("Exito");
    res.status(200).send("Usuario registrado con exito");
  } catch (error) {
    console.error("Error al registrar", error);
    res.status(500).send("Error en el registro");
  }
});

//Post para autenticar
app.post("/autenticar", async (req, res) => {
  const { user, password } = req.body;
  try {
    const userFind = await userModel.findOne({ user });
    if (!userFind) {
      return res.status(500).send("El usuario no existe");
    }
    const isCorrectPassword = await userFind.isCorrectPassword(password);
    if (isCorrectPassword) {
      // Credenciales correctas, generar token
      const payload = {
        usuarioId: userFind._id, // Puedes usar el ID del usuario como identificador único en el token
        nombre: userFind.user,
      };

      const token = jwt.sign(payload, secretKey, options);

      // Devolver el token al cliente
      res.status(200).json({ token });

      console.log("Usuario autenticado");
    } else {
      res.status(500).send("Usuario y/o contraseña incorrectos");
    }
  } catch (error) {
    console.error("Error al autenticar usuario", error);
    res.status(500).send("Error al autenticar");
  }
});

//Post para recuperar contraseña usando el token y enviando un email
app.post("/recuperar", async (req, res) => {
  const { user } = req.body;
  try {
    const userFind = await userModel.findOne({ user });
    if (!userFind) {
      return res.status(500).send("El usuario no existe");
    }
    if (userFind) {
      //Se crea un token para recuperar contraseña
      const resetToken = jwt.sign({ userFind }, secretKey, {
        expiresIn: "1h",
      });
      console.log(resetToken);
      try {
        //Se guarda el token en a base de datos
        await userModel.findByIdAndUpdate(userFind._id, { resetToken });

        //Codigo para enviar email con token
        //
        //
        res.status(200).send("Token enviado");
      } catch (error) {
        console.error("Ha ocurrido un error", error);
        res.status(500).send("Error al guardar el token en la base de datos");
      }
    }
  } catch (error) {
    console.error("Error al recuperar contraseña", error);
    res.status(500).send("Error al recuperar");
  }
});

//Put para actualizar datos
app.put("/actualizar", async (req, res) => {
  const { user, email, phone } = req.body;
  try {
    //Se actualiza por medio del nombre del usuario, funciona de identificador
    const userModified = await userModel.findOne({ user });
    const emailModified = await userModel.findOneAndUpdate({ email });
    const phoneModified = await userModel.findOneAndUpdate({ phone });
    const document = this;
    if (!userModified) {
      res.status(500).send("Usuario no encontrado");
    } else {
      //El usuario no se actualiza
      //FRONT: Notificar al cliente que el nombre de usuario no se podra modificar
      document.email = emailModified;
      document.phone = phoneModified;
      console.log("Usuario actualizado");
      res.status(200).send("Actualizacion exitosa");
    }
  } catch (error) {
    console.error("Error al actualizar", error);
    res.status(500).send("Error al intentar actualizar");
  }
});

//Delete para eliminar
app.delete("/eliminar/:user", async (req, res) => {
  const nameUser = req.params.user;
  try {
    const deleteUser = await userModel.findOneAndDelete({ user: nameUser });
    if (!deleteUser) {
      return res.status(500).send("Usuario no encontrado");
    }
    console.log("Usuario eliminado:", deleteUser);
    res.status(200).send("Usuario eliminado correctamente");
  } catch (error) {
    console.error("Error en el proceso de eliminar");
    res.status(500).send("Error al eliminar", error);
  }
});
module.exports = app;
