(function () {
    // ==========================================
    // PARTE 0: MOTOR DE RENDERIZAÇÃO E ESTILOS
    // ==========================================

    const CONFIG = {
        width: 800,
        height: 600,
        storageKey: 'escape_room_progression_state'
    };

    // Estado Global do Jogo
    const GameState = {
        currentPhase: 1,
        inventory: [],
        selectedItem: null,
        phaseData: {},

        init() {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.currentPhase = parsed.currentPhase || 1;
                } catch (e) {
                    this.currentPhase = 1;
                }
            }
            this.inventory = [];
            this.selectedItem = null;
            this.phaseData = {};
        },

        save(phase) {
            this.currentPhase = phase;
            localStorage.setItem(CONFIG.storageKey, JSON.stringify({
                currentPhase: this.currentPhase
            }));
        },

        reset() {
            localStorage.removeItem(CONFIG.storageKey);
            this.currentPhase = 1;
            this.inventory = [];
            this.selectedItem = null;
            this.phaseData = {};
            RenderEngine.loadPhase(1);
        }
    };

    // Injeção de Estilos CSS Globais
    const injectStyles = () => {
        const css = `
            * { box-sizing: border-box; user-select: none; margin: 0; padding: 0; }
            body { background: #111; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
            #game-viewport {
                width: ${CONFIG.width}px;
                height: ${CONFIG.height}px;
                background: #1e1e24;
                position: relative;
                overflow: hidden;
                border: 4px solid #333;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                border-radius: 8px;
            }
            /* Telas do Sistema */
            .screen { position: absolute; top:0; left:0; width:100%; height:100%; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 100; transition: opacity 0.5s ease; }
            #menu-screen { background: radial-gradient(circle, #2c3e50 0%, #0f171e 100%); }
            #victory-screen { background: radial-gradient(circle, #27ae60 0%, #06230f 100%); display: none; opacity: 0; }
            .game-title { color: #f1c40f; font-size: 42px; font-weight: bold; text-transform: uppercase; margin-bottom: 40px; letter-spacing: 4px; text-shadow: 0 4px 10px rgba(0,0,0,0.5); text-align: center; }
            .btn { background: #e74c3c; color: white; border: none; padding: 15px 40px; font-size: 18px; font-weight: bold; border-radius: 30px; cursor: pointer; margin: 10px; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.3); text-transform: uppercase; }
            .btn:hover { background: #c0392b; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
            .btn:disabled { background: #7f8c8d; cursor: not-allowed; transform: none; box-shadow: none; }
            /* Cenário de Jogo */
            #stage { width: 100%; height: 500px; position: absolute; top: 0; left: 0; background: #2c3e50; overflow: hidden; }
            #phase-title { position: absolute; top: 15px; left: 15px; color: #fff; font-size: 16px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 15px; pointer-events: none; z-index: 10; border-left: 3px solid #f1c40f; }
            /* Inventário Visual */
            #inventory-bar {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 100px;
                background: #111116;
                border-top: 3px solid #222;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                padding: 0 20px;
                z-index: 50;
            }
            .inv-slot {
                width: 70px;
                height: 70px;
                background: #1a1a24;
                border: 2px dashed #444;
                border-radius: 8px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            .inv-item {
                width: 55px;
                height: 55px;
                border-radius: 6px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 24px;
                font-weight: bold;
                color: white;
                box-shadow: inset 0 0 10px rgba(255,255,255,0.2);
            }
            .inv-slot.selected {
                border: 2px solid #f1c40f;
                box-shadow: 0 0 15px #f1c40f;
                animation: pulseGlow 1.5s infinite;
            }
            @keyframes pulseGlow {
                0% { box-shadow: 0 0 5px #f1c40f; }
                50% { box-shadow: 0 0 18px #f1c40f; }
                100% { box-shadow: 0 0 5px #f1c40f; }
            }
            /* Elementos Visuais do Cenário Geral */
            .interactive { position: absolute; cursor: pointer; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            .door { width: 90px; height: 160px; background: #8e44ad; border: 4px solid #2c3e50; border-radius: 4px; bottom: 40px; left: 355px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); transform-origin: left center; }
            .door::after { content: ''; position: absolute; right: 10px; top: 50%; width: 12px; height: 12px; background: #f1c40f; border-radius: 50%; }
            /* Reset do Jogo */
            #btn-reset-game { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.1); border: none; color: #999; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; z-index: 15px; }
            #btn-reset-game:hover { background: #e74c3c; color: white; }
        `;

        const styleTag = document.createElement('style');
        styleTag.innerHTML = css;
        document.head.appendChild(styleTag);
    };

    // Motor de Renderização de UI Dinâmica
    const RenderEngine = {
        viewport: null,
        stage: null,
        inventoryBar: null,

        buildBaseDOM() {
            this.viewport = document.createElement('div');
            this.viewport.id = 'game-viewport';

            // Menu Screen
            const menu = document.createElement('div');
            menu.id = 'menu-screen';
            menu.className = 'screen';
            menu.innerHTML = `
                <div class="game-title">Visual Escape Room<br><span style="font-size:16px; color:#bdc3c7; letter-spacing:1px;">DOM Engineering Prototype</span></div>
                <button class="btn" id="btn-play">Novo Jogo</button>
                <button class="btn" id="btn-continue" disabled>Continuar</button>
            `;
            this.viewport.appendChild(menu);

            // Jogo Principal
            this.stage = document.createElement('div');
            this.stage.id = 'stage';
            this.stage.style.display = 'none';
            this.viewport.appendChild(this.stage);

            // Barra de Inventário
            this.inventoryBar = document.createElement('div');
            this.inventoryBar.id = 'inventory-bar';
            this.inventoryBar.style.display = 'none';

            for (let i = 0; i < 6; i++) {
                const slot = document.createElement('div');
                slot.className = 'inv-slot';
                slot.dataset.index = i;
                slot.addEventListener('click', () => this.handleSlotClick(i));
                this.inventoryBar.appendChild(slot);
            }
            this.viewport.appendChild(this.inventoryBar);

            // Tela de Vitória Final
            const victory = document.createElement('div');
            victory.id = 'victory-screen';
            victory.className = 'screen';
            victory.innerHTML = `
                <div class="game-title">Parabéns!<br><span style="font-size:20px; color:#fff;">Você escapou de todas as 20 salas!</span></div>
                <button class="btn" id="btn-restart">Jogar Novamente</button>
            `;
            this.viewport.appendChild(victory);

            document.body.appendChild(this.viewport);
            this.bindMenuEvents();
        },

        bindMenuEvents() {
            const btnPlay = document.getElementById('btn-play');
            const btnContinue = document.getElementById('btn-continue');
            const btnRestart = document.getElementById('btn-restart');

            if (localStorage.getItem(CONFIG.storageKey)) {
                btnContinue.disabled = false;
            }

            btnPlay.addEventListener('click', () => {
                GameState.reset();
                this.transitionOutMenu();
            });

            btnContinue.addEventListener('click', () => {
                GameState.init();
                this.transitionOutMenu();
                this.loadPhase(GameState.currentPhase);
            });

            btnRestart.addEventListener('click', () => {
                document.getElementById('victory-screen').style.display = 'none';
                document.getElementById('menu-screen').style.display = 'flex';
                document.getElementById('menu-screen').style.opacity = '1';

                if (localStorage.getItem(CONFIG.storageKey)) {
                    document.getElementById('btn-continue').disabled = false;
                }
            });
        },

        transitionOutMenu() {
            const menu = document.getElementById('menu-screen');
            menu.style.opacity = '0';

            setTimeout(() => {
                menu.style.display = 'none';
                this.stage.style.display = 'block';
                this.inventoryBar.style.display = 'flex';
                this.loadPhase(GameState.currentPhase);
            }, 500);
        },

        updateInventoryUI() {
            const slots = this.inventoryBar.querySelectorAll('.inv-slot');

            slots.forEach((slot, index) => {
                slot.innerHTML = '';
                slot.classList.remove('selected');

                if (GameState.inventory[index]) {
                    const item = GameState.inventory[index];
                    const itemEl = document.createElement('div');
                    itemEl.className = 'inv-item';
                    itemEl.style.backgroundColor = item.color || '#f1c40f';
                    itemEl.innerText = item.icon || '?';
                    slot.appendChild(itemEl);

                    if (GameState.selectedItem === item) {
                        slot.classList.add('selected');
                    }
                }
            });
        },

        handleSlotClick(index) {
            if (GameState.inventory[index]) {
                if (GameState.selectedItem === GameState.inventory[index]) {
                    GameState.selectedItem = null; // Deselecionar
                } else {
                    GameState.selectedItem = GameState.inventory[index];
                }
                this.updateInventoryUI();
            }
        },

        addItemToInventory(id, icon, color) {
            if (GameState.inventory.length < 6) {
                GameState.inventory.push({ id, icon, color });
                this.updateInventoryUI();
            }
        },

        removeItemFromInventory(id) {
            GameState.inventory = GameState.inventory.filter(item => item.id !== id);

            if (GameState.selectedItem && GameState.selectedItem.id === id) {
                GameState.selectedItem = null;
            }
            this.updateInventoryUI();
        },

        loadPhase(phaseNum) {
            this.stage.innerHTML = '';
            GameState.selectedItem = null;
            this.updateInventoryUI();

            // Botão de Reinício Rápido
            const btnReset = document.createElement('button');
            btnReset.id = 'btn-reset-game';
            btnReset.innerText = 'Resetar Jogo';
            btnReset.addEventListener('click', () => {
                if (confirm("Deseja apagar todo o progresso salvo?")) {
                    GameState.reset();
                    location.reload();
                }
            });
            this.stage.appendChild(btnReset);

            if (phaseNum > 20) {
                this.stage.style.display = 'none';
                this.inventoryBar.style.display = 'none';
                const vic = document.getElementById('victory-screen');
                vic.style.display = 'flex';
                setTimeout(() => vic.style.opacity = '1', 50);
                return;
            }

            const title = document.createElement('div');
            title.id = 'phase-title';
            this.stage.appendChild(title);

            // Executa a fábrica da fase correspondente
            if (PhaseCatalog[phaseNum]) {
                PhaseCatalog[phaseNum](this.stage);

            }
        },

        triggerExitAnimation(doorElement, nextPhaseNum) {
            doorElement.style.transform = 'perspective(1200px) rotateY(-100deg)';
            doorElement.style.boxShadow = '0 0 30px rgba(241, 196, 15, 0.6)';

            setTimeout(() => {
                this.stage.style.opacity = '0';
                setTimeout(() => {
                    GameState.save(nextPhaseNum);
                    this.loadPhase(nextPhaseNum);
                    this.stage.style.opacity = '1';
                }, 500);
            }, 800);
        }
    };

    // ==========================================
    // PARTE 1: CATÁLOGO ESTRUTURADO DAS 20 FASES
    // ==========================================

    const PhaseCatalog = {};

    // ------------------------------------------------------------------------
    // Bloco A: Manipulação Direta e Deslocamento Linear (Fases 1 a 5 - Fácil)
    // ------------------------------------------------------------------------

    PhaseCatalog[1] = function (stage) {
        document.getElementById('phase-title').innerText = "Fase 1: O Escritório Trancado (Fácil)";
        stage.style.backgroundColor = "#34495e";
        GameState.phaseData = { paintingMoved: false, drawerOpen: false, hasKey: false };

        const door = document.createElement('div');
        door.className = 'interactive door';
        stage.appendChild(door);

        const painting = document.createElement('div');
        painting.className = 'interactive';
        painting.style.cssText = 'width:120px; height:90px; background:#d35400; border:6px solid #f39c12; left:100px; top:100px; z-index:2; box-shadow:0 10px 10px rgba(0,0,0,0.3);';
        painting.innerText = "🖼️";
        painting.style.fontSize = "40px";
        painting.style.textAlign = "center";
        stage.appendChild(painting);

        const safe = document.createElement('div');
        safe.className = 'interactive';
        safe.style.cssText = 'width:80px; height:70px; background:#7f8c8d; border:4px solid #95a5a6; left:120px; top:110px; z-index:1; display:flex; justify-content:center; align-items:center; color:white; font-weight:bold;';

        safe.innerText = "COFRE";
        stage.appendChild(safe);

        const desk = document.createElement('div');
        desk.className = 'interactive';
        desk.style.cssText = 'width:160px; height:100px; background:#a0522d; left:550px; bottom:40px; border-radius:4px;';
        stage.appendChild(desk);

        const drawer = document.createElement('div');
        drawer.className = 'interactive';
        drawer.style.cssText = 'width:140px; height:35px; background:#8b4513; left:10px; top:15px; border:2px solid #5c2e0b; transition:transform 0.4s;';
        drawer.innerHTML = '';
        desk.appendChild(drawer);

        const keyItem = document.createElement('div');
        keyItem.className = 'interactive';
        keyItem.style.cssText = 'font-size:24px; left:60px; top:5px; display:none;';
        keyItem.innerText = "🔑";
        drawer.appendChild(keyItem);

        painting.addEventListener('click', () => {
            if (!GameState.phaseData.paintingMoved) {
                painting.style.transform = 'translateX(130px)';
                GameState.phaseData.paintingMoved = true;
            } else {
                painting.style.transform = 'translateX(0px)';
                GameState.phaseData.paintingMoved = false;
            }
        });

        safe.addEventListener('click', () => {
            if (GameState.phaseData.paintingMoved) {
                safe.innerText = "ABERTO";
                safe.style.background = "#27ae60";
                keyItem.style.display = "block";
            }
        });

        drawer.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!GameState.phaseData.drawerOpen) {
                drawer.style.transform = 'translateY(40px)';
                GameState.phaseData.drawerOpen = true;
            }
        });

        keyItem.addEventListener('click', (e) => {
            e.stopPropagation();
            RenderEngine.addItemToInventory('desk_key', '🔑', '#f1c40f');
            keyItem.remove();
        });

        door.addEventListener('click', () => {
            if (GameState.selectedItem && GameState.selectedItem.id === 'desk_key') {
                RenderEngine.removeItemFromInventory('desk_key');
                RenderEngine.triggerExitAnimation(door, 2);
            }
        });
    };

    PhaseCatalog[2] = function (stage) {
        document.getElementById('phase-title').innerText = "Fase 2: O Sótão Esquecido (Fácil)";
        stage.style.backgroundColor = "#2c2c2c";
        GameState.phaseData = { curtainDrawn: false, boltUnlocked: false };

        const door = document.createElement('div');
        door.className = 'interactive door';
        stage.appendChild(door);

        const hatch = document.createElement('div');
        hatch.className = 'interactive';
        hatch.style.cssText = 'width:140px; height:140px; background:#4a3728; left:120px; top:200px; border:6px solid #2b1f16;';
        stage.appendChild(hatch);

        const boltTrack = document.createElement('div');
        boltTrack.style.cssText = 'width:80px; height:20px; background:#111; margin:40px auto; position:relative; border-radius:10px;';
        hatch.appendChild(boltTrack);

        const bolt = document.createElement('div');
        bolt.className = 'interactive';
        bolt.style.cssText = 'width:40px; height:28px; background:#7f8c8d; border:2px solid #bbb; border-radius:6px; top:-4px; left:0px; transition: left 0.3s;';
        boltTrack.appendChild(bolt);

        const curtain = document.createElement('div');
        curtain.className = 'interactive';
        curtain.style.cssText = 'width:200px; height:300px; background:#78281f; left:90px; top:120px; transition: transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1); box-shadow: 10px 0 15px rgba(0,0,0,0.5); border-right: 4px solid #943126;';
        stage.appendChild(curtain);

        curtain.addEventListener('click', () => {
            if (!GameState.phaseData.curtainDrawn) {
                curtain.style.transform = 'translateX(-160px) scaleX(0.3)';
                GameState.phaseData.curtainDrawn = true;
            } else {
                curtain.style.transform = 'translateX(0px) scaleX(1)';
                GameState.phaseData.curtainDrawn = false;
            }
        });

        bolt.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!GameState.phaseData.curtainDrawn) return;

            if (!GameState.phaseData.boltUnlocked) {
                bolt.style.left = '40px';
                bolt.style.backgroundColor = '#27ae60';
                GameState.phaseData.boltUnlocked = true;
                hatch.style.backgroundColor = '#5c4033';
            }
        });

        hatch.addEventListener('click', () => {
            if (GameState.phaseData.boltUnlocked) {
                hatch.style.transform = 'scale(0.1)';
                hatch.style.opacity = '0';
                setTimeout(() => {
                    RenderEngine.addItemToInventory('attic_key', '🗝️', '#b2b2b2');
                }, 400);
            }
        });

        door.addEventListener('click', () => {
            if (GameState.selectedItem && GameState.selectedItem.id === 'attic_key') {
                RenderEngine.removeItemFromInventory('attic_key');
                RenderEngine.triggerExitAnimation(door, 3);
            }
        });
    };

    PhaseCatalog[3] = function (stage) {
        document.getElementById('phase-title').innerText = "Fase 3: O Laboratório de Botânica (Fácil)";
        stage.style.backgroundColor = "#1e3020";
        GameState.phaseData = { order: [], target: ['red', 'green', 'blue'] };

        const door = document.createElement('div');
        door.className = 'interactive door';
        stage.appendChild(door);

        const colors = ['green', 'red', 'blue'];
        const plantsInfo = { green: '🌿', red: '🌹', blue: '💠' };

        colors.forEach((color, i) => {
            const shelf = document.createElement('div');
            shelf.className = 'interactive';
            shelf.style.cssText = `width:100px;height:130px;background:rgba(255,255,255,.1);border:3px solid #7f8c8d;top:180px;left:${120+i*160}px;border-radius:8px 8px 0 0;text-align:center;padding-top:40px;transition:border-color .3s;`;
            shelf.innerHTML = `<span style="font-size:40px;">${plantsInfo[color]}</span>`;
            stage.appendChild(shelf);

            shelf.addEventListener('click', () => {
                if (shelf.style.borderColor === 'rgb(39, 174, 96)') return;

                GameState.phaseData.order.push(color);
                shelf.style.borderColor = '#27ae60';
                shelf.style.backgroundColor = 'rgba(39, 174, 96, 0.2)';

                // Validação do Passo de Sequência
                const idx = GameState.phaseData.order.length - 1;

                if (GameState.phaseData.order[idx] !== GameState.phaseData.target[idx]) {
                    // Errou a sequência, reseta tudo
                    setTimeout(() => {
                        stage.querySelectorAll('.interactive').forEach(el => {
                            if (el !== door) {
                                el.style.borderColor = '#7f8c8d';
                                el.style.backgroundColor = 'rgba(255,255,255,0.1)';
                            }
                        });
                        GameState.phaseData.order = [];
                    }, 400);
                } else if (GameState.phaseData.order.length === 3) {
                    door.style.borderColor = '#27ae60';
                    GameState.phaseData.completed = true;
                }
            });
        });

        door.addEventListener('click', () => {
            if (GameState.phaseData.completed) {
                RenderEngine.triggerExitAnimation(door, 4);
            }
        });
    };

    PhaseCatalog[4] = function (stage) {
        document.getElementById('phase-title').innerText = "Fase 4: A Cabine de Comando (Fácil)";
        stage.style.backgroundColor = "#2c3e50";
        GameState.phaseData = { levels: [100, 100, 100], targets: [40, 120, 70] };
                if (currentTop < 10) currentTop = 140; // Loop deslizamento vertical
                handle.style.top = currentTop + 'px';
                GameState.phaseData.levels[i] = currentTop;
                checkWin();
            });
        }

        door.addEventListener('click', () => {
            if (GameState.phaseData.completed) {
                RenderEngine.triggerExitAnimation(door, 5);
            }
        });
    };

    PhaseCatalog[5] = function (stage) {
        document.getElementById('phase-title').innerText = "Fase 5: O Camarim de Teatro (Fácil)";
        stage.style.backgroundColor = "#4a235a";
        GameState.phaseData = { lights: [false, false, false, false] };

        const door = document.createElement('div');
        door.className = 'interactive door';
        stage.appendChild(door);

        const mirrorContainer = document.createElement('div');
        mirrorContainer.style.cssText = 'position:absolute; width:220px; height:260px; left:120px; top:120px; background:#333; padding:10px;';
        stage.appendChild(mirrorContainer);

        const hiddenKey = document.createElement('div');
        hiddenKey.className = 'interactive';
        hiddenKey.style.cssText = 'font-size:35px; left:80px; top:90px;';
        hiddenKey.innerText = "🔑";
        mirrorContainer.appendChild(hiddenKey);

        const mirror = document.createElement('div');
        mirror.style.cssText = 'width:100%; height:100%; background:linear-gradient(135deg, #bdc3c7, #ecf0f1); opacity:1; transition: opacity 0.6s; z-index:2; position:relative; pointer-events:none; box-shadow: inset 0 0 20px rgba(0,0,0,0.2);';
        mirrorContainer.appendChild(mirror);

        const positions = [
            { left: '100px', top: '70px' }, { left: '210px', top: '70px' },
            { left: '320px', top: '70px' }, { left: '210px', top: '400px' }
        ];

        positions.forEach((pos, idx) => {
            const light = document.createElement('div');
            light.className = 'interactive';
            light.style.cssText = `width:30px;height:30px;background:#555;border-radius:50%;left:${pos.left};top:${pos.top};border:2px solid #fff;box-shadow:none;`;
            stage.appendChild(light);

            light.addEventListener('click', () => {
                GameState.phaseData.lights[idx] = !GameState.phaseData.lights[idx];

                if (GameState.phaseData.lights[idx]) {
                    light.style.backgroundColor = '#f1c40f';
                    light.style.boxShadow = '0 0 15px #f1c40f';
                } else {
                    light.style.backgroundColor = '#555';
                    light.style.boxShadow = 'none';
                }

                const allOn = GameState.phaseData.lights.every(l => l === true);

                if (allOn) {
                    mirror.style.opacity = '0.15';
                } else {
                    mirror.style.opacity = '1';
                }
            });
        });

        hiddenKey.addEventListener('click', () => {
            if (GameState.phaseData.lights.every(l => l === true)) {
                RenderEngine.addItemToInventory('backstage_key', '🔑', '#f39c12');
                hiddenKey.remove();
            }
        });

        door.addEventListener('click', () => {
            if (GameState.selectedItem && GameState.selectedItem.id === 'backstage_key') {
            if (GameState.selectedItem && GameState.selectedItem.id === 'fuse_red') {
            pipe.style.cssText = `width:80px;height:80px;background:#566573;border:4px solid #34495e;left:${380+i*82}px;top:220px;transition:transform .3s;transform:rotate(${GameState.phaseData.rotations[i]}deg);`;
            if (GameState.selectedItem && GameState.selectedItem.id === 'cell_battery') {
        for (let i = 0; i < 4; i++) {
            const port = document.createElement('div');
            port.className = 'interactive';
            port.style.cssText = 'width:35px; height:30px; background:#222; border:2px solid #555; border-radius:3px; position:relative;';
            portRow.appendChild(port);

            port.addEventListener('click', () => {
                if (GameState.selectedItem && GameState.selectedItem.id === 'lan_cable') {
                    if (i === targetPortIdx) {
                        RenderEngine.removeItemFromInventory('lan_cable');
                        port.style.backgroundColor = '#3498db';
                        screen.style.backgroundColor = '#2980b9';
                        screen.innerText = "STATUS: ONLINE";
                        GameState.phaseData.connected = true;
                    } else {
                        // Feedback visual de erro piscando vermelho
                        screen.style.backgroundColor = '#962d22';
                        setTimeout(() => screen.style.backgroundColor = '#c0392b', 300);
                    }
                }
            });
        }

        cable.addEventListener('click', () => {
            RenderEngine.addItemToInventory('lan_cable', '🟦', '#3498db');
            cable.remove();
        });

        door.addEventListener('click', () => {
            if (GameState.phaseData.connected) {
                RenderEngine.triggerExitAnimation(door, 10);
            }
        });
    };

    // O material enviado termina durante a fase 9;
    // fases 10 a 20 não foram fornecidas.
    const originalLoadPhase = RenderEngine.loadPhase.bind(RenderEngine);

    RenderEngine.loadPhase = function (n) {
        if (n > 9 && n <= 20) {
            this.stage.innerHTML = '<div style="padding:110px 40px;color:white;text-align:center;font-size:25px">Você concluiu as 9 fases disponíveis!<p style="font-size:16px;margin-top:20px">As fases 10 a 20 não constavam no código recebido.</p></div>';
            GameState.save(10);
            return;
        }
        originalLoadPhase(n);
    };

    injectStyles();
    GameState.init();
    RenderEngine.buildBaseDOM();
})();
