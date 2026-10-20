function normalizarTexto(valor) {
    if (typeof valor !== "string") {
        return "";
    }

    return valor.trim();
}

function tieneLongitudValida(texto, minimo, maximo) {
    if (typeof texto !== "string") {
        return false;
    }

    return (
        texto.length >= minimo &&
        texto.length <= maximo
    );
}

function correoValido(correo) {
    if (typeof correo !== "string") {
        return false;
    }

    if (
        correo.length < 5 ||
        correo.length > 254
    ) {
        return false;
    }

    const expresion =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(correo);
}

function telefonoValido(telefono) {
    if (typeof telefono !== "string") {
        return false;
    }

    if (
        telefono.length < 8 ||
        telefono.length > 30
    ) {
        return false;
    }

    const expresion =
        /^[0-9+\-()\s]+$/;

    return expresion.test(telefono);
}

function enteroEnRango(valor, minimo, maximo) {
    const numero = Number(valor);

    return (
        Number.isInteger(numero) &&
        numero >= minimo &&
        numero <= maximo
    );
}

function idValido(valor) {
    return enteroEnRango(
        valor,
        1,
        Number.MAX_SAFE_INTEGER
    );
}

function montoValido(valor) {
    const numero = Number(valor);

    if (
        !Number.isFinite(numero) ||
        numero <= 0
    ) {
        return false;
    }

    const centavos = numero * 100;

    return (
        Math.abs(
            centavos -
            Math.round(centavos)
        ) < 0.0000001
    );
}

function contieneCaracteresControl(texto) {
    if (typeof texto !== "string") {
        return false;
    }

    return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(
        texto
    );
}

module.exports = {
    normalizarTexto,
    tieneLongitudValida,
    correoValido,
    telefonoValido,
    enteroEnRango,
    idValido,
    montoValido,
    contieneCaracteresControl
};