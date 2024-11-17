import Piece from "./Piece";

export default class PiecesPool {
    public static readonly FACTORY_ITEM_KEYS: Array<string> = [
        'piece1', 'piece2', 'piece3', 'piece4'
    ];
    public static readonly MAX_SIZE: number = 10;

    private pieces: Piece[] = []; // Array to hold all the pieces
    private lastPieceKey: string = ""; // Store the last spawned piece key
    private availablePieces: Piece[] = []; // To track available (inactive) pieces

    constructor(private scene: Phaser.Scene) {}

    public init(): void {
        // Create the pool of pieces for each piece key and store inactive ones
        PiecesPool.FACTORY_ITEM_KEYS.forEach(pieceKey => {
            for (let i = 0; i < PiecesPool.MAX_SIZE; i++) {
                const piece = new Piece(this.scene, -100, -100, pieceKey); // Off-screen initially
                this.scene.add.existing(piece); // Add piece to the scene

                // Initially, all pieces are inactive and invisible
				piece.setScale(0.5);
                piece.setActive(false);
                piece.setVisible(false);

                this.pieces.push(piece); // Add to the pool
                this.availablePieces.push(piece); // Add to the available pool
            }
        });
    }

    // Get a random piece from the available pool
    private getRandomPiece(): Piece | null {
		// If no available pieces, return null
		if (this.availablePieces.length === 0) {
			return null;
		}

		// Filter out pieces with the last used key
		const filteredPieces = this.availablePieces.filter(piece => piece.texture.key !== this.lastPieceKey);

		// If all available pieces have the same key, fallback to the full pool
		const piecesToChooseFrom = filteredPieces.length > 0 ? filteredPieces : this.availablePieces;

		// Get a random piece from the filtered list
		const randomIndex: number = Phaser.Math.Between(0, piecesToChooseFrom.length - 1);
		const piece = piecesToChooseFrom[randomIndex];

		// Remove the selected piece from the available pool
		const indexInAvailable = this.availablePieces.indexOf(piece);
		if (indexInAvailable > -1) {
			this.availablePieces.splice(indexInAvailable, 1);
		}

		// Update the last piece key
		this.lastPieceKey = piece.texture.key;

		return piece;
	}


    public  spawn(x: number = 0, y: number = 0): Piece | null {
        // Get a random piece from the available pool
        const piece = this.getRandomPiece();

        if (!piece) {
            return null; // No available piece to spawn
        }

        piece.setPosition(x, y);
        piece.setActive(true); // Activate the piece
        piece.setVisible(true); // Make it visible
        piece.setTexture(piece.texture.key); // Ensure the correct texture is set

        // Enable the physics body for the piece
        this.scene.physics.world.enable(piece);

        return piece;
    }

    public despawn(piece: Piece): void {
        // Hide the piece and disable its physics body
        piece.setVisible(false);
        piece.setActive(false);
        piece.setPosition(-100, -100); // Move it off-screen

        this.scene.physics.world.disable(piece); // Disable physics for the piece

        // Return the piece to the available pool
        this.availablePieces.push(piece);
    }

    // Get all active pieces
    public getActivePieces(): Piece[] {
        return this.pieces.filter(piece => piece.active);
    }

	public getLength(): number {
		return this.pieces.length;
	}
}
