/**
 * JOGO: Escape the Room (5 Fases) - LÓGICA PURA
 */

(function () {
  // --- DADOS E FASES DO JOGO ---
  const gameState = {
    currentLevel: 1,
    inventory: [],
    logs: ["Você acordou trancado. Encontre uma saída."]
  };

  const levels = {
    1: {
      title: "Fase 1: O Quarto Escuro",
      description: "Você está em um quarto mal iluminado. Há uma **escrivaninha velha**, uma porta trancada com chave comum e um tapete no centro do chão.",
      actions: () => {
        let list = [];
        if (!gameState.inventory.includes("Chave Enferrujada")) {
          list.push({ text: "Olhar debaixo do tapete", action: () => lookUnderRug() });
        }
        list.push({ text: "Examinar a escrivaninha velha", action: () => examineDesk1() });
        list.push({ text: "Tentar abrir a porta principal", action: () => tryOpenDoor1() });
        return list;
      }
    },
    2: {
      title: "Fase 2: A Sala dos Relógios",
      description: "Esta sala possui três relógios de parede parados marcando horas diferentes: 03:00, 06:00 e 09:00. Na parede, há uma inscrição: 'A soma do tempo liberta o próximo passo'. Há um teclado numérico eletrônico ao lado da porta.",
      hasInput: true,
      inputPlaceholder: "Digite a senha numérica...",
      actions: () => [
        { text: "Examinar os relógios detalhadamente", action: () => log("Os relógios parecem indicar uma ordem aritmética: 3... 6... 9... Qual seria o próximo número lógico?") }
      ],
      checkCode: (code) => {
        if (code.trim() === "12" || code.trim() === "36912") {
          nextLevel("O teclado bipa verde e a porta se abre!");
          return true;
        }
        return false;
      }
    },
    3: {
      title: "Fase 3: O Laboratório de Alquimia",
      description: "Bancadas cheias de frascos químicos. Uma porta de aço possui uma fechadura mecânica em formato de engrenagem. Há uma fresta escura na parede que você não consegue alcançar com as mãos.",
      actions: () => {
        let list = [];
        if (!gameState.inventory.includes("Ímã Forte")) {
          list.push({ text: "Procurar nas gavetas do laboratório", action: () => findMagnet() });
        }
        if (gameState.inventory.includes("Ímã Forte") && !gameState.inventory.includes("Engrenagem de Bronze")) {
          list.push({ text: "Usar o Ímã na fresta escura da parede", action: () => useMagnet() });
        }
        list.push({ text: "Inserir engrenagem na porta de aço", action: () => tryOpenDoor3() });
        return list;
      }
    },
    4: {
      title: "Fase 4: A Biblioteca dos Enigmas",
      description: "Prateleiras do chão ao teto. Na mesa central, um livro aberto diz: 'Tenho cauda, mas não sou cão. Não tenho asas, mas sei voar. Se me soltam, fico parado. Se me prendem, fujo com o vento.'",
      hasInput: true,
      inputPlaceholder: "Escreva a resposta em uma palavra...",
      actions: () => [
        { text: "Procurar pistas nos livros", action: () => log("Um bilhete rasgado diz: 'É leve, feita de papel ou pano, adora dias de vento no parque.'") }
      ],
      checkCode: (code) => {
        const resposta = code.toLowerCase().trim();
        if (resposta === "pipa" || resposta === "papagaio") {
          nextLevel("Uma passagem secreta se abre atrás da estante!");
          return true;
        }
        return false;
      }
    },
    5: {
      title: "Fase Final: A Sala de Controle",
      description: "Você vê a luz do sol por uma janela blindada! O computador central gerencia a saída de emergência. A tela exibe: 'Para escapar, digite o ano atual do sistema.'",
      hasInput: true,
      inputPlaceholder: "Digite o ano de 4 dígitos...",
      actions: () => [
        { text: "Olhar os arquivos do painel", action: () => log(`O relógio interno do sistema operacional indica o ano de ${new Date().getFullYear()}.`) }
      ],
      checkCode: (code) => {
        const currentYear = new Date().getFullYear().toString();
        if (code.trim() === currentYear) {
          gameState.currentLevel = "WIN";
          log("SISTEMA DESBLOQUEADO! A porta principal se abre. VOCÊ ESCAPOU!", "system");
          render();
          return true;
        }
        return false;
      }
    }
  };

  // --- LÓGICAS INTERNAS DAS FASES ---
  function log(msg, type = "") {
    gameState.logs.unshift(msg);
    render();
  }

  function nextLevel(successMsg) {
    log(successMsg, "system");
    gameState.currentLevel++;
    render();
  }

  function lookUnderRug() {
    if (!gameState.inventory.includes("Chave Enferrujada")) {
      gameState.inventory.push("Chave Enferrujada");
      log("Você encontrou uma [Chave Enferrujada] sob o tapete!", "system");
    }
  }
  function examineDesk1() { log("A escrivaninha está vazia, mas há marcas de arranhões apontando para o tapete."); }
  function tryOpenDoor1() {
    if (gameState.inventory.includes("Chave Enferrujada")) {
      nextLevel("Você usa a Chave Enferrujada. A porta range e se abre!");
    } else { log("A porta está trancada. Você precisa de uma chave.", "error"); }
  }
  function findMagnet() {
    gameState.inventory.push("Ímã Forte");
    log("Você vasculhou as gavetas e achou um [Ímã Forte]!", "system");
  }
  function useMagnet() {
    if (gameState.inventory.includes("Ímã Forte")) {
      gameState.inventory.push("Engrenagem de Bronze");
      log("Usando o ímã, você puxou uma [Engrenagem de Bronze] da fresta!", "system");
    }
  }
  function tryOpenDoor3() {
    if (gameState.inventory.includes("Engrenagem de Bronze")) {
      nextLevel("A engrenagem se encaixa, o mecanismo gira e destranca a porta!");
    } else { log("Falta uma engrenagem para ativar o painel mecânico.", "error"); }
  }

  // --- RENDERIZADOR ---
  function render() {
    const root = document.getElementById("escape-game-project-root");
    if (!root) return;

    if (gameState.currentLevel === "WIN") {
      root.innerHTML = `
        <div id="escape-game-container">
          <div class="game-header">
            <h2 class="game-title">🎉 PARABÉNS! 🎉</h2>
            <button class="fullscreen-btn" id="toggle-fs">Tela Cheia</button>
          </div>
          <div class="room-view" style="text-align: center; justify-content: center; gap: 20px; min-height: 350px;">
            <h2>Você escapou com sucesso!</h2>
            <p style="font-size: 18px;">Sua mente afiada resolveu todos os 5 níveis do desafio.</p>
            <button class="action-btn" id="restart-game" style="align-self: center;">Jogar Novamente</button>
          </div>
        </div>
      `;
      document.getElementById("restart-game").addEventListener("click", resetGame);
      setupFullscreenEvent();
      return;
    }

    const currentLevelData = levels[gameState.currentLevel];

    // Atualiza Textos Básicos
    document.getElementById("game-title-el").innerText = currentLevelData.title;
    document.getElementById("room-desc-el").innerText = currentLevelData.description;

    // Atualiza Zona de Interação (Botões e Inputs)
    const interactionZone = document.getElementById("interaction-zone-el");
    interactionZone.innerHTML = "";

    currentLevelData.actions().forEach((act, idx) => {
      const btn = document.createElement("button");
      btn.className = "action-btn";
      btn.id = `act-btn-${idx}`;
      btn.innerText = act.text;
      btn.addEventListener("click", act.action);
      interactionZone.appendChild(btn);
    });

    if (currentLevelData.hasInput) {
      const inputGroup = document.createElement("div");
      inputGroup.className = "input-group";
      inputGroup.innerHTML = `
        <input type="text" class="code-input" id="game-code-input" placeholder="${currentLevelData.inputPlaceholder}"> 
        <button class="submit-btn" id="game-code-submit">Enviar</button> 
      `;
      interactionZone.appendChild(inputGroup);

      const inputEl = inputGroup.querySelector("#game-code-input");
      const submitEl = inputGroup.querySelector("#game-code-submit");

      const executeSubmit = () => {
        const success = currentLevelData.checkCode(inputEl.value);
        if (!success) log("Código ou resposta incorreta. Tente novamente.", "error");
      };

      submitEl.addEventListener("click", executeSubmit);
      inputEl.addEventListener("keypress", (e) => { if (e.key === "Enter") executeSubmit(); });
    }

    // Atualiza Inventário
    const inventoryList = document.getElementById("inventory-list-el");
    inventoryList.innerHTML = "";
    if (gameState.inventory.length === 0) {
      inventoryList.innerHTML = `<li class="inventory-item-empty">Vazio</li>`;
    } else {
      gameState.inventory.forEach(item => {
        const li = document.createElement("li");
        li.className = "inventory-item";
        li.innerText = `🔑 ${item}`;
        inventoryList.appendChild(li);
      });
    }

    // Atualiza Histórico
    const logContainer = document.getElementById("game-log-el");
    logContainer.innerHTML = "";
    gameState.logs.forEach(logText => {
      const itemLog = document.createElement("div");
      if (logText.includes("encontrou") || logText.includes("abre") || logText.includes("SISTEMA")) itemLog.className = "system-msg";
      if (logText.includes("trancada") || logText.includes("Falta") || logText.includes("incorreta")) itemLog.className = "error-msg";
      itemLog.innerText = `> ${logText}`;
      logContainer.appendChild(itemLog);
    });
  }

  // --- TELA CHEIA ---
  function setupFullscreenEvent() {
    const fsBtn = document.getElementById("toggle-fs");
    if (!fsBtn) return;
    fsBtn.replaceWith(fsBtn.cloneNode(true)); // Limpa eventos duplicados
    
    document.getElementById("toggle-fs").addEventListener("click", () => {
      const container = document.getElementById("escape-game-container");
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) container.requestFullscreen();
else if (container.mozRequestFullScreen) container.mozRequestFullScreen();
else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
else if (container.msRequestFullscreen) container.msRequestFullscreen();
} else {
if (document.exitFullscreen) document.exitFullscreen();
}
});
}
function resetGame() {
gameState.currentLevel = 1;
gameState.inventory = [];
gameState.logs = ["O jogo foi reiniciado. Você está trancado novamente."];
// Força a restauração do esqueleto padrão do HTML ao reiniciar
// document.getElementById("escape-game-project-root").innerHTML = <div id="escape-game-container">  <div class="game-header">  <h2 class="game-title" id="game-title-el"></h2>  <button class="fullscreen-btn" id="toggle-fs">🖥️ Tela Cheia</button>  </div>  <div class="game-body">  <div class="room-view">  <div class="room-description" id="room-desc-el"></div>  <div class="interaction-zone" id="interaction-zone-el"></div>  </div>  <div class="sidebar">  <h3>Inventário</h3>  <ul class="inventory-list" id="inventory-list-el"></ul>  <div class="history-wrapper">  <h3>Histórico</h3>  <div class="game-log" id="game-log-el"></div>  </div>  </div>  </div>  </div>;
document.getElementById("escape-game-project-root").innerHTML = `
  <div id="escape-game-container">
    <div class="game-header">
      <h2 class="game-title" id="game-title-el"></h2>
      <button class="fullscreen-btn" id="toggle-fs">
        🖥️ Tela Cheia
      </button>
    </div>

    <div class="game-body">
      <div class="room-view">
        <div class="room-description" id="room-desc-el"></div>
        <div class="interaction-zone" id="interaction-zone-el"></div>
      </div>

      <div class="sidebar">
        <h3>Inventário</h3>
        <ul class="inventory-list" id="inventory-list-el"></ul>

        <div class="history-wrapper">
          <h3>Histórico</h3>
          <div class="game-log" id="game-log-el"></div>
        </div>
      </div>
    </div>
  </div>
`;

setupFullscreenEvent();
render();
}
// --- INICIALIZADOR SEGURO ---
function init() {
setupFullscreenEvent();
render();
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init);
} else {
init();
}
})();