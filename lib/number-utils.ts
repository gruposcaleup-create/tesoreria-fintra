/**
 * Convierte un número a su representación en letra para moneda mexicana.
 * Ejemplo: 119.43 -> "CIENTO DIECINUEVE PESOS 43/100 M.N."
 */
export function numberToLetter(amount: number): string {
    if (amount < 0) return "CERO PESOS 00/100 M.N.";

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    const decimalStr = decimalPart.toString().padStart(2, '0');

    let text = integerToText(integerPart);

    // Asegurar que termine en "PESOS" o "PESO"
    if (integerPart === 1) {
        text += " PESO";
    } else {
        text += " PESOS";
    }

    return `${text} ${decimalStr}/100 M.N.`;
}

function integerToText(n: number): string {
    if (n === 0) return "CERO";
    if (n > 999999999) return "CANTIDAD MUY GRANDE"; // Evitar overflow simple

    let str = "";

    // Millones
    const millions = Math.floor(n / 1000000);
    const remainderMillions = n % 1000000;

    if (millions > 0) {
        if (millions === 1) {
            str += "UN MILLON";
        } else {
            str += integerToText(millions) + " MILLONES";
        }
        if (remainderMillions > 0) str += " ";
    }

    // Miles
    const thousands = Math.floor(remainderMillions / 1000);
    const remainderThousands = remainderMillions % 1000;

    if (thousands > 0) {
        if (thousands === 1) {
            str += "UN MIL";
        } else {
            str += integerToText(thousands) + " MIL";
        }
        if (remainderThousands > 0) str += " ";
    }

    // Centenas
    str += hundredsToText(remainderThousands);

    return str.trim();
}

function hundredsToText(n: number): string {
    if (n === 0) return "";

    if (n === 100) return "CIEN";
    if (n > 100 && n < 200) return "CIENTO " + hundredsToText(n % 100);

    if (n >= 200 && n < 300) return "DOSCIENTOS " + hundredsToText(n % 100);
    if (n >= 300 && n < 400) return "TRESCIENTOS " + hundredsToText(n % 100);
    if (n >= 400 && n < 500) return "CUATROCIENTOS " + hundredsToText(n % 100);
    if (n >= 500 && n < 600) return "QUINIENTOS " + hundredsToText(n % 100);
    if (n >= 600 && n < 700) return "SEISCIENTOS " + hundredsToText(n % 100);
    if (n >= 700 && n < 800) return "SETECIENTOS " + hundredsToText(n % 100);
    if (n >= 800 && n < 900) return "OCHOCIENTOS " + hundredsToText(n % 100);
    if (n >= 900 && n < 1000) return "NOVECIENTOS " + hundredsToText(n % 100);

    if (n < 100) return tensToText(n);

    return "";
}

function tensToText(n: number): string {
    if (n === 0) return "";

    if (n <= 29) return unitsToText(n);

    if (n >= 30 && n < 40) return "TREINTA" + (n > 30 ? " Y " + unitsToText(n % 10) : "");
    if (n >= 40 && n < 50) return "CUARENTA" + (n > 40 ? " Y " + unitsToText(n % 10) : "");
    if (n >= 50 && n < 60) return "CINCUENTA" + (n > 50 ? " Y " + unitsToText(n % 10) : "");
    if (n >= 60 && n < 70) return "SESENTA" + (n > 60 ? " Y " + unitsToText(n % 10) : "");
    if (n >= 70 && n < 80) return "SETENTA" + (n > 70 ? " Y " + unitsToText(n % 10) : "");
    if (n >= 80 && n < 90) return "OCHENTA" + (n > 80 ? " Y " + unitsToText(n % 10) : "");
    if (n >= 90 && n < 100) return "NOVENTA" + (n > 90 ? " Y " + unitsToText(n % 10) : "");

    return "";
}

function unitsToText(n: number): string {
    switch (n) {
        case 0: return "";
        case 1: return "UN";
        case 2: return "DOS";
        case 3: return "TRES";
        case 4: return "CUATRO";
        case 5: return "CINCO";
        case 6: return "SEIS";
        case 7: return "SIETE";
        case 8: return "OCHO";
        case 9: return "NUEVE";
        case 10: return "DIEZ";
        case 11: return "ONCE";
        case 12: return "DOCE";
        case 13: return "TRECE";
        case 14: return "CATORCE";
        case 15: return "QUINCE";
        case 16: return "DIECISEIS";
        case 17: return "DIECISIETE";
        case 18: return "DIECIOCHO";
        case 19: return "DIECINUEVE";
        case 20: return "VEINTE";
        case 21: return "VEINTIUN";
        case 22: return "VEINTIDOS";
        case 23: return "VEINTITRES";
        case 24: return "VEINTICUATRO";
        case 25: return "VEINTICINCO";
        case 26: return "VEINTISEIS";
        case 27: return "VEINTISIETE";
        case 28: return "VEINTIOCHO";
        case 29: return "VEINTINUEVE";
        default: return "";
    }
}
