export default class Piece extends Phaser.Physics.Arcade.Image {
	constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
		super(scene, x, y, key);
	}
}