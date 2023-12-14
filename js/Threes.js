import { obterCelulasDasBordas } from "./funcoes-utilitarias.js";

class Threes {
	constructor(parentNode, altura, largura) {
		this.resetAttributes(parentNode, "threes", altura, largura);
		this.init();
	}

	resetAttributes(parentNode, storageNameItem, altura = 4, largura = 4) {
		parentNode.innerHTML = "";
		// array de setTimouts utilizado para saber se o Threes já está executando alguma ação
		this.onExecution = [];
		// matriz com todos os slots (celulas)
		this.matrix_slots = [];

		let fontSize;
		let borderRadius;
		// threes
		if (storageNameItem === "threes") {
			if (window.innerWidth < 700) {
				borderRadius = "12px";
				fontSize = "1.4rem";
			} else {
				borderRadius = "14px";
				fontSize = "2.2rem";
			}
		} 
		// super-threes
		else {
			if (window.innerWidth < 700) {
				borderRadius = "7px";
				fontSize = "0.85rem";
			} else {
				borderRadius = "8px";
				fontSize = "1rem";
			}
		}

		this.score = 0;
		this.altura = altura;
		this.largura = largura;
		this.parentNode = parentNode;

		this.transition_miliseconds = 120; // milisegundos: muda a velocidade da execução
		// this.transition_seconds = this.transition_miliseconds / 1000;
		this.parentNode.style = `--transition-seconds: ${
			this.transition_miliseconds / 1000
		}s; --piece-font-size: ${fontSize}; --border-radius: ${borderRadius};`;

		this.storageNameItem = storageNameItem;

		// atributo usado para a peça anterior saber se a peça posterior irá se movimentar
		this.gonnaMove = "data-gonna-move";
		this.isGameOver = false;
	}

	changeStyle(value) {
		// garante que uma peça indesejada não apareça quando a transição ocorre com o random play ativo
		// obs: não é necessário esvaziar o array aqui pois isso ocorrerá na função init() de qualquer forma
		this.onExecution.forEach((timeout) => clearTimeout(timeout));
		
		// garante que o random play pare
		clearInterval(this.random_play_interval);
		this.random_play_interval = null;

		switch (value) {
			case "threes":
				this.resetAttributes(this.parentNode, "threes");
				break;
			case "super-threes":
				this.resetAttributes(this.parentNode, "super-threes", 8, 8);
				break;
		}
		this.init();
	}

	init() {
		this.mensagens = document.createElement("div");
		this.mensagens.id = "mensagens";
		this.mensagens.innerHTML = `
			<p id="record">record: <span>${
				localStorage.getItem(this.storageNameItem) || 0
			}</span></p>
			<p id="score">Score: <span>0</span></p>
			<div id="game-over"></div>
		`;
		this.parentNode.appendChild(this.mensagens);

		this.slots_div = document.createElement("div");
		this.slots_div.id = "slots";

		// garante que a hud não vai ser sobrescrita se o usuário trocar o estilo do jogo
		if (!this.hud) {
			this.hud = document.createElement("div");
			this.hud.id = "hud";
			this.hud.innerHTML = `
				<div id="next-piece-display"></div>
				<div class="user-interaction">
					<select name="threes-estilo" id="threes-estilo">
						<option selected value="threes">Threes</option>
						<option value="super-threes">Super Threes</option>
					</select>
					<button type="button" id="random-play-button">Random Play</button>
					<div id="restart-dialog">
						<button type="button" id="restart-button">Restart</button>
					</div>
				</div>
			`;
			// colocado aqui dentro para que os event listeners não sejam sobrescritos na transição de estilo
			this.addEventListeners();
		}
		
		this.parentNode.appendChild(this.hud);
		this.nextPieceDisplay = this.hud.querySelector("#next-piece-display");
		this.changeNextPiece();

		// passando variaveis para a grid do css
		this.slots_div.style = `
            --altura: ${this.altura};
            --largura: ${this.largura};
        `;

		for (let i = 0; i < this.altura; ++i) {
			const array_slots = [];
			for (let j = 0; j < this.largura; ++j) {
				const slot = document.createElement("div");
				slot.classList.add("slot");
				this.slots_div.appendChild(slot);
				array_slots.push(slot);
			}
			this.matrix_slots.push(array_slots);
		}

		this.parentNode.appendChild(this.slots_div);
		this.slots_adjacentes = obterCelulasDasBordas(this.matrix_slots);

		// criando as duas primeiras peças iniciais (com valores 1 e 2)
		(() => {
			const xy1 = {
				x: Math.floor(this.matrix_slots.length / 2),
				y: Math.floor(this.matrix_slots[0].length / 2),
			};
			const xy2 = {
				x: xy1.x - 1,
				y: xy1.y - 1,
			};

			const duration = 400; // miliseconds

			const piece1 = document.createElement("div");
			piece1.classList.add("piece", "one");
			piece1.innerText = "1";

			const piece2 = document.createElement("div");
			piece2.classList.add("piece", "two");
			piece2.innerText = "2";

			this.matrix_slots[xy1.x][xy1.y].appendChild(piece1);
			this.matrix_slots[xy2.x][xy2.y].appendChild(piece2);

			piece1.style = `animation: initial-movement var(--transition-seconds) ease forwards;
			z-index: 9; --transition-seconds: ${duration / 1000}s`;
			piece2.style = `animation: initial-movement var(--transition-seconds) ease forwards;
			z-index: 9; --transition-seconds: ${duration / 1000}s`;

			this.onExecution.push(
				setTimeout(
					() => {
						piece1.removeAttribute("style");
						piece2.removeAttribute("style");
						this.onExecution.pop();
					},
					// adição de 10 milisegundos para garantir que o z-index não seja removido antes da hora
					duration + 10
				)
			);
		})();
	}

	addPiece(currentValue) {
		while (true) {
			const randomIdx = Math.floor(
				Math.random() * this.slots_adjacentes.length
			);
			const randomSlot = this.slots_adjacentes[randomIdx];

			// se o slot selecionado já estiver ocupado, tentar novamente
			if (randomSlot.querySelector(".piece")) continue;

			const newPiece = document.createElement("div");
			newPiece.innerText = currentValue;
			newPiece.classList.add("piece");

			if (currentValue < 3) {
				newPiece.classList.add(currentValue === 1 ? "one" : "two");
			}

			// trata da animação com relação à posição inicial da nova peça (vindo de cima, de baixo, etc.)
			let direction;
			if (randomIdx < this.largura) {
				// de cima
				direction = "transform: translateY(-150%);";
			} else if (randomIdx < this.largura + this.altura - 1) {
				// da direita
				direction = "transform: translateX(150%);";
			} else if (randomIdx < this.largura * 2 + this.altura - 1 * 2) {
				// de baixo
				direction = "transform: translateY(150%);";
			} else {
				// da esquerda
				direction = "transform: translateX(-150%);";
			}
			newPiece.style = `width: 100%; height: 100%; font-size: 0; ${direction}`;

			randomSlot.appendChild(newPiece);
			this.onExecution.push(
				setTimeout(() => {
					newPiece.removeAttribute("style");
					this.onExecution.pop();
				}, 20)
			);

			break;
		}
	}

	changeNextPiece() {
		const currentValue = this.nextPieceValue;
		// valor aleatório da peça (1, 2 ou 3)
		this.nextPieceValue = Math.floor(Math.random() * 3) + 1;
		// this.nextPieceValue = 192; // usado para testes

		let classe = "";
		if (this.nextPieceValue < 3) {
			classe = this.nextPieceValue === 1 ? "one" : "two";
		}
		this.nextPieceDisplay.innerHTML = `
			<p>following</p>
			<div class="piece ${classe} template-piece"></div>
		`;

		// retorna o valor antes da modificação
		return currentValue;
	}

	checarPossibilidadeDeMovimento(key) {
		switch (key) {
			case "ArrowUp":
				for (let i = 1; i < this.altura; ++i) {
					for (let j = 0; j < this.largura; ++j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i - 1][j];
						const piece = slot.querySelector(".piece");

						if (!piece) continue;
						if (!this.checarColisao(piece, slotNext.querySelector(".piece"))) {
							return true;
						}
					}
				}
				break;

			case "ArrowDown":
				for (let i = this.altura - 2; i > -1; --i) {
					for (let j = 0; j < this.largura; ++j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i + 1][j];
						const piece = slot.querySelector(".piece");

						if (!piece) continue;
						if (!this.checarColisao(piece, slotNext.querySelector(".piece"))) {
							return true;
						}
					}
				}
				break;

			case "ArrowLeft":
				for (let i = 0; i < this.altura; ++i) {
					for (let j = 1; j < this.largura; ++j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i][j - 1];
						const piece = slot.querySelector(".piece");

						if (!piece) continue;
						if (!this.checarColisao(piece, slotNext.querySelector(".piece"))) {
							return true;
						}
					}
				}
				break;

			case "ArrowRight":
				for (let i = 0; i < this.altura; ++i) {
					for (let j = this.largura - 2; j > -1; --j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i][j + 1];
						const piece = slot.querySelector(".piece");

						if (!piece) continue;
						if (!this.checarColisao(piece, slotNext.querySelector(".piece"))) {
							return true;
						}
					}
				}
				break;
		}

		return false;
	}

	// efeito de animação: movo a peça primeiro utilizando translate(),
	// e depois do tempo da transição/animação, volto a posição para o estado inicial
	// e adiciono a peça à nova célula da matriz
	movePieces(key) {
		if (this.isGameOver) return;
		if (this.checarGameOver()) {
			this.notificarGameOver();
			return;
		}
		if (!this.checarPossibilidadeDeMovimento(key)) return;
		// necessário para que a próxima peça mude antes de ser adicionada
		const currentValue = this.changeNextPiece();

		switch (key) {
			case "ArrowUp":
				// começa a partir de matriz[1][...]
				for (let i = 1; i < this.altura; ++i) {
					for (let j = 0; j < this.largura; ++j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i - 1][j];
						const piece = slot.querySelector(".piece");

						if (
							!piece ||
							this.checarColisao(piece, slotNext.querySelector(".piece"))
						)
							continue;

						piece.setAttribute(this.gonnaMove, "true");
						piece.classList.add("to-up");

						this.onExecution.push(
							setTimeout(() => {
								piece.setAttribute(this.gonnaMove, "false");
								piece.classList.remove("to-up");
								slotNext.appendChild(piece);
								this.onExecution.pop();
							}, this.transition_miliseconds)
						);
					}
				}
				break;
			case "ArrowDown":
				// vai até matriz[this.altura-1][...]
				for (let i = this.altura - 2; i > -1; --i) {
					for (let j = 0; j < this.largura; ++j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i + 1][j];
						const piece = slot.querySelector(".piece");

						if (
							!piece ||
							this.checarColisao(piece, slotNext.querySelector(".piece"))
						)
							continue;

						piece.setAttribute(this.gonnaMove, "true");
						piece.classList.add("to-down");

						this.onExecution.push(
							setTimeout(() => {
								piece.setAttribute(this.gonnaMove, "false");
								piece.classList.remove("to-down");
								slotNext.appendChild(piece);
								this.onExecution.pop();
							}, this.transition_miliseconds)
						);
					}
				}
				break;
			case "ArrowRight":
				// vai até matriz[...][this.largura-1]
				for (let i = 0; i < this.altura; ++i) {
					for (let j = this.largura - 2; j > -1; --j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i][j + 1];
						const piece = slot.querySelector(".piece");

						if (
							!piece ||
							this.checarColisao(piece, slotNext.querySelector(".piece"))
						)
							continue;

						piece.setAttribute(this.gonnaMove, "true");
						piece.classList.add("to-right");

						this.onExecution.push(
							setTimeout(() => {
								piece.setAttribute(this.gonnaMove, "false");
								piece.classList.remove("to-right");
								slotNext.appendChild(piece);
								this.onExecution.pop();
							}, this.transition_miliseconds)
						);
					}
				}
				break;
			case "ArrowLeft":
				// começa em[...][1]
				for (let i = 0; i < this.altura; ++i) {
					for (let j = 1; j < this.largura; ++j) {
						const slot = this.matrix_slots[i][j];
						const slotNext = this.matrix_slots[i][j - 1];
						const piece = slot.querySelector(".piece");

						if (
							!piece ||
							this.checarColisao(piece, slotNext.querySelector(".piece"))
						)
							continue;

						piece.setAttribute(this.gonnaMove, "true");
						piece.classList.add("to-left");

						this.onExecution.push(
							setTimeout(() => {
								piece.setAttribute(this.gonnaMove, "false");
								piece.classList.remove("to-left");
								slotNext.appendChild(piece);
								this.onExecution.pop();
							}, this.transition_miliseconds)
						);
					}
				}
				break;
		}

		this.onExecution.push(
			setTimeout(() => {
				this.mesclar();
				// currentValue carrega o valor da peça que estava anteriormente no display 'following'
				this.addPiece(currentValue);
				this.onExecution.pop();
			}, this.transition_miliseconds)
		);
	}

	checarColisao(piece, pieceNext) {
		// se não houver uma peça na frente da peça atual, ela pode se mover
		/* 
			obs: lembrar que os loops NÃO iteram sobre as peças das bordas
			no sentido do movimento
		*/
		if (!pieceNext) return false;

		const v1 = Number(piece.innerText);
		const v2 = Number(pieceNext.innerText);

		if (
			(v1 === v2 && v1 !== 1 && v1 !== 2) ||
			v1 + v2 == 3 ||
			pieceNext.getAttribute(this.gonnaMove) === "true"
		) {
			return false;
		}

		return true;
	}

	mesclar() {
		// usando CSS4 para selecionar apenas os slots com duas peças (.piece)
		const slots = [
			...this.slots_div.querySelectorAll(".slot:has(.piece:nth-child(2))"),
		];
		slots.forEach((slot) => {
			const pieces = [...slot.querySelectorAll(".piece")];

			const v1 = Number(pieces[0].innerText);
			const v2 = Number(pieces[1].innerText);

			pieces.forEach((piece) => {
				piece.style = "width: 0; height: 0; font-size: 0;";

				this.onExecution.push(
					setTimeout(() => {
						piece.remove();
						this.onExecution.pop();
					}, this.transition_miliseconds)
				);
			});

			const newPiece = document.createElement("div");
			newPiece.classList.add("piece");
			newPiece.innerText = v1 + v2;
			newPiece.style = "width: 0; height: 0; font-size: 0;";
			slot.appendChild(newPiece);

			this.score += v1 + v2;
			const span = this.mensagens.querySelector("#score > span");
			span.innerText = this.score;

			this.onExecution.push(
				setTimeout(() => {
					newPiece.removeAttribute("style");
					this.onExecution.pop();
				}, this.transition_miliseconds)
			);

			if (this.score > localStorage.getItem(this.storageNameItem)) {
				this.mensagens.querySelector("#record > span").innerText = this.score;
			}
		});
	}

	checarGameOver() {
		// erquerda
		for (let i = 0; i < this.altura; ++i) {
			for (let j = 1; j < this.largura; ++j) {
				const slot = this.matrix_slots[i][j];
				const slotNext = this.matrix_slots[i][j - 1];
				const piece = slot.querySelector(".piece");
				if (
					!piece ||
					!this.checarColisao(piece, slotNext.querySelector(".piece"))
				)
					return false;
			}
		}

		// direita
		for (let i = 0; i < this.altura; ++i) {
			for (let j = this.largura - 2; j > -1; --j) {
				const slot = this.matrix_slots[i][j];
				const slotNext = this.matrix_slots[i][j + 1];
				const piece = slot.querySelector(".piece");
				if (
					!piece ||
					!this.checarColisao(piece, slotNext.querySelector(".piece"))
				)
					return false;
			}
		}

		// baixo
		for (let i = this.altura - 2; i > -1; --i) {
			for (let j = 0; j < this.largura; ++j) {
				const slot = this.matrix_slots[i][j];
				const slotNext = this.matrix_slots[i + 1][j];
				const piece = slot.querySelector(".piece");
				if (
					!piece ||
					!this.checarColisao(piece, slotNext.querySelector(".piece"))
				)
					return false;
			}
		}

		// cima
		for (let i = 1; i < this.altura; ++i) {
			for (let j = 0; j < this.largura; ++j) {
				const slot = this.matrix_slots[i][j];
				const slotNext = this.matrix_slots[i - 1][j];
				const piece = slot.querySelector(".piece");
				if (
					!piece ||
					!this.checarColisao(piece, slotNext.querySelector(".piece"))
				)
					return false;
			}
		}

		return true;
	}

	notificarGameOver() {
		this.isGameOver = true;
		// faz a div com o botão de restart aparecer
		this.hud.querySelector("#restart-dialog").style = "display: flex; animation: restart-dialog 1s ease forwards;";
		// faz com que não seja possívem interagir com o background (exceto a div de restart)
		this.parentNode.style.pointerEvents = "none";
		const gameOver = this.mensagens.querySelector("#game-over");
		if (localStorage.getItem(this.storageNameItem) > this.score) {
			gameOver.innerHTML = `Game Over <div class="perdeu">You Lost!</div>`;
		} else {
			localStorage.setItem(this.storageNameItem, this.score);
			gameOver.innerHTML = `Game Over <div class="ganhou">You Won!</div>`;
		}
		gameOver.style = "animation: game-over 1s ease forwards;";
	}

	addEventListeners() {
		// btn random play
		const btn_random_play = this.hud.querySelector("#random-play-button");
		this.random_play_interval = null;
		btn_random_play.addEventListener("click", () => {
			if (this.random_play_interval) {
				clearInterval(this.random_play_interval);
				this.random_play_interval = null;
				return;
			}

			this.random_play_interval = setInterval(() => {
				if (this.isGameOver) {
					clearInterval(this.random_play_interval);
					this.random_play_interval = null;
				}

				if (this.onExecution.length > 0) return;

				const movement = Math.floor(Math.random() * 4);
				switch (movement) {
					case 0:
						this.movePieces("ArrowUp");
						break;
					case 1:
						this.movePieces("ArrowDown");
						break;
					case 2:
						this.movePieces("ArrowRight");
						break;
					case 3:
						this.movePieces("ArrowLeft");
						break;
				}
			}, this.transition_miliseconds + 10);
		});

		// estilo do threes
		const threesEstilo = this.hud.querySelector("#threes-estilo");
		threesEstilo.addEventListener("change", (evt) => {
			const select = evt.target;
			this.changeStyle(select.value);
			// garantindo que o foco vai sair do select
			select.blur();
		});

		const restartButton = this.hud.querySelector("#restart-button");
		restartButton.addEventListener("click", () => {
			this.changeStyle(this.storageNameItem);
			// tirando o display flex (volta a ser none)
			restartButton.parentElement.removeAttribute("style");
			this.parentNode.style.pointerEvents = "initial";
		});
	}
}

export { Threes };
