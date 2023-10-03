//Declarar variables e importar modulos
const path = require("path");
const port = 3000;
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const database = require("../src/database/db").mongoURIlocal;
const userModel = require("../src/model/user");

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

//Get
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public", "index.html"));
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
      res.status(200).send("Usuario autenticado");
    } else {
      res.status(500).send("Usuario y/o contraseña incorrectos");
    }
  } catch (error) {
    console.error("Error al autenticar usuario", error);
    res.status(500).send("Error al autenticar");
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
