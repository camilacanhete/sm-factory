import { _decorator, Component, Node, instantiate, view, Vec3, RigidBody } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ObjectPool')
export class ObjectPool extends Component {
    @property([Node])
    prefabs: Node[] = []; // Array of different prefabs

    @property
    poolSize: number = 10;

    private pool: Map<Node, Node[]> = new Map(); // Pool per prefab type
    private activeObjects: Node[] = [];

    private createTimer: number = 0;
    private removeTimer: number = 0;
    private createInterval: number = 2;
    private removeInterval: number = 4;

    onLoad() {
        this.initPool();
    }

    // Initialize the pool by creating instances of each prefab type
    private initPool() {
        for (const prefab of this.prefabs) {
            this.pool.set(prefab, []);
            for (let i = 0; i < this.poolSize; i++) {
                const obj = instantiate(prefab);
                obj.active = false;
                this.pool.get(prefab).push(obj);
                this.node.addChild(obj);
            }
        }
    }

    // Retrieve a random object from a random prefab type in the pool
    getObject(): Node {
        const prefab = this.getRandomPrefab();
        let obj = this.pool.get(prefab).pop();

        // If the pool for this prefab is empty, instantiate a new one
        if (!obj) {
            obj = instantiate(prefab);
            this.node.addChild(obj);
        }

        obj.active = true;
        this.activeObjects.push(obj);
        return obj;
    }

    // Return an object to the correct prefab pool
    releaseObject(obj: Node) {
        obj.active = false;
        const prefabType = this.getPrefabType(obj);

        if (prefabType) {
            const index = this.activeObjects.indexOf(obj);
            if (index > -1) this.activeObjects.splice(index, 1);
            this.pool.get(prefabType).push(obj);
        }
    }

    // Update for creating/removing objects at intervals
    update(dt: number) {
        this.createTimer += dt;
        this.removeTimer += dt;

        if (this.createTimer >= this.createInterval) {
            this.createTimer = 0;
            const obj = this.getObject();
            obj.setPosition(this.getRandomScreenPosition());

            // Activate gravity and set initial velocity if needed
            const rigidBody = obj.getComponent(RigidBody);
            if (rigidBody) {
                rigidBody.useGravity = true; // Enable gravity on this object
                rigidBody.wakeUp();          // Ensure it starts falling immediately
            }
        }

        if (this.removeTimer >= this.removeInterval && this.activeObjects.length > 0) {
            this.removeTimer = 0;
            const objToRemove = this.activeObjects[0];
            this.releaseObject(objToRemove);
        }
    }

    // Set a random screen position for the object
    private getRandomScreenPosition(): Vec3 {
        // const screenWidth = view.getVisibleSize().width;
        // const screenHeight = view.getVisibleSize().height;

        const screenWidth = 1;
        const screenHeight = 2;

        const randomX = Math.random() * screenWidth - screenWidth / 2;
        const randomY = Math.random() * screenHeight - screenHeight / 2;

        return new Vec3(0, 1, 0);
    }

    // Helper to retrieve a random prefab from the list
    private getRandomPrefab(): Node {
        const randomIndex = Math.floor(Math.random() * this.prefabs.length);
        return this.prefabs[randomIndex];
    }

    // Helper to find the prefab type for a given object
    private getPrefabType(obj: Node): Node | null {
        for (const prefab of this.prefabs) {
            if (obj.name === prefab.name) {
                return prefab;
            }
        }
        return null;
    }

    // Function for GameController to request a random object for a specific level
    getRandomObjectForLevel(level: number): Node {
        // Modify selection logic based on level if necessary
        // Example: increase rarity or limit available prefabs
        return this.getObject();
    }
}
