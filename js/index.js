"use strict";

import { Threes } from "./Threes.js";

const threesNode = document.querySelector("#threes");
// 4 x 4 como o tamanho padrão do tabuleiro
const threes = new Threes(threesNode, 4, 4);

window.addEventListener("keydown", (evt) => {
	// impede comportamento indefinido com relação aos setTimeouts dentro de Threes.js
	// e garante que apertar as teclas repetidamente não vai quebrar as animações
	// if (threes.onExecution.length > 0) return;
	threes.movePieces(evt.key);
});

/* 
    funcionalidades para dispositivos móveis 
*/
let initialX = null;
let initialY = null;
window.addEventListener("touchstart", (evt) => {
	initialX = evt.touches[0].clientX;
	initialY = evt.touches[0].clientY;
});

window.addEventListener("touchend", (evt) => {
	if (!initialX || !initialY) return;

	const finalX = evt.changedTouches[0].clientX;
	const finalY = evt.changedTouches[0].clientY;

	let deltaX = finalX - initialX;
	let deltaY = finalY - initialY;

	// Define um limiar para considerar um gesto como um swipe
	var limiar = 40;

	if (Math.abs(deltaX) > limiar) {
		if (deltaX > 0) threes.movePieces("ArrowRight");
		else threes.movePieces("ArrowLeft");
	} else if (Math.abs(deltaY) > limiar) {
		if (deltaY < 0) threes.movePieces("ArrowUp");
		else threes.movePieces("ArrowDown");
	}

	initialX = null;
	initialY = null;
});
