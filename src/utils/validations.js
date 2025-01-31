// Valida la fortaleza de la contraseña
const validarFortalezaContrasena = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!password.trim()) {
        return "La contraseña no puede estar vacía.";
    } else if (!regex.test(password)) {
        return "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, un número y un carácter especial.";
    }
    return "";
};

// Valida el nombre
const validarNombre = (nombre) => {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/;
    if (!nombre.trim()) {
        return "El nombre no puede estar vacío.";
    } else if (!regex.test(nombre)) {
        return "El nombre solo debe contener letras, sin caracteres especiales.";
    }
    return "";
};

// Valida un número telefónico
const validarTelefono = (telefono) => {
    const regex = /^[0-9]{10}$/;
    if (!telefono.trim()) {
        return "El teléfono no puede estar vacío.";
    } else if (!regex.test(telefono)) {
        return "El teléfono debe tener exactamente 10 dígitos y solo números.";
    }
    return "";
};

// Valida la edad
const validarEdad = (edad) => {
    const numericAge = parseInt(edad, 10);
    if (!numericAge || numericAge < 18) {
        return "Debes ser mayor de 18 años.";
    }
    return "";
};

// Valida un correo electrónico
const validarCorreo = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
        return "El correo no puede estar vacío.";
    } else if (!regex.test(correo)) {
        return "Ingresa un correo válido.";
    }
    return "";
};

// Valida la duración de un tratamiento
const validarDuracion = (duracion) => {
    if (!duracion) return "La duración es obligatoria.";
    if (!/^\d+$/.test(duracion)) return "La duración debe ser un número entero positivo.";
    if (parseInt(duracion, 10) <= 0) return "La duración debe ser mayor que 0.";
    return "";
};

// Valida el precio de un servicio o cita
const validarPrecio = (precio) => {
    if (!precio) return "El precio es obligatorio.";
    if (!/^\d+(\.\d{1,2})?$/.test(precio)) return "El precio debe ser un número positivo válido.";
    return "";
};

// Valida la cantidad de citas requeridas para un tratamiento
const validarCitasRequeridas = (citas) => {
    if (!citas) return "El número de citas es obligatorio.";
    if (!/^\d+$/.test(citas)) return "El número de citas debe ser un número entero positivo.";
    if (parseInt(citas, 10) <= 0) return "El número de citas debe ser mayor que 0.";
    return "";
};
// Valida que un campo no esté vacío
const validarCampoNoVacio = (campo, nombreCampo) => {
    if (!campo || !campo.trim()) {
        return `${nombreCampo} no puede estar vacío.`;
    }
    return "";
};

module.exports = {
    validarFortalezaContrasena,
    validarNombre,
    validarTelefono,
    validarEdad,
    validarCorreo,
    validarDuracion,
    validarPrecio,
    validarCitasRequeridas,validarCampoNoVacio
};
