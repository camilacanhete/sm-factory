import PiecesPool from "./PiecesPool";

type AssemblyCallback = (event: 'correct-piece' | 'wrong-piece' | 'assembly-complete', tableIndex: number) => void;

import Piece from './Piece'; // Assuming Piece is in the same folder

export default class TablesManager {
    private scene: Phaser.Scene;
    private tables: Phaser.GameObjects.Image[] = [];
    private hookYPositions: number[] = [];
    private tableReceipts: string[][] = [];
    private tableProgress: number[] = [];
    private tableReceiptsVisuals: Piece[][] = []; // Use Piece class for receipt visuals
    private assemblyCallback: AssemblyCallback | null = null;
    private static readonly RECEIPT_LENGTH = 4;
    private static readonly RECEIPT_SCALE = 0.15;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    init(spawnX: number, spawnY: number): void {
        const tableSpacing = 250;
        const tableX = spawnX + 300;
        const tableStartY = spawnY + 75;

        for (let i = 0; i < 2; i++) {
            const tableY = tableStartY + i * tableSpacing;
            const table = this.scene.add.image(tableX, tableY, 'table').setScale(0.5);
            this.tables.push(table);

            // Initialize receipt, progress, and visuals
            this.tableReceipts.push(this.generateRandomReceipt());
            this.tableProgress.push(0);
            this.tableReceiptsVisuals.push(this.createReceiptVisuals(i, tableX, tableY - 100)); // Adjust position above the table

            // Store Y positions for the hook
            this.hookYPositions.push(tableY);
        }
    }

    /**
     * Creates the receipt visuals above the given table.
     */
    private createReceiptVisuals(tableIndex: number, tableX: number, tableY: number): Piece[] {
        const receipt = this.tableReceipts[tableIndex];
        const visuals: Piece[] = [];
        const spriteSpacing = 20; // Space between sprites
        const totalWidth = (receipt.length - 1) * spriteSpacing; // Total width of the receipt visuals

        for (let i = 0; i < receipt.length; i++) {
            // Calculate x position so that the receipt is centered around (tableX, tableY)
            const x = tableX - totalWidth / 2 + i * spriteSpacing;

            // Create a Piece object and configure it
            const piece = new Piece(this.scene, x, tableY, receipt[i]);
            this.scene.add.existing(piece);
            piece.setScale(TablesManager.RECEIPT_SCALE);
            piece.setAlpha(1); // Slightly transparent for future steps
            piece.setActive(true);
            piece.setVisible(true);

            visuals.push(piece);
        }

        return visuals;
    }

    registerAssemblyCallback(callback: AssemblyCallback): void {
        this.assemblyCallback = callback;
    }

    /**
     * Updates the receipt visuals to reflect current progress.
     */
    private updateReceiptVisuals(tableIndex: number): void {
        const progress = this.tableProgress[tableIndex];
        const visuals = this.tableReceiptsVisuals[tableIndex];

        visuals.forEach((piece, index) => {
            if (index < progress) {
                piece.setAlpha(0.25);
            } else {
                piece.setAlpha(1);
            }
        });
    }

    /**
     * Validates the pushed piece against the current table's receipt.
     */
    validatePiece(tableIndex: number, pieceKey: string): void {
        const receipt = this.tableReceipts[tableIndex];
        const progress = this.tableProgress[tableIndex];

        if (pieceKey === receipt[progress]) {
            this.tableProgress[tableIndex]++;
            this.updateReceiptVisuals(tableIndex);

            if (this.tableProgress[tableIndex] === receipt.length) {
                this.assemblyCallback?.('assembly-complete', tableIndex);
                this.resetTable(tableIndex);
            } else {
                this.assemblyCallback?.('correct-piece', tableIndex);
            }
        } else {
            this.assemblyCallback?.('wrong-piece', tableIndex);
            this.resetTable(tableIndex);
        }
    }

    /**
     * Resets the table's receipt and progress.
     */
    private resetTable(tableIndex: number): void {
        this.tableReceipts[tableIndex] = this.generateRandomReceipt();
        this.tableProgress[tableIndex] = 0;

        // Destroy existing receipt visuals
        this.tableReceiptsVisuals[tableIndex].forEach(piece => piece.destroy());
        // Recreate visuals for the new receipt
        const tableX = this.tables[tableIndex].x;
        const tableY = this.tables[tableIndex].y - 100;
        this.tableReceiptsVisuals[tableIndex] = this.createReceiptVisuals(tableIndex, tableX, tableY);
    }

    private generateRandomReceipt(): string[] {
        const keys = PiecesPool.FACTORY_ITEM_KEYS; // Assume piece keys are accessible here
        return Array.from({ length: TablesManager.RECEIPT_LENGTH }, () =>
            keys[Phaser.Math.Between(0, keys.length - 1)]
        );
    }

    getTables(): Phaser.GameObjects.Image[] {
        return this.tables;
    }

    getHookYPositions(): number[] {
        return this.hookYPositions;
    }

    getTableReceipts(): string[][] {
        return this.tableReceipts;
    }
}
