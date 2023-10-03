//Esquema del usuario para la base de datos
//Declarar variables e importar modulos
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//Modelo de usuario
const UserSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
});

//Hashear contraseña ANTES de guardar en la base de datos
UserSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("password")) {
    const document = this;
    bcrypt.hash(document.password, saltRounds, function (err, hashPassword) {
      if (err) {
        console.error("Error al encriptar", err);
      } else {
        document.password = hashPassword;
        console.log("Contraseña encriptada");
        next();
      }
    });
  } else {
    next();
  }
});

//Verificar contraseñas
UserSchema.methods.isCorrectPassword = async function (password) {
  try {
    const same = await bcrypt.compare(password, this.password);
    console.log(same);
    return same;
  } catch (error) {
    console.error("Error en el proceso", error);
  }
};

//Exportamos
module.exports = mongoose.model("user", UserSchema);
