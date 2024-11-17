import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MainController')
export class MainController extends Component {

    protected onEnable(): void {}
    protected start(): void {}
    protected update(dt: number): void {}
    //protected lateUpdate(dt: number): void {}
    protected onDisable(): void {}
    protected onDestroy(): void {}
}
