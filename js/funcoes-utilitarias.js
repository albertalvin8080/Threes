function obterCelulasDasBordas(matriz) {
	const celulasBordas = [];

	// Obtém os números da primeira linha
	for (let coluna = 0; coluna < matriz[0].length; coluna++) {
		celulasBordas.push(matriz[0][coluna]);
	}

	// Obtém os números da última coluna (exceto o primeiro e o último elemento)
	for (let linha = 1; linha < matriz.length - 1; linha++) {
		celulasBordas.push(matriz[linha][matriz[linha].length - 1]);
	}

	// Obtém os números da última linha (em ordem reversa)
	for (let coluna = matriz[0].length - 1; coluna >= 0; coluna--) {
		celulasBordas.push(matriz[matriz.length - 1][coluna]);
	}

	// Obtém os números da primeira coluna (exceto o primeiro e o último elemento, em ordem reversa)
	for (let linha = matriz.length - 2; linha > 0; linha--) {
		celulasBordas.push(matriz[linha][0]);
	}

	return celulasBordas;
}

export { obterCelulasDasBordas };
