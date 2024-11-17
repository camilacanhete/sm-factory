import { Scene } from 'phaser';
import PiecesPool from '../components/PiecesPool';
import TablesManager from '../components/TablesManager';
import Piece from '../components/Piece';
import ScoreManager from '../components/ScoreManager';

export class Game1 extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    conveyorBelt: Phaser.GameObjects.Image;
    hook: Phaser.GameObjects.Image;
    btnUp: Phaser.GameObjects.Image;
    btnDown: Phaser.GameObjects.Image;
    btnSelect: Phaser.GameObjects.Image;
    piecesPool: PiecesPool;
    tablesManager: TablesManager;
    hookYPositions: number[] = []; // Stores valid Y positions for the hook (aligned with tables)
    hookIndex: number = 0; // Current index of hook position
    hookBusy: boolean = false; // Add this flag to track if the hook is busy
    spawnX: number = 200;
    spawnY: number = 125;
    scoreManager: ScoreManager;
    piecesSpawned: number = 0;
    spawnDelay: number = 3000; // Default to 1000 milliseconds
    spawnEvent: Phaser.Time.TimerEvent; // Store the reference to the spawn event

    constructor() {
        super('Game1');
    }

    create() {
        this.camera = this.cameras.main;

        // Initialize ScoreManager
        this.scoreManager = new ScoreManager(this);

        // Conveyor belt
        this.conveyorBelt = this.add.image(this.spawnX - 62.5, this.spawnY - 50, 'conveyor_belt')
            .setOrigin(0, 0)
            .setScale(0.5);

        // Initialize TablesManager
        this.tablesManager = new TablesManager(this);
        this.tablesManager.init(this.spawnX, this.spawnY);

        // Register callback for assembly events
        this.tablesManager.registerAssemblyCallback(this.handleAssemblyEvent.bind(this));

        // Sync hook positions with tables
        this.hookYPositions = this.tablesManager.getHookYPositions();

        // Add hook
        this.addHook();

        // Add control buttons
        this.addButtons();

        // Add pieces pool
        this.addPieces();

        // Periodically spawn pieces
        this.spawnEvent = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.trySpawnPiece,
            callbackScope: this,
            loop: true,
        });
    }


    addHook(): void {
        // Place hook initially aligned with the first table
        this.hook = this.physics.add.image(this.spawnX - 150, this.hookYPositions[0], 'hook')
            .setScale(0.65)
            .setImmovable(true); // Hook doesn't move from collisions
    }

    addButtons(): void {
        this.btnUp = this.add.image(100, 675, 'btn_up').setInteractive();
        this.btnDown = this.add.image(250, 675, 'btn_down').setInteractive();
        this.btnSelect = this.add.image(600, 675, 'btn_select').setInteractive();

        this.btnUp.on('pointerdown', this.moveHookUp, this);
        this.btnDown.on('pointerdown', this.moveHookDown, this);
        this.btnSelect.on('pointerdown', this.pushPieceToTable, this);
    }

    addPieces(): void {
        this.piecesPool = new PiecesPool(this);
        this.piecesPool.init(); // Initialize the pool of pieces
    }

    trySpawnPiece(): void {
        console.log('spawning', this.spawnEvent.delay);
        const minSpacing = 50 + 10; // pieceSize + threshold
        const canSpawn = this.piecesPool.getActivePieces().every(piece => piece.y > this.spawnY + minSpacing);

        if (canSpawn && this.piecesPool.getLength() > 0) {
            // Check if game is over before trying to spawn a new piece
            if (this.scoreManager.getMoney() - 100 <= 0) {
                this.gameOver();
            } else {
                this.spawnPiece();
                this.scoreManager.decreaseMoney(100); // Deduct money for each piece spawned
                this.piecesSpawned++;
                this.updateSpawnRate();
            }
        }
    }

    updateSpawnRate(): void {
        let spawnDelay: number = 0;
        if (this.piecesSpawned >= 0 && this.piecesSpawned <= 15) {
            spawnDelay = 2750;
        } else if (this.piecesSpawned >= 16 && this.piecesSpawned <= 25) {
            spawnDelay = 2500;
        } else if (this.piecesSpawned >= 26 && this.piecesSpawned <= 50) {
            spawnDelay = 2250;
        } else if (this.piecesSpawned >= 51 && this.piecesSpawned <= 75) {
            spawnDelay = 1750;
        } else if (this.piecesSpawned >= 76 && this.piecesSpawned <= 100) {
            spawnDelay = 1500;
        } else {
            spawnDelay = 1000; // Max difficulty (100+ pieces)
        }

        // Update the time event's delay to reflect the new spawn rate
        if(spawnDelay !== this.spawnDelay) {
            console.log('Changed spawn delay from', this.spawnDelay, "to", spawnDelay);
            this.spawnDelay = spawnDelay;
            this.spawnEvent.remove();
            this.spawnEvent = this.time.addEvent({
                delay: this.spawnDelay,
                callback: this.trySpawnPiece,
                callbackScope: this,
                loop: true,
            });
        }
    }

    private gameOver(): void {
        console.log("Game Over! Your factory has run out of money.");

        // Save the final score in the registry to display on the GameOver scene
        this.registry.set('finalScore', this.scoreManager.getMoney());

        // Transition to the GameOver scene
        this.scene.start('GameOver');
    }

    spawnPiece(): void {
        const piece = this.piecesPool.spawn(this.spawnX, this.spawnY);

        if (!piece) return;

        // Move piece along the conveyor belt and remove it at the end
        this.tweens.add({
            targets: piece,
            y: this.spawnY + 400, // Adjust this to match the end of the conveyor belt
            duration: 5000,
            onComplete: () => this.recyclePiece(piece), // Recycle the piece when the tween completes
        });
    }

    moveHookUp(): void {
        if (this.hookIndex > 0) {
            this.hookIndex--;
            this.hook.setY(this.hookYPositions[this.hookIndex]);
        }
    }

    moveHookDown(): void {
        if (this.hookIndex < this.hookYPositions.length - 1) {
            this.hookIndex++;
            this.hook.setY(this.hookYPositions[this.hookIndex]);
        }
    }

    pushPieceToTable(): void {
        if (this.hookBusy) return; // Prevent multiple actions
        this.hookBusy = true; // Mark hook as busy

        const hookTargetX = this.hook.x + 50; // Target position for the hook

        // Move the hook forward
        this.tweens.add({
            targets: this.hook,
            x: hookTargetX,
            duration: 200,
            onComplete: () => {
                let selectedPiece: Piece | null = null; // Initialize as null
                let maxOverlap = 0;

                // Find the piece with the maximum overlap
                this.piecesPool.getActivePieces().forEach((piece: Piece) => {
                    if (this.physics.world.overlap(this.hook, piece)) {
                        const overlap = Phaser.Geom.Rectangle.Intersection(
                            this.hook.getBounds(),
                            piece.getBounds()
                        );
                        const overlapArea = overlap.width * overlap.height;

                        if (overlapArea > maxOverlap) {
                            maxOverlap = overlapArea;
                            selectedPiece = piece; // Assign the piece
                        }
                    }
                });

                if (selectedPiece) {
                    const targetTableIndex = this.hookIndex;
                    //@ts-ignore
                    const pieceKey = selectedPiece.texture.key; // Access texture safely

                    // Validate piece against the table
                    this.tablesManager.validatePiece(targetTableIndex, pieceKey);

                    // Stop movement of the selected piece
                    this.tweens.killTweensOf(selectedPiece);

                    // Move the piece to the table position
                    this.tweens.add({
                        targets: selectedPiece,
                        x: this.tablesManager.getTables()[targetTableIndex].x,
                        y: this.tablesManager.getTables()[targetTableIndex].y,
                        duration: 1000,
                        onComplete: () => this.recyclePiece(selectedPiece!),
                    });
                }

                // Move the hook back to its original position
                this.tweens.add({
                    targets: this.hook,
                    x: this.hook.x - 50,
                    duration: 200,
                    onComplete: () => {
                        this.hookBusy = false; // Mark hook as ready
                    },
                });
            },
        });
    }


    recyclePiece(piece: Phaser.Physics.Arcade.Image): void {
        this.piecesPool.despawn(piece);
    }

    private handleAssemblyEvent(event: 'correct-piece' | 'wrong-piece' | 'assembly-complete', tableIndex: number): void {
        switch (event) {
            case 'correct-piece':
                console.log(`Table ${tableIndex}: Correct piece!`);
                break;
            case 'wrong-piece':
                console.log(`Table ${tableIndex}: Wrong piece, resetting.`);
                this.scoreManager.penaltyForWaste();
                break;
            case 'assembly-complete':
                console.log(`Table ${tableIndex}: Assembly complete!`);
                this.scoreManager.assemblyCompleted();
                break;
        }
    }
}
