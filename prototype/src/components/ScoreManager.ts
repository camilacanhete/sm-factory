export default class ScoreManager {
    private money: number;
    private piecesAssembled: number;
    private moneyText: Phaser.GameObjects.Text;
    private gameOver: boolean;

    constructor(scene: Phaser.Scene) {
        this.money = 10000; // Starting money
        this.piecesAssembled = 0;

        // Create a text object to display money on the UI
        this.moneyText = scene.add.text(
            scene.cameras.main.width - 150,
            20,
            `Money: $${this.money}`,
            { fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                stroke: '#000000', strokeThickness: 8,
                align: 'center' }
        );
        this.moneyText.setOrigin(1, 0); // Align the text to the right-top of the screen
    }

    decreaseMoney(amount: number): void {
        if (this.gameOver) return;

        this.money -= amount;
        this.updateMoneyUI();
    }

    increaseMoney(amount: number): void {
        if (this.gameOver) return;

        this.money += amount;
        this.updateMoneyUI();
    }

    penaltyForWaste(): void {
        if (this.gameOver) return;

        const penalty = (this.piecesAssembled * 100) + 2500;
        this.decreaseMoney(penalty);
    }

    assemblyCompleted(): void {
        if (this.gameOver) return;

        this.piecesAssembled += 1;
        this.increaseMoney(5000); // Gain money for successful assembly
    }

    updateMoneyUI(): void {
        this.moneyText.setText(`Money: $${this.money}`);
    }

    getMoney(): number {
        return this.money;
    }

}
